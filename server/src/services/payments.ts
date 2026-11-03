import type { Payment, PaymentStatus } from '@prisma/client'
import { GATEWAYS } from './gateways/index.js'
import { CV_PRICE_AMD } from './pricing.js'
import { config } from '../config.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { prisma } from '../lib/prisma.js'
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
 */

const RECONCILE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

/** `userId` is null for a guest's CV; the payment is moved to the account if they sign in later. */
export const startCheckout = async (cv: { id: string; title: string; userId: string | null }): Promise<string> => {
  const gatewayId = config.payments.gateway
  const gateway = GATEWAYS[gatewayId]

  const payment = await prisma.payment.create({
    data: { userId: cv.userId, cvId: cv.id, amount: CV_PRICE_AMD, gateway: gatewayId },
  })

  try {
    const { gatewayPaymentId, redirectUrl } = await gateway.init({
      orderNumber: payment.orderNumber,
      amount: payment.amount,
      description: `Իմ ինքնակենսագրականը — «${cv.title}» CV-ի ներբեռնում`,
      backUrl: `${config.apiPublicUrl}/payments/return/${gatewayId}`,
      opaque: payment.id,
    })
    await prisma.payment.update({ where: { id: payment.id }, data: { gatewayPaymentId } })
    return redirectUrl
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'init failed'
    console.error(`[payments] init failed for payment ${payment.id}: ${reason}`)
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed', failureReason: reason.slice(0, 500) } })
    throw new HttpError(502, 'Payment could not be started', ERROR_CODE.paymentInitFailed)
  }
}

export const settlePayment = async (payment: Payment): Promise<PaymentStatus> => {
  if (payment.status !== 'pending' || !payment.gatewayPaymentId) return payment.status

  const verdict = await GATEWAYS[payment.gateway].check(payment.gatewayPaymentId, {
    orderNumber: payment.orderNumber,
    amount: payment.amount,
  })
  if (verdict.status === 'pending') return 'pending'

  const now = new Date()
  if (verdict.status === 'failed') {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: 'pending' },
      data: { status: 'failed', failureReason: verdict.reason },
    })
    return 'failed'
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: 'pending' },
      data: { status: 'succeeded', paidAt: now },
    })
    if (claimed.count === 1 && payment.cvId) {
      await tx.cv.updateMany({ where: { id: payment.cvId, paidAt: null }, data: { paidAt: now } })
    }
  })
  return 'succeeded'
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
export const reconcileCvPayments = async (cvId: string): Promise<boolean> => {
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
      if ((await settlePayment(payment)) === 'succeeded') paid = true
    } catch (error) {
      console.error(`[payments] reconcile of ${payment.id} failed`, error instanceof Error ? error.message : error)
    }
  }
  return paid
}
