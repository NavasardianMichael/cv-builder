import type { Payment, PaymentStatus } from '@prisma/client'
import { GATEWAYS } from './gateways/index.js'
import { PAYMENT_PAGE_TIMEOUT_SECONDS } from './gateways/types.js'
import { DUPLICATE_REASON, isDuplicateReason, type SettleSource } from './paymentMail.js'
import { notifyCheckoutStarted, notifyDuplicatePayment, notifyPaymentSucceeded } from './paymentNotifications.js'
import { CV_PRICE_AMD } from './pricing.js'
import { config } from '../config.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { prisma } from '../lib/prisma.js'
import type { RequestInfo } from '../lib/request-info.js'
import { HttpError } from '../middleware/error.js'

/**
 * One-time CV purchases (docs/PAYMENTS.md).
 *
 * - `startCheckout` writes a `pending` Payment, asks the gateway for a payment page, and
 *   returns its URL. Nothing is unlocked here.
 * - `settlePayment` is the **only** writer of `succeeded` and of `Cv.paidAt`. It asks the
 *   gateway, server to server, and moves the row out of `pending` by compare-and-set, so the
 *   return redirect, a page reload and a reconcile racing each other settle it once.
 * - `reconcileCvPayments` covers the buyer who paid and closed the tab before the redirect:
 *   reading a CV re-checks its recent pending payments. Computed on read, no background job.
 *   It runs for paid CVs too, and before every new checkout: a second attempt that was paid
 *   as well is found and reversed (`releaseDuplicate`), and a paid one is never paid again.
 */

const RECONCILE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

/**
 * How long an attempt the buyer never came back from may still be payable: the bank's page
 * timeout, plus a margin for the bank's clock against ours. Both ends are this server's
 * clock (`createdAt`, now); the browser's is never used.
 */
const OPEN_PAYMENT_WINDOW_MS = (PAYMENT_PAGE_TIMEOUT_SECONDS + 2 * 60) * 1000

/**
 * An earlier attempt for this CV whose bank page may still be open — in another tab — and
 * payable: pending (the bank had nothing charged when last asked), younger than the page
 * timeout, and the buyer never came back from it (`returnedAt`). Starting another one then
 * risks paying both, so the buyer is asked first. Computed when asked; nothing expires it.
 */
