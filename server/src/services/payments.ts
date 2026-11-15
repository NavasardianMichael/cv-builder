import type { Payment, PaymentStatus } from '@prisma/client'
import { accessWindow, type PaidPass } from './entitlement.js'
import { GATEWAYS } from './gateways/index.js'
import { PAYMENT_PAGE_TIMEOUT_SECONDS } from './gateways/types.js'
import type { SettleSource } from './paymentMail.js'
import { notifyCheckoutStarted, notifyPaymentSucceeded } from './paymentNotifications.js'
import { PASS_DAYS, PASS_PRICE_AMD } from './pricing.js'
import { config } from '../config.js'
import { ERROR_CODE } from '../lib/error-codes.js'
import { prisma } from '../lib/prisma.js'
import type { RequestInfo } from '../lib/request-info.js'
import type { CvOwner } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'

/**
 * Access passes (docs/PAYMENTS.md). What one payment buys is **time**: `PASS_DAYS` days of
 * every template's designed PDF for every CV of its owner — an account, or a guest browser's
 * key. The owner's succeeded payments are the passes (`accessWindow`); a pass bought while one
 * runs adds its days on top.
 *
 * - `startCheckout` writes a `pending` Payment, asks the gateway for a payment page, and
 *   returns its URL. Nothing is unlocked here.
 * - `settlePayment` is the **only** writer of `succeeded`. It asks the gateway, server to
 *   server, and moves the row out of `pending` by compare-and-set, so the return redirect, a
 *   page reload and a reconcile racing each other settle it once.
 * - `reconcileOwnerPayments` covers the buyer who paid and closed the tab before the redirect:
 *   reading the owner's access, printing, and starting another checkout re-check their recent
 *   pending payments, on read. `settleStalePayments` (hourly, `paymentSweep.ts`) catches the
 *   buyer who never comes back at all.
 * - `runningPass` re-checks a running pass for a refund made in the bank's panel before the
 *   designed PDF prints.
 */

const RECONCILE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

/** The request that is settling a payment, for the "payment succeeded" mail. */
export type SettleContext = { source: SettleSource; request: RequestInfo | null }

/** The owner's succeeded payments, as passes. `paidAt` is set by `settlePayment` (a grant's by the release). */
export const paidPasses = async (owner: CvOwner): Promise<PaidPass[]> => {
  const rows = await prisma.payment.findMany({ where: { ...owner, status: 'succeeded' }, select: { id: true, paidAt: true, createdAt: true } })
  return rows.map((row) => ({ id: row.id, paidAt: row.paidAt ?? row.createdAt }))
}

const windowOf = async (owner: CvOwner): Promise<ReturnType<typeof accessWindow>> => accessWindow(await paidPasses(owner), PASS_DAYS)

const isRunning = (until: Date | null): until is Date => Boolean(until && until.getTime() > Date.now())

/**
 * When this owner's access ends — in the past once it has run out, null if they never had one.
 * Pending payments from the last days are settled first.
 */
export const accessUntil = async (owner: CvOwner, context?: SettleContext): Promise<Date | null> => {
  await reconcileOwnerPayments(owner, context)
  return (await windowOf(owner)).until
}

/**
 * The running pass, asked before the designed PDF prints: pending payments are settled first
 * (a tab closed mid-redirect), and a running pass is re-checked for a refund made in the bank's
 * panel since (`revalidatePass`). Returns the payment a download counts against — the latest
 * of the running window — or null when no pass runs.
 */
export const runningPass = async (owner: CvOwner, context?: SettleContext): Promise<{ paymentId: string } | null> => {
  await reconcileOwnerPayments(owner, context)
  const before = await windowOf(owner)
  if (!isRunning(before.until)) return null
  await revalidatePass(before.chain)
  const after = await windowOf(owner)
  if (!isRunning(after.until)) return null
  return { paymentId: after.chain[after.chain.length - 1].id }
}

/**
 * A refund or void made later in the bank's panel takes its days back. Each payment of the
 * running window is re-read from its gateway, and a reversed one becomes `refunded`; the caller
 * then computes the window again. A gateway that cannot answer counts as still paid — an
 * outage must not lock a buyer out. A grant has no gateway record and is not asked.
 */
