import { coerceContent } from './cvDocument.js'
import { buildPaymentMail, type PaymentFacts, type PaymentMailEvent, type SettleSource } from './paymentMail.js'
import { config } from '../config.js'
import { type InternalMailPayload, isMailConfigured, sendInternalMail } from '../lib/mail.js'
import { prisma } from '../lib/prisma.js'
import { createRateLimiter } from '../lib/rateLimit.js'
import type { RequestInfo } from '../lib/request-info.js'

/**
 * Tells the admin inbox (the mail engine's internal endpoint) when a buyer clicks "pay" and
 * when a payment settles. Best effort: callers fire and forget, every failure is logged here
 * and nothing is thrown — a notification must never stand between a buyer and the bank.
 *
 * - `started` is sent from `startCheckout`, once the gateway answered (or refused).
 * - `succeeded` is sent from `settlePayment` by the caller that won the `pending → succeeded`
 *   claim, so exactly once per payment whichever path settled it.
 */

/**
 * The engine allows 10 sends a minute for this whole server, shared with verification and
 * password mail (`lib/rateLimit.ts`). Real buyers come nowhere near this; a script clicking
 * "pay" from many guest keys would, so past it a click is only logged. Paid mails are never
 * capped: each one is real money.
 */
const startedLimiter = createRateLimiter({ limit: 30, windowMs: 60 * 60 * 1000 })

const loadFacts = async (paymentId: string): Promise<PaymentFacts | null> => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { include: { _count: { select: { cvs: true } } } }, cv: true },
  })
  if (!payment) return null

  const [attempt, paidBefore, guestCvCount] = await Promise.all([
    payment.cvId
      ? prisma.payment.count({ where: { cvId: payment.cvId, createdAt: { lte: payment.createdAt } } })
      : Promise.resolve(1),
    payment.userId
      ? prisma.payment.count({ where: { userId: payment.userId, status: 'succeeded', id: { not: payment.id } } })
      : Promise.resolve(0),
    payment.cv?.guestKeyHash ? prisma.cv.count({ where: { guestKeyHash: payment.cv.guestKeyHash } }) : Promise.resolve(0),
  ])

  const { user, cv } = payment
  const basics = cv ? coerceContent(cv.content).basics : null
  const contact = (type: string): string | null => basics?.contacts.find((c) => c.type === type && c.value)?.value ?? null

  return {
    payment: {
      id: payment.id,
      orderNumber: payment.orderNumber,
      amount: payment.amount,
      currency: payment.currency,
      gateway: payment.gateway,
      gatewayTestMode: payment.gateway === 'mock' || (payment.gateway === 'ameria' && config.payments.ameria.testMode),
      gatewayPaymentId: payment.gatewayPaymentId,
      status: payment.status,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      attempt,
    },
    buyer: user
      ? {
          kind: 'account',
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: Boolean(user.emailVerifiedAt),
          signIn: [user.passwordHash && 'password', user.googleId && 'Google'].filter(Boolean).join(' + ') || 'nothing',
          createdAt: user.createdAt,
          cvCount: user._count.cvs,
          paidBefore,
        }
      : { kind: 'guest', guestCvCount },
    cv: cv
      ? {
          id: cv.id,
          title: cv.title,
          templateId: cv.templateId,
          createdAt: cv.createdAt,
          updatedAt: cv.updatedAt,
          personName: basics?.fullName ?? '',
          personEmail: contact('email'),
          personPhone: contact('phone'),
        }
      : null,
  }
}

/** Unconfigured is normal in dev, where the mail prints here instead. */
const deliver = async (payload: InternalMailPayload): Promise<void> => {
  if (!isMailConfigured()) {
    if (config.nodeEnv === 'production') {
      console.error(`[notify] "${payload.subject}" not sent: MAIL_API_URL or MAIL_API_KEY is empty`)
      return
    }
    const lines = Object.entries(payload.details ?? {}).map(([key, value]) => (value === '' ? key : `  ${key}: ${value}`))
    console.log(`[notify] ${payload.subject}\n${payload.body}\n${lines.join('\n')}`)
    return
  }
  const result = await sendInternalMail(payload)
  if (!result.ok) console.error(`[notify] "${payload.subject}" not sent: ${result.status} ${result.message}`)
}

const notify = async (
  event: PaymentMailEvent,
  paymentId: string,
  request: RequestInfo | null,
  source?: SettleSource
): Promise<void> => {
  try {
    if (event === 'started' && !startedLimiter('all').allowed) {
      console.warn(`[notify] checkout mail for payment ${paymentId} skipped: over the hourly cap`)
      return
    }
    const facts = await loadFacts(paymentId)
    if (!facts) return
    await deliver(buildPaymentMail(event, facts, request, source))
  } catch (error) {
    console.error(`[notify] ${event} mail for payment ${paymentId} failed`, error instanceof Error ? error.message : error)
  }
}

/** Never rejects. */
export const notifyCheckoutStarted = (paymentId: string, request: RequestInfo | null): Promise<void> =>
  notify('started', paymentId, request)

/** Never rejects. */
export const notifyPaymentSucceeded = (
  paymentId: string,
  request: RequestInfo | null,
  source: SettleSource
): Promise<void> => notify('succeeded', paymentId, request, source)