export const findOpenPayment = async (cvId: string): Promise<{ minutesAgo: number } | null> => {
  const open = await prisma.payment.findFirst({
    where: {
      cvId,
      status: 'pending',
      returnedAt: null,
      gatewayPaymentId: { not: null },
      createdAt: { gte: new Date(Date.now() - OPEN_PAYMENT_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!open) return null
  return { minutesAgo: Math.max(1, Math.round((Date.now() - open.createdAt.getTime()) / 60_000)) }
}

/** The buyer is back from the bank's page for this payment: it is no longer open in some tab. */
export const markReturned = async (paymentId: string): Promise<void> => {
  await prisma.payment.updateMany({ where: { id: paymentId, returnedAt: null }, data: { returnedAt: new Date() } })
}

/** The request that is settling a payment, for the "payment succeeded" mail. */
export type SettleContext = { source: SettleSource; request: RequestInfo | null }

/**
 * `userId` is null for a guest's CV; the payment is moved to the account if they sign in later.
 * `request` is the buyer's click, for the "checkout started" mail (`paymentNotifications.ts`).
 */
export const startCheckout = async (
  cv: { id: string; title: string; userId: string | null },
  request: RequestInfo
): Promise<string> => {
  const gatewayId = config.payments.gateway
  const gateway = GATEWAYS[gatewayId]

  const payment = await prisma.payment.create({
    data: { userId: cv.userId, cvId: cv.id, amount: CV_PRICE_AMD, gateway: gatewayId },
  })

  try {
    const { gatewayPaymentId, redirectUrl } = await gateway.init({
      orderNumber: payment.orderNumber,
      amount: payment.amount,
      // Latin only: Ameria stores it without Unicode, so Armenian (and an Armenian CV title)
      // reaches its merchant panel and the buyer's statement as "¿¿¿".
      description: `CV PDF download, order #${payment.orderNumber}`,
      backUrl: `${config.apiPublicUrl}/payments/return/${gatewayId}`,
      opaque: payment.id,
    })
    await prisma.payment.update({ where: { id: payment.id }, data: { gatewayPaymentId } })
    void notifyCheckoutStarted(payment.id, request)
    return redirectUrl
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'init failed'
    console.error(`[payments] init failed for payment ${payment.id}: ${reason}`)
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed', failureReason: reason.slice(0, 500) } })
    void notifyCheckoutStarted(payment.id, request)
    throw new HttpError(502, 'Payment could not be started', ERROR_CODE.paymentInitFailed)
  }
}

/**
 * The row's status after a settle, or:
 * - `unpaid`: still `pending` in the database, but the gateway says nothing has been charged —
 *   the buyer has not paid (yet);
 * - `duplicate`: the CV was already paid, so this payment was reversed (or flagged to be).
 */
export type SettleStatus = PaymentStatus | 'unpaid' | 'duplicate'

const failPending = async (payment: Payment, reason: string): Promise<'failed'> => {
  await prisma.payment.updateMany({ where: { id: payment.id, status: 'pending' }, data: { status: 'failed', failureReason: reason } })
  return 'failed'
}

const isCvPaid = async (cvId: string | null): Promise<boolean> =>
  cvId ? Boolean((await prisma.cv.findUnique({ where: { id: cvId }, select: { paidAt: true } }))?.paidAt) : false

/**
 * One CV, one charge. Settling never confirms or keeps money for a CV that is already paid —
 * a second tab, a retry after a redirect that never arrived, a late return: that payment is
 * reversed here, and the buyer is told (the result page's `duplicate`).
 *
 * `context` names who is settling it, for the mails sent by the settler that wins the claim.
 */
export const settlePayment = async (payment: Payment, context?: SettleContext): Promise<SettleStatus> => {
  if (payment.status !== 'pending' || !payment.gatewayPaymentId) {
    return isDuplicateReason(payment.failureReason) ? 'duplicate' : payment.status
  }

  const gateway = GATEWAYS[payment.gateway]
  const expected = { orderNumber: payment.orderNumber, amount: payment.amount }
  let verdict = await gateway.check(payment.gatewayPaymentId, expected)
  if (verdict.status === 'pending') return verdict.nothingCharged ? 'unpaid' : 'pending'
  if (verdict.status === 'failed') return failPending(payment, verdict.reason)

  // Money is held (`approved`) or taken (`succeeded`). Paid already: give it back, never confirm.
  if (await isCvPaid(payment.cvId)) return releaseDuplicate(payment, verdict.status, context)

  if (verdict.status === 'approved') {
    verdict = await gateway.confirm(payment.gatewayPaymentId, expected)
    if (verdict.status === 'failed') return failPending(payment, verdict.reason)
    if (verdict.status !== 'succeeded') return 'pending'
  }

  const now = new Date()
  const outcome = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: 'pending' },
      data: { status: 'succeeded', paidAt: now },
    })
    if (claimed.count !== 1) return 'lost' as const
    if (!payment.cvId) return 'won' as const
    // The row lock makes this the arbiter: of two payments settling at once, one unlocks the CV.
    const unlocked = await tx.cv.updateMany({ where: { id: payment.cvId, paidAt: null }, data: { paidAt: now } })
    return unlocked.count === 1 ? ('won' as const) : ('duplicate' as const)
  })

  if (outcome === 'duplicate') return releaseDuplicate({ ...payment, status: 'succeeded' }, 'succeeded', context)
  if (outcome === 'lost') {
    // Another settler moved it first; answer what it decided.
    const row = await prisma.payment.findUnique({ where: { id: payment.id } })
    return row && isDuplicateReason(row.failureReason) ? 'duplicate' : (row?.status ?? 'pending')
  }
  // Only the settler that moved the row sends it: a racing redirect and reconcile mail once.
  void notifyPaymentSucceeded(payment.id, context?.request ?? null, context?.source ?? 'return')
  return 'succeeded'
}

/**
 * Gives back a payment made for a CV that was already paid. `held`: blocked on the card
 * (two-stage, never confirmed) or charged. CancelPayment first — it releases a hold, and
 * reverses a charge within 72 hours so it never reaches the statement — then RefundPayment.
 * A bank that refuses both leaves it to a person: the row says so and the admin mail asks.
 *
 * A `pending` row is claimed first (→ `failed`, "being reversed"), so two settlers racing
 * over the same payment reverse and mail once.
 */