const revalidatePass = async (chain: readonly PaidPass[]): Promise<void> => {
  const payments = await prisma.payment.findMany({
    where: { id: { in: chain.map((payment) => payment.id) }, status: 'succeeded', gatewayPaymentId: { not: null } },
  })
  const reversed: string[] = []
  for (const payment of payments) {
    try {
      if (await GATEWAYS[payment.gateway].isReversed(payment.gatewayPaymentId!)) reversed.push(payment.id)
    } catch (error) {
      console.error(`[payments] revalidate of ${payment.id} failed`, error instanceof Error ? error.message : error)
    }
  }
  if (reversed.length > 0) {
    await prisma.payment.updateMany({ where: { id: { in: reversed }, status: 'succeeded' }, data: { status: 'refunded' } })
    console.info(`[payments] ${reversed.length} payment(s) were refunded at the bank: ${reversed.join(', ')}`)
  }
}

/**
 * How long an attempt the buyer never came back from may still be payable: the bank's page
 * timeout, plus a margin for the bank's clock against ours. Both ends are this server's
 * clock (`createdAt`, now); the browser's is never used.
 */
const OPEN_PAYMENT_WINDOW_MS = (PAYMENT_PAGE_TIMEOUT_SECONDS + 2 * 60) * 1000

export type OpenPayment = { id: string; minutesAgo: number }

/**
 * An earlier attempt of this owner's whose bank page may still be open — in another tab — and
 * payable: pending (the bank had nothing charged when last asked), younger than the page
 * timeout, and the buyer never came back from it (`returnedAt`). Paying a new order as well
 * would buy the days twice without meaning to, so the buyer is offered that same order instead
 * (`resumeOpenPayment`): one order is charged once, whichever tab they pay in.
 *
 * Null once it was resumed already: if the buyer is here again without the bank having sent
 * them, that page may not reopen, and they must not be sent to it in a loop — a new order.
 * Computed when asked; nothing expires it.
 */
export const findOpenPayment = async (owner: CvOwner): Promise<OpenPayment | null> => {
  const open = await prisma.payment.findFirst({
    where: {
      ...owner,
      status: 'pending',
      returnedAt: null,
      gatewayPaymentId: { not: null },
      createdAt: { gte: new Date(Date.now() - OPEN_PAYMENT_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!open || open.reopenedAt) return null
  return { id: open.id, minutesAgo: Math.max(1, Math.round((Date.now() - open.createdAt.getTime()) / 60_000)) }
}

/**
 * Sends the buyer back to an open payment's own bank page, once (`reopenedAt`, claimed by
 * compare-and-set). Null when it is no longer open or was resumed already: start a new one.
 */
export const resumeOpenPayment = async (paymentId: string): Promise<string | null> => {
  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, status: 'pending', returnedAt: null, reopenedAt: null, gatewayPaymentId: { not: null } },
    data: { reopenedAt: new Date() },
  })
  if (claimed.count !== 1) return null
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment?.gatewayPaymentId) return null
  console.info(`[payments] buyer sent back to the open payment #${payment.orderNumber}`)
  return GATEWAYS[payment.gateway].pageUrl(payment.gatewayPaymentId)
}

/** The buyer is back from the bank's page for this payment: it is no longer open in some tab. */
export const markReturned = async (paymentId: string): Promise<void> => {
  await prisma.payment.updateMany({ where: { id: paymentId, returnedAt: null }, data: { returnedAt: new Date() } })
}

/**
 * Starts buying a pass for this owner and returns the bank page's URL. `cvId` is only where the
 * buyer started (the result page leads back to it) and must already be the owner's. `request`
 * is the buyer's click, for the "checkout started" mail (`paymentNotifications.ts`).
 */
