import { Prisma } from '@prisma/client'
import { type Request, Router } from 'express'
import { fail, ok } from '../lib/api-response.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { ensureGuestKeyHash } from '../lib/guest.js'
import { sendPdf } from '../lib/pdf-response.js'
import { prisma } from '../lib/prisma.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import { readRequestInfo } from '../lib/request-info.js'
import { mapCv } from '../mappers/entities.js'
import { type CvOwner, cvOwnerOf, ownerKey, requireCvOwner } from '../middleware/auth.js'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { BASIC_DESIGN, basicContent } from '../services/basicCv.js'
import { coerceContent, coerceDesign, coerceTitle, DEFAULT_CV_TITLE } from '../services/cvDocument.js'
import { runningPass } from '../services/payments.js'

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

cvsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    ok(res, mapCv(await loadOwnedCv(req)))
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
    ok(res, { updatedAt: updated.updatedAt.toISOString() })
  })
)

/**
 * The designed PDF: the CV as the user styled it, in any template — while its owner's access
 * pass runs (`runningPass`, which also settles a payment whose redirect was lost and drops the
 * days of one refunded at the bank). Every one sent in full is recorded against the pass's
 * latest payment (`PdfDownload`): the evidence a "could not download it" refund claim is
 * checked against, and a sign of use for the retention rule.
 */
cvsRouter.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const cv = await loadOwnedCv(req)
    const pass = await runningPass(cvOwnerOf(req), { source: 'pdf-download', request: readRequestInfo(req) })
    if (!pass) return fail(res, 'Full access required', ERROR_CODE.accessRequired, 402)
    if (!pdfAllowed(req)) return fail(res, 'Too many downloads', ERROR_CODE.rateLimited, 429)

    const ip = req.ip ?? null
    const userAgent = req.get('user-agent')?.slice(0, 500) ?? null
    await sendPdf(
      res,
      cv.id,
      { title: cv.title, content: coerceContent(cv.content), design: coerceDesign(cv.design), watermark: false },
      async (bytes) => {
        await prisma.pdfDownload.create({ data: { cvId: cv.id, paymentId: pass.paymentId, variant: 'designed', bytes, ip, userAgent } })
      }
    )
  })
)

/**
 * The free PDF, for anyone, with or without a pass: the same text in the fixed black-and-white
 * design (`services/basicCv.ts`), watermarked. Recorded too (`variant: basic`): a download is
 * a sign of use for the retention rule.
 */
cvsRouter.get(
  '/:id/pdf/basic',
  asyncHandler(async (req, res) => {
    const cv = await loadOwnedCv(req)
    if (!pdfAllowed(req)) return fail(res, 'Too many downloads', ERROR_CODE.rateLimited, 429)

    const ip = req.ip ?? null
    const userAgent = req.get('user-agent')?.slice(0, 500) ?? null
    await sendPdf(
      res,
      cv.id,
      { title: cv.title, content: basicContent(coerceContent(cv.content)), design: BASIC_DESIGN, watermark: true },
      async (bytes) => {
        await prisma.pdfDownload.create({ data: { cvId: cv.id, paymentId: null, variant: 'basic', bytes, ip, userAgent } })
      }
    )
  })
)
