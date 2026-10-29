import { Prisma } from '@prisma/client'
import { type Request, Router } from 'express'
import { isPaymentConfigured } from '../config.js'
import { fail, ok } from '../lib/api-response.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { prisma } from '../lib/prisma.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import { mapCv } from '../mappers/entities.js'
import { requireAuth, sessionOf } from '../middleware/auth.js'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { coerceContent, coerceDesign, coerceTitle } from '../services/cvDocument.js'
import { reconcileCvPayments, startCheckout } from '../services/payments.js'
import { pdfFileName, renderCvPdf } from '../services/pdf.js'

/**
 * A signed-in user's CVs. Every route is scoped to the session's user: a CV id that is not
 * theirs answers 404, the same as one that does not exist.
 */
export const cvsRouter = Router()

cvsRouter.use(requireAuth)

const MAX_CVS_PER_USER = 50
const DEFAULT_TITLE = 'Իմ ռեզյումեն'

const checkoutLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 })
const pdfLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 })

const loadOwnedCv = async (req: Request) => {
  const cv = await prisma.cv.findFirst({ where: { id: String(req.params.id), userId: sessionOf(req).userId } })
  if (!cv) throw new HttpError(404, 'Not found', 404)
  return cv
}

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue

cvsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const cvs = await prisma.cv.findMany({ where: { userId: sessionOf(req).userId }, orderBy: { updatedAt: 'desc' } })
    ok(res, cvs.map(mapCv))
  })
)

/** Also how a guest's local draft is imported after sign-in: it arrives as the body. */
cvsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = sessionOf(req).userId
    const count = await prisma.cv.count({ where: { userId } })
    if (count >= MAX_CVS_PER_USER) return fail(res, 'CV limit reached', ERROR_CODE.cvLimitReached, 409)

    const design = coerceDesign(req.body?.design)
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: coerceTitle(req.body?.title, DEFAULT_TITLE),
        templateId: design.templateId,
        content: asJson(coerceContent(req.body?.content)),
        design: asJson(design),
      },
    })
    ok(res, mapCv(cv), 201)
  })
)

/** Reading an unpaid CV re-checks its recent pending payments (a tab closed mid-redirect). */
cvsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    let cv = await loadOwnedCv(req)
    if (!cv.paidAt && (await reconcileCvPayments(cv.id))) cv = await loadOwnedCv(req)
    ok(res, mapCv(cv))
  })
)

/** The autosave. Partial: only the fields sent are written. Answers the stamps, not the body. */
cvsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const cv = await loadOwnedCv(req)
    const data: Prisma.CvUpdateInput = {}
    if (req.body?.title !== undefined) data.title = coerceTitle(req.body.title, cv.title)
    if (req.body?.content !== undefined) data.content = asJson(coerceContent(req.body.content))
    if (req.body?.design !== undefined) {
      const design = coerceDesign(req.body.design)
      data.design = asJson(design)
      data.templateId = design.templateId
    }
    const updated = await prisma.cv.update({ where: { id: cv.id }, data })
    ok(res, { updatedAt: updated.updatedAt.toISOString(), paidAt: updated.paidAt?.toISOString() ?? null })
  })
)

/** A copy is a new document: it is not paid for. */
cvsRouter.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const source = await loadOwnedCv(req)
    const userId = sessionOf(req).userId
    if ((await prisma.cv.count({ where: { userId } })) >= MAX_CVS_PER_USER) {
      return fail(res, 'CV limit reached', ERROR_CODE.cvLimitReached, 409)
    }
    const copy = await prisma.cv.create({
      data: {
        userId,
        title: coerceTitle(`${source.title} (պատճեն)`, DEFAULT_TITLE),
        templateId: source.templateId,
        content: asJson(source.content),
        design: asJson(source.design),
      },
    })
    ok(res, mapCv(copy), 201)
  })
)

cvsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const cv = await loadOwnedCv(req)
    await prisma.cv.delete({ where: { id: cv.id } })
    ok(res, null)
  })
)

cvsRouter.post(
  '/:id/checkout',
  asyncHandler(async (req, res) => {
    const cv = await loadOwnedCv(req)
    if (cv.paidAt) return fail(res, 'This CV is already paid for', ERROR_CODE.cvAlreadyPaid, 409)
    if (!isPaymentConfigured()) return fail(res, 'Payments are unavailable', ERROR_CODE.paymentsUnavailable, 503)

    const verdict = checkoutLimiter(sessionOf(req).userId)
    if (!verdict.allowed) return fail(res, 'Too many attempts', ERROR_CODE.rateLimited, 429)

    const redirectUrl = await startCheckout({ id: cv.id, title: cv.title, userId: cv.userId })
    ok(res, { redirectUrl })
  })
)

cvsRouter.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    let cv = await loadOwnedCv(req)
    if (!cv.paidAt && (await reconcileCvPayments(cv.id))) cv = await loadOwnedCv(req)
    if (!cv.paidAt) return fail(res, 'Payment required', ERROR_CODE.cvNotPaid, 402)

    const verdict = pdfLimiter(sessionOf(req).userId)
    if (!verdict.allowed) return fail(res, 'Too many downloads', ERROR_CODE.rateLimited, 429)

    let pdf: Uint8Array
    try {
      pdf = await renderCvPdf({ title: cv.title, content: coerceContent(cv.content), design: coerceDesign(cv.design) })
    } catch (error) {
      console.error(`[pdf] render of ${cv.id} failed`, error)
      return fail(res, 'PDF could not be generated', ERROR_CODE.pdfFailed, 500)
    }

    const fileName = pdfFileName(cv.title)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Cache-Control', 'private, no-store')
    // RFC 6266: an ASCII fallback plus the UTF-8 name, which keeps Armenian titles intact.
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    )
    res.end(Buffer.from(pdf))
  })
)
