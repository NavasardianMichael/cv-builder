import type { GatewayVerdict } from './types.js'

/**
 * Ameriabank vPOS 3.1 (REST, JSON) — the request and response shapes. Pure and import-free
 * so `tests/unit/server/ameria.spec.ts` can pin them. The I/O half is `ameria.ts`.
 *
 * Reference: the bank's "vPOS 3.1 API protocol" PDF (from vpos.support@ameriabank.am) and
 * its help page at https://servicestest.ameriabank.am/VPOS/help. Facts this relies on:
 *
 * - Base: `https://servicestest.ameriabank.am/VPOS/` (test), `https://services.ameriabank.am/VPOS/`.
 * - `POST api/VPOS/InitPayment` takes ClientID + Username + Password; answers `PaymentID` and
 *   `ResponseCode` **1** (a number) on success.
 * - The buyer pays at `Payments/Pay?id=<PaymentID>&lang=am`, then is sent to `BackURL` with
 *   `orderID`, `paymentID`, `opaque` and `resposneCode` (sic — the bank's spelling).
 * - `POST api/VPOS/GetPaymentDetails` takes Username + Password + PaymentID; answers
 *   `ResponseCode` **"00"** on success, `OrderStatus` 2 / `PaymentState` "payment_deposited"
 *   for a completed one-step payment, 6 / "payment_declined" for a declined one.
 * - Currency is ISO 4217 numeric: AMD = "051". Amount is a decimal number of drams.
 */

export const AMERIA_BASE_URL = {
  test: 'https://servicestest.ameriabank.am/VPOS/',
  live: 'https://services.ameriabank.am/VPOS/',
} as const

export const AMERIA_CURRENCY_AMD = '051'

export type AmeriaCredentials = { clientId: string; username: string; password: string }

export type AmeriaInitResponse = {
  PaymentID?: string | null
  ResponseCode?: number | string | null
  ResponseMessage?: string | null
}

export type AmeriaDetailsResponse = {
  ResponseCode?: string | number | null
  OrderID?: string | number | null
  Amount?: number | string | null
  ApprovedAmount?: number | string | null
  DepositedAmount?: number | string | null
  OrderStatus?: string | number | null
  PaymentState?: string | null
  Description?: string | null
  TrxnDescription?: string | null
}

export const buildInitPaymentBody = (
  credentials: AmeriaCredentials,
  input: { orderId: number; amount: number; description: string; backUrl: string; opaque: string }
) => ({
  ClientID: credentials.clientId,
  Username: credentials.username,
  Password: credentials.password,
  Currency: AMERIA_CURRENCY_AMD,
  Description: input.description.slice(0, 250),
  OrderID: input.orderId,
  Amount: input.amount,
  BackURL: input.backUrl,
  Opaque: input.opaque,
  // Seconds the payment page stays valid.
  Timeout: 1200,
})

export const buildDetailsBody = (credentials: AmeriaCredentials, paymentId: string) => ({
  PaymentID: paymentId,
  Username: credentials.username,
  Password: credentials.password,
})

export const paymentPageUrl = (baseUrl: string, paymentId: string): string =>
  `${baseUrl}Payments/Pay?id=${encodeURIComponent(paymentId)}&lang=am`

/** `ResponseCode` 1 (number, or "1" in some representations) with a PaymentID. */
export const readInitResponse = (body: AmeriaInitResponse): { ok: true; paymentId: string } | { ok: false; message: string } => {
  const code = body.ResponseCode
  if ((code === 1 || code === '1') && typeof body.PaymentID === 'string' && body.PaymentID) {
    return { ok: true, paymentId: body.PaymentID }
  }
  return { ok: false, message: `InitPayment ResponseCode ${String(code)}: ${body.ResponseMessage ?? 'no message'}` }
}

const asNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * The settlement decision. Paid only when the bank says deposited **and** the order number
 * and amount are the ones we asked for — a details record for some other order (a replayed
 * `paymentID`) or a smaller charge must not unlock anything.
 */
export const interpretDetails = (
  body: AmeriaDetailsResponse,
  expected: { orderId: number; amount: number }
): GatewayVerdict => {
  const status = asNumber(body.OrderStatus)
  const state = body.PaymentState ?? ''
  const responseOk = String(body.ResponseCode ?? '') === '00'

  if (status === 6 || state === 'payment_declined') return { status: 'failed', reason: 'declined' }
  if (status === 3 || status === 4 || state === 'payment_void' || state === 'payment_refunded') {
    return { status: 'failed', reason: state || `status ${status}` }
  }

  const deposited = status === 2 || state === 'payment_deposited'
  if (!deposited || !responseOk) return { status: 'pending' }

  if (asNumber(body.OrderID) !== expected.orderId) return { status: 'failed', reason: 'order mismatch' }
  const charged = asNumber(body.DepositedAmount) ?? asNumber(body.ApprovedAmount) ?? asNumber(body.Amount)
  if (charged === null || charged < expected.amount) return { status: 'failed', reason: 'amount mismatch' }

  return { status: 'succeeded' }
}
