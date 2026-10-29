import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { config, isGoogleOAuthConfigured, isPaymentConfigured } from './config.js'
import { fail, ok } from './lib/api-response.js'
import { optionalAuth } from './middleware/auth.js'
import { requireSameOrigin } from './middleware/csrf.js'
import { errorHandler } from './middleware/error.js'
import { cvsRouter } from './routes/cvs.js'
import { identityRouter } from './routes/identity.js'
import { paymentsRouter } from './routes/payments.js'
import { CV_PRICE_AMD } from './services/pricing.js'

export function createApp() {
  const app = express()

  // Exactly one hop (nginx). Never `true`, which would trust a client-supplied
  // X-Forwarded-For and collapse every per-IP rate limit.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(cors({ origin: config.corsOrigin, credentials: true }))
  app.use(cookieParser())
  // A CV with an embedded photo is up to ~1MB of JSON.
  app.use(express.json({ limit: '2mb' }))

  // Gateway returns and the mock bank page are GET navigations from another origin, so they
  // sit before requireSameOrigin (which only guards state-changing methods anyway).
  app.use('/payments', paymentsRouter)

  app.use(requireSameOrigin)
  app.use(optionalAuth)

  app.get('/health', (_req, res) => {
    // `google` decides whether the web renders the Google button; one source of truth.
    ok(res, { status: 'ok', google: isGoogleOAuthConfigured(), payments: isPaymentConfigured(), priceAmd: CV_PRICE_AMD })
  })

  app.use('/identity', identityRouter)
  app.use('/cvs', cvsRouter)

  app.use((_req, res) => fail(res, 'Not found', 404, 404))
  app.use(errorHandler)

  return app
}
