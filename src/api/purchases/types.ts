import type { Endpoint } from '@interfaces/api'
import type { ClientInfo } from '@helpers/clientInfo'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

/** `accessUntil`: ISO, in the past once it ran out, null if never bought. `payment`: the asked payment's status. */
export type AccessResponse = { accessUntil: string | null; payment: PaymentStatus | null }
/** `until`: epoch ms. */
export type Access = { until: number | null; payment: PaymentStatus | null }
export type GetAccessAPI = Endpoint<{ payload: { paymentId?: string } | undefined; response: AccessResponse; processed: Access }>

/**
 * The bank's page to go to, or — no payment started — an earlier attempt whose bank page may
 * still be open in another tab, started `minutesAgo` (by the server's clock).
 */
export type CheckoutResponse = { redirectUrl: string } | { openPayment: { minutesAgo: number } }
export type CheckoutResult = { kind: 'redirect'; url: string } | { kind: 'open'; minutesAgo: number }
/**
 * `cvId`: where the buyer started (the result page leads back to it). `client`: the device facts
 * for the admin's "checkout started" mail (`@helpers/clientInfo`). `resume`: the buyer chose to
 * continue that open attempt — sent to its own bank page (a new one if it cannot be resumed).
 */
export type CheckoutAPI = Endpoint<{
  payload: { cvId: string | null; client: ClientInfo; resume?: boolean }
  response: CheckoutResponse
  processed: CheckoutResult
}>
