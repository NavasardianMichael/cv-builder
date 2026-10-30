import { Router } from 'express'
import { fail } from '../lib/api-response.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { sendPdf } from '../lib/pdf-response.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import { asyncHandler } from '../middleware/error.js'
import { BASIC_DESIGN, basicContent } from '../services/basicCv.js'
import { coerceContent, coerceTitle, DEFAULT_CV_TITLE } from '../services/cvDocument.js'

/**
 * The free PDF of a document the server does not hold: a guest's local draft. No account and
 * no storage — the body is coerced like any CV write, reduced to the black-and-white design,
 * printed, and forgotten. Public, so it is limited per IP; the print queue's own cap
 * (`MAX_WAITING` in services/pdf.ts) bounds what many IPs together can stack up.
 */
export const pdfRouter = Router()

const basicPdfLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 })

pdfRouter.post(
  '/basic',
  asyncHandler(async (req, res) => {
    const verdict = basicPdfLimiter(req.ip ?? 'unknown')
    if (!verdict.allowed) {
      res.setHeader('Retry-After', String(verdict.retryAfterSeconds))
      return fail(res, 'Too many downloads', ERROR_CODE.rateLimited, 429)
    }
    await sendPdf(res, 'a guest draft', {
      title: coerceTitle(req.body?.title, DEFAULT_CV_TITLE),
      content: basicContent(coerceContent(req.body?.content)),
      design: BASIC_DESIGN,
      watermark: true,
    })
  })
)
