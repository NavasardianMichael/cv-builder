import type { Cv, CvContent, CvDocument } from '@store/cvs/single/types'
import type { Endpoint } from '@interfaces/api'
import type { ClientInfo } from '@helpers/clientInfo'

export type GetCvsAPI = Endpoint<{ payload: void; response: Cv[]; processed: Cv[] }>

export type CreateCvAPI = Endpoint<{ payload: CvDocument; response: Cv; processed: Cv }>

export type GetCvAPI = Endpoint<{ payload: { id: string }; response: Cv; processed: Cv }>

export type UpdateCvPayload = { id: string } & Partial<CvDocument>
export type UpdateCvResponse = { updatedAt: string; paidAt: string | null }
export type UpdateCvAPI = Endpoint<{ payload: UpdateCvPayload; response: UpdateCvResponse; processed: UpdateCvResponse }>

export type DuplicateCvAPI = Endpoint<{ payload: { id: string }; response: Cv; processed: Cv }>

export type DeleteCvAPI = Endpoint<{ payload: { id: string }; response: null; processed: void }>

/**
 * The bank's page to go to, or — no payment started — an earlier attempt whose bank page may
 * still be open in another tab, started `minutesAgo` (by the server's clock).
 */
export type CheckoutResponse = { redirectUrl: string } | { openPayment: { minutesAgo: number } }
export type CheckoutResult = { kind: 'redirect'; url: string } | { kind: 'open'; minutesAgo: number }
/**
 * `client`: the device facts for the admin's "checkout started" mail (`@helpers/clientInfo`).
 * `resume`: the buyer chose to continue that open attempt — sent to its own bank page, so
 * only one order exists to be paid (a new one if it can no longer be resumed).
 */
export type CheckoutCvAPI = Endpoint<{
  payload: { id: string; client: ClientInfo; resume?: boolean }
  response: CheckoutResponse
  processed: CheckoutResult
}>

/** `basic` is the free black-and-white PDF; `designed` the paid one, as styled. */
export type PdfVariant = 'designed' | 'basic'

/** Not enveloped: the API answers the PDF bytes themselves. */
export type DownloadCvPdfAPI = Endpoint<{ payload: { id: string; variant: PdfVariant }; processed: Blob }>

/** The free PDF of a document only this browser holds (a guest's draft). */
export type DownloadDraftPdfAPI = Endpoint<{ payload: { title: string; content: CvContent }; processed: Blob }>
