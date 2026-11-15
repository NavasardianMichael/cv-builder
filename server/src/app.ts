import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { config, isGoogleOAuthConfigured, isPaymentConfigured } from './config.js'
import { fail, ok } from './lib/api-response.js'
import { prisma } from './lib/prisma.js'
import { optionalAuth } from './middleware/auth.js'
import { requireSameOrigin } from './middleware/csrf.js'
import { asyncHandler, errorHandler } from './middleware/error.js'
import { contactRouter } from './routes/contact.js'
import { cvsRouter } from './routes/cvs.js'
import { identityRouter } from './routes/identity.js'
import { paymentsRouter } from './routes/payments.js'
import { pdfRouter } from './routes/pdf.js'
import { purchasesRouter } from './routes/purchases.js'
import { PASS_DAYS, PASS_PRICE_AMD } from './services/pricing.js'

export function createApp() {
  const app = express()

  // Exactly one hop (nginx). Never `true`, which would trust a client-supplied
  // X-Forwarded-For and collapse every per-IP rate limit.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  // Responses are JSON or a PDF attachment: no browser should sniff them into something else.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  })

  // `maxAge`: the web is another origin, so every JSON write is preflighted; without it Chrome
  // forgets a preflight after 5 s and autosave pays an extra round trip on almost every save.
  app.use(cors({ origin: config.corsOrigin, credentials: true, maxAge: 7200 }))
  app.use(cookieParser())
  // A CV with an embedded photo is up to ~1MB of JSON.
  app.use(express.json({ limit: '2mb' }))

  // Gateway returns and the mock bank page are GET navigations from another origin, so they
  // sit before requireSameOrigin (which only guards state-changing methods anyway).
  app.use('/payments', paymentsRouter)

  app.use(requireSameOrigin)
  app.use(optionalAuth)

  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      // Down when the database is: the deploy's health wait and the uptime monitor rely on it.
      try {
        await prisma.$queryRaw`SELECT 1`
      } catch {
        return fail(res, 'Database unavailable', 503, 503)
      }
      // `google` decides whether the web renders the Google button; one source of truth.
      ok(res, { status: 'ok', google: isGoogleOAuthConfigured(), payments: isPaymentConfigured(), priceAmd: PASS_PRICE_AMD, passDays: PASS_DAYS })
    })
  )

  app.use('/identity', identityRouter)
  app.use('/cvs', cvsRouter)
  app.use('/purchases', purchasesRouter)
  app.use('/contact', contactRouter)
  app.use('/pdf', pdfRouter)

  app.use((_req, res) => fail(res, 'Not found', 404, 404))
  app.use(errorHandler)

  return app
}