const releaseDuplicate = async (
  payment: Payment,
  held: 'approved' | 'succeeded',
  context?: SettleContext
): Promise<'duplicate'> => {
  if (payment.status === 'pending') {
    const claimed = await prisma.payment.updateMany({
      where: { id: payment.id, status: 'pending' },
      data: { status: 'failed', failureReason: DUPLICATE_REASON.inProgress },
    })
    if (claimed.count !== 1) return 'duplicate'
  }

  const gateway = GATEWAYS[payment.gateway]
  const gatewayPaymentId = payment.gatewayPaymentId!
  const refusals: string[] = []
  let reversed = false
  try {
    await gateway.cancel(gatewayPaymentId)
    reversed = true
  } catch (error) {
    refusals.push(error instanceof Error ? error.message : String(error))
    if (held === 'succeeded') {
      try {
        await gateway.refund(gatewayPaymentId, payment.amount)
        reversed = true
      } catch (refundError) {
        refusals.push(refundError instanceof Error ? refundError.message : String(refundError))
      }
    }
  }
  // As in `reversePayment`: a refusal that took effect anyway shows in the payment's record.
  if (!reversed) reversed = await gateway.isReversed(gatewayPaymentId).catch(() => false)

  const data = reversed
    ? held === 'approved'
      ? { status: 'failed' as const, failureReason: DUPLICATE_REASON.released }
      : { status: 'refunded' as const, failureReason: DUPLICATE_REASON.reversed }
    : held === 'approved'
      ? // Blocked, never charged: the bank lets the hold lapse; a person can release it sooner.
        { status: 'failed' as const, failureReason: DUPLICATE_REASON.manual }
      : // Charged and kept until a person returns it: `succeeded` is what the money says.
        { status: 'succeeded' as const, failureReason: DUPLICATE_REASON.manual, paidAt: payment.paidAt ?? new Date() }
  await prisma.payment.update({ where: { id: payment.id }, data })

  if (reversed) console.info(`[payments] duplicate #${payment.orderNumber} for CV ${payment.cvId} reversed automatically`)
  else console.error(`[payments] duplicate #${payment.orderNumber} for CV ${payment.cvId} NOT reversed: ${refusals.join(' | ')}`)
  void notifyDuplicatePayment(payment.id, context?.request ?? null, context?.source ?? 'return')
  return 'duplicate'
}

/**
 * Whether a paid CV is still paid, asked before its designed PDF is printed: a refund or void
 * made later in the bank's panel takes the PDF back from that CV's owner. Each `succeeded`
 * payment of the CV is re-read from its gateway; a reversed one becomes `refunded`, and the CV
 * loses `paidAt` once none is left (a CV paid twice and refunded once stays paid). A gateway
 * that cannot answer counts as still paid — an outage must not lock a buyer out — and a CV
 * with no gateway payment (the seed's) is left as it is.
 */
export const revalidatePaidCv = async (cvId: string): Promise<boolean> => {
  const payments = await prisma.payment.findMany({ where: { cvId, status: 'succeeded', gatewayPaymentId: { not: null } } })

  const reversed: string[] = []
  for (const payment of payments) {
    try {
      if (await GATEWAYS[payment.gateway].isReversed(payment.gatewayPaymentId!)) reversed.push(payment.id)
    } catch (error) {
      console.error(`[payments] revalidate of ${payment.id} failed`, error instanceof Error ? error.message : error)
    }
  }
  if (reversed.length === 0) return true
  return markRefunded(cvId, reversed)
}

/** `succeeded` → `refunded`; true while the CV still has another `succeeded` payment, else it is locked. */
const markRefunded = (cvId: string | null, paymentIds: string[]): Promise<boolean> =>
  prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({ where: { id: { in: paymentIds }, status: 'succeeded' }, data: { status: 'refunded' } })
    if (!cvId) return false
    if ((await tx.payment.count({ where: { cvId, status: 'succeeded' } })) > 0) return true
    await tx.cv.updateMany({ where: { id: cvId }, data: { paidAt: null } })
    console.info(`[payments] CV ${cvId} locked again: its payment was refunded at the bank`)
    return false
  })

export type Reversal = 'refund' | 'cancel'

/**
 * An operator's refund or cancellation of a settled payment, through the gateway's API
 * (`pnpm payments:reverse`): the whole charge goes back to the card. Once the gateway says
 * "done" the payment is `refunded` and its CV locked unless paid again. Returns whether the
 * CV is still paid; throws the gateway's refusal (code and message) unchanged.
 */
export const reversePayment = async (payment: Payment, kind: Reversal): Promise<boolean> => {
  if (payment.status !== 'succeeded' || !payment.gatewayPaymentId) {
    throw new Error(`payment #${payment.orderNumber} is ${payment.status}, only a succeeded one can be reversed`)
  }
  const gateway = GATEWAYS[payment.gateway]
  try {
    if (kind === 'refund') await gateway.refund(payment.gatewayPaymentId, payment.amount)
    else await gateway.cancel(payment.gatewayPaymentId)
  } catch (error) {
    // Ameria's test server sometimes answers an empty ResponseCode and does nothing (re-run
    // it); a refusal that did take effect anyway shows in the payment's own record.
    if (!(await gateway.isReversed(payment.gatewayPaymentId).catch(() => false))) throw error
  }
  return markRefunded(payment.cvId, [payment.id])
}

/** True when the CV is (now) paid. Gateway failures are logged, never thrown at a reader. */
export const reconcileCvPayments = async (cvId: string, context?: SettleContext): Promise<boolean> => {
  const pending = await prisma.payment.findMany({
    where: {
      cvId,
      status: 'pending',
      gatewayPaymentId: { not: null },
      createdAt: { gte: new Date(Date.now() - RECONCILE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  let paid = false
  for (const payment of pending) {
    try {
      if ((await settlePayment(payment, context)) === 'succeeded') paid = true
    } catch (error) {
      console.error(`[payments] reconcile of ${payment.id} failed`, error instanceof Error ? error.message : error)
    }
  }
  return paid
}