export const startCheckout = async (owner: CvOwner, input: { cvId: string | null }, request: RequestInfo): Promise<string> => {
  const gatewayId = config.payments.gateway
  const gateway = GATEWAYS[gatewayId]

  const payment = await prisma.payment.create({
    data: { ...owner, cvId: input.cvId, amount: PASS_PRICE_AMD, gateway: gatewayId },
  })

  try {
    const { gatewayPaymentId, redirectUrl } = await gateway.init({
      orderNumber: payment.orderNumber,
      amount: payment.amount,
      // Latin only: Ameria stores it without Unicode, so Armenian reaches its merchant panel
      // and the buyer's statement as "¿¿¿".
      description: `CV builder: full access for ${PASS_DAYS} days, order #${payment.orderNumber}`,
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
 * The row's status after a settle, or `unpaid`: still `pending` in the database, but the
 * gateway says nothing has been charged — the buyer has not paid (yet).
 */
export type SettleStatus = PaymentStatus | 'unpaid'

const failPending = async (payment: Payment, reason: string): Promise<'failed'> => {
  await prisma.payment.updateMany({ where: { id: payment.id, status: 'pending' }, data: { status: 'failed', failureReason: reason } })
  return 'failed'
}

/**
 * Settles a payment from the gateway's own record. A second payment of the same owner is not
 * a mistake to undo: its days go on top of theirs (`accessWindow`). On a two-stage terminal an
 * `approved` (blocked) amount is confirmed first, and only the record read after it settles.
 *
 * `context` names who is settling it, for the mail sent by the settler that wins the claim.
 */
export const settlePayment = async (payment: Payment, context?: SettleContext): Promise<SettleStatus> => {
  if (payment.status !== 'pending' || !payment.gatewayPaymentId) return payment.status

  const gateway = GATEWAYS[payment.gateway]
  const expected = { orderNumber: payment.orderNumber, amount: payment.amount }
  let verdict = await gateway.check(payment.gatewayPaymentId, expected)
  if (verdict.status === 'pending') return verdict.nothingCharged ? 'unpaid' : 'pending'
  if (verdict.status === 'failed') return failPending(payment, verdict.reason)

  if (verdict.status === 'approved') {
    verdict = await gateway.confirm(payment.gatewayPaymentId, expected)
    if (verdict.status === 'failed') return failPending(payment, verdict.reason)
    if (verdict.status !== 'succeeded') return 'pending'
  }

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: 'pending' },
    data: { status: 'succeeded', paidAt: new Date() },
  })
  // Only the settler that moved the row sends it: a racing redirect and reconcile mail once.
  if (claimed.count === 1) void notifyPaymentSucceeded(payment.id, context?.request ?? null, context?.source ?? 'return')
  return 'succeeded'
}

/**
 * Re-checks this owner's recent pending payments. True when one of them has just succeeded —
 * a payment whose redirect never arrived. Gateway failures are logged, never thrown at a reader.
 */
export const reconcileOwnerPayments = async (owner: CvOwner, context?: SettleContext): Promise<boolean> => {
  const pending = await prisma.payment.findMany({
    where: {
      ...owner,
      status: 'pending',
      gatewayPaymentId: { not: null },
      createdAt: { gte: new Date(Date.now() - RECONCILE_WINDOW_MS) },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  let settled = false
  for (const payment of pending) {
    try {
      if ((await settlePayment(payment, context)) === 'succeeded') settled = true
    } catch (error) {
      console.error(`[payments] reconcile of ${payment.id} failed`, error instanceof Error ? error.message : error)
    }
  }
  return settled
}

/** How far back the hourly sweep looks: a bank keeps an order's record well past this. */
const STALE_PENDING_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/**
 * The hourly sweep (`paymentSweep.ts`): every payment still `pending` after its bank page has
 * timed out is asked about once more, whoever owns it. Paid → `succeeded` (the buyer who paid
 * and never came back); nothing charged → `failed`, since that page can no longer be paid.
 * Gateway errors are logged and retried next hour.
 */
export const settleStalePayments = async (now = new Date()): Promise<{ succeeded: number; failed: number; unresolved: number }> => {
  const stale = await prisma.payment.findMany({
    where: {
      status: 'pending',
      gatewayPaymentId: { not: null },
      createdAt: { lt: new Date(now.getTime() - OPEN_PAYMENT_WINDOW_MS), gte: new Date(now.getTime() - STALE_PENDING_MAX_AGE_MS) },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  const counts = { succeeded: 0, failed: 0, unresolved: 0 }
  for (const payment of stale) {
    try {
      const status = await settlePayment(payment, { source: 'sweep', request: null })
      if (status === 'succeeded') counts.succeeded += 1
      else if (status === 'failed') counts.failed += 1
      else if (status === 'unpaid') {
        await failPending(payment, 'abandoned: the bank page timed out with nothing charged')
        counts.failed += 1
      } else counts.unresolved += 1
    } catch (error) {
      counts.unresolved += 1
      console.error(`[payments] sweep of #${payment.orderNumber} failed`, error instanceof Error ? error.message : error)
    }
  }
  return counts
}

export type Reversal = 'refund' | 'cancel'

/**
 * An operator's refund or cancellation of a settled payment, through the gateway's API
 * (`pnpm payments:reverse`, only with `AMERIA_API_REVERSALS=true`): the whole charge goes back
 * to the card and its days leave the owner's window. Throws the gateway's refusal unchanged.
 */
export const reversePayment = async (payment: Payment, kind: Reversal): Promise<void> => {
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
  await prisma.payment.updateMany({ where: { id: payment.id, status: 'succeeded' }, data: { status: 'refunded' } })
}
