import type { Cv, CvDocument } from '@store/cvs/single/types'
import type { Endpoint } from '@interfaces/api'

export type GetCvsAPI = Endpoint<{ payload: void; response: Cv[]; processed: Cv[] }>

export type CreateCvAPI = Endpoint<{ payload: CvDocument; response: Cv; processed: Cv }>

export type GetCvAPI = Endpoint<{ payload: { id: string }; response: Cv; processed: Cv }>

export type UpdateCvPayload = { id: string } & Partial<CvDocument>
export type UpdateCvResponse = { updatedAt: string; paidAt: string | null }
export type UpdateCvAPI = Endpoint<{ payload: UpdateCvPayload; response: UpdateCvResponse; processed: UpdateCvResponse }>

export type DuplicateCvAPI = Endpoint<{ payload: { id: string }; response: Cv; processed: Cv }>

export type DeleteCvAPI = Endpoint<{ payload: { id: string }; response: null; processed: void }>

export type CheckoutResponse = { redirectUrl: string }
export type CheckoutCvAPI = Endpoint<{ payload: { id: string }; response: CheckoutResponse; processed: string }>

/** `basic` is the free black-and-white PDF; `designed` the paid one, as styled. */
export type PdfVariant = 'designed' | 'basic'

/** Not enveloped: the API answers the PDF bytes themselves. */
export type DownloadCvPdfAPI = Endpoint<{ payload: { id: string; variant: PdfVariant }; processed: Blob }>
