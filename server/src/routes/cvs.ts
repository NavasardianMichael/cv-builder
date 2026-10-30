import { Prisma } from '@prisma/client'
import { type Request, Router } from 'express'
import { isPaymentConfigured } from '../config.js'
import { fail, ok } from '../lib/api-response.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { ensureGuestKeyHash } from '../lib/guest.js'
import { sendPdf } from '../lib/pdf-response.js'
import { prisma } from '../lib/prisma.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import { mapCv } from '../mappers/entities.js'
import { type CvOwner, cvOwnerOf, ownerKey, requireCvOwner } from '../middleware/auth.js'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { BASIC_DESIGN, basicContent } from '../services/basicCv.js'
import { coerceContent, coerceDesign, coerceTitle, DEFAULT_CV_TITLE } from '../services/cvDocument.js'
import { reconcileCvPayments, startCheckout } from '../services/payments.js'

/**
 * A user's CVs — or a guest's: the CVs a browser bought without an account, owned by its
 * guest key (`lib/guest.ts`). Every route is scoped to that owner (`requireCvOwner`): a CV id
 * that is not theirs answers 404, the same as one that does not exist.
 */
export const cvsRouter = Router()

const MAX_CVS_PER_USER = 50
/** A guest only makes a server CV to buy it; a handful covers that, and caps a script. */
const MAX_CVS_PER_GUEST = 10

const guestCreateLimiter = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 })
const checkoutLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 })
const pdfLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60 * 1000 })

const maxCvs = (owner: CvOwner): number => ('userId' in owner ? MAX_CVS_PER_USER : MAX_CVS_PER_GUEST)

const loadOwnedCv = async (req: Request) => {
  const cv = await prisma.cv.findFirst({ where: { id: String(req.params.id), ...cvOwnerOf(req) } })
  if (!cv) throw new HttpError(404, 'Not found', 404)
  return cv
}

/** One budget for both PDF variants. */
const pdfAllowed = (req: Request): boolean => pdfLimiter(ownerKey(cvOwnerOf(req))).allowed

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue

/**
 * Also how a guest's local draft is imported after sign-in: it arrives as the body. Without a
 * session it is a guest buying without an account: the request mints the browser's guest key,
 * which then owns the CV. Registered before `requireCvOwner`, which would refuse that guest.
 */
cvsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    let owner: CvOwner
    if (req.session) owner = { userId: req.session.userId }
    else {
      const verdict = guestCreateLimiter(req.ip ?? 'unknown')
      if (!verdict.allowed) return fail(res, 'Too many attempts', ERROR_CODE.rateLimited, 429)
      owner = { guestKeyHash: ensureGuestKeyHash(req, res) }
    }
    const count = await prisma.cv.count({ where: owner })
    if (count >= maxCvs(owner)) return fail(res, 'CV limit reached', ERROR_CODE.cvLimitReached, 409)

    const design = coerceDesign(req.body?.design)
    const cv = await prisma.cv.create({
      data: {
        ...owner,
        title: coerceTitle(req.body?.title, DEFAULT_CV_TITLE),
        templateId: design.templateId,
        content: asJson(coerceContent(req.body?.content)),
        design: asJson(design),
      },
    })
    ok(res, mapCv(cv), 201)
  })
)

cvsRouter.use(requireCvOwner)

cvsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const cvs = await prisma.cv.findMany({ where: cvOwnerOf(req), orderBy: { updatedAt: 'desc' } })
    ok(res, cvs.map(mapCv))
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
    const owner = cvOwnerOf(req)
    if ((await prisma.cv.count({ where: owner })) >= maxCvs(owner)) {
      return fail(res, 'CV limit reached', ERROR_CODE.cvLimitReached, 409)
    }
    const copy = await prisma.cv.create({
      data: {
        ...owner,
        title: coerceTitle(`${source.title} (պատճեն)`, DEFAULT_CV_TITLE),
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

    const verdict = checkoutLimiter(ownerKey(cvOwnerOf(req)))
    if (!verdict.allowed) return fail(res, 'Too many attempts', ERROR_CODE.rateLimited, 429)

    const redirectUrl = await startCheckout({ id: cv.id, title: cv.title, userId: cv.userId })
    ok(res, { redirectUrl })
  })
)

/** The designed PDF: the CV as the user styled it. Paid. */
cvsRouter.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    let cv = await loadOwnedCv(req)
    if (!cv.paidAt && (await reconcileCvPayments(cv.id))) cv = await loadOwnedCv(req)
    if (!cv.paidAt) return fail(res, 'Payment required', ERROR_CODE.cvNotPaid, 402)
    if (!pdfAllowed(req)) return fail(res, 'Too many downloads', ERROR_CODE.rateLimited, 429)

    await sendPdf(res, cv.id, {
      title: cv.title,
      content: coerceContent(cv.content),
      design: coerceDesign(cv.design),
      watermark: false,
    })
  })
)

/** The free PDF: the same text in the fixed black-and-white design (`services/basicCv.ts`), watermarked. */
cvsRouter.get(
  '/:id/pdf/basic',
  asyncHandler(async (req, res) => {
    const cv = await loadOwnedCv(req)
    if (!pdfAllowed(req)) return fail(res, 'Too many downloads', ERROR_CODE.rateLimited, 429)

    await sendPdf(res, cv.id, {
      title: cv.title,
      content: basicContent(coerceContent(cv.content)),
      design: BASIC_DESIGN,
      watermark: true,
    })
  })
)
