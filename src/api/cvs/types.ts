import type { Cv, CvContent, CvDocument } from '@store/cvs/single/types'
import type { Endpoint } from '@interfaces/api'

export type GetCvsAPI = Endpoint<{ payload: void; response: Cv[]; processed: Cv[] }>

export type CreateCvAPI = Endpoint<{ payload: CvDocument; response: Cv; processed: Cv }>

export type GetCvAPI = Endpoint<{ payload: { id: string }; response: Cv; processed: Cv }>

/** `baseUpdatedAt`: the stamp of the copy the edit started from; the API refuses a write over a newer one (409). */
export type UpdateCvPayload = { id: string; baseUpdatedAt?: string } & Partial<CvDocument>
export type UpdateCvResponse = { updatedAt: string }
export type UpdateCvAPI = Endpoint<{ payload: UpdateCvPayload; response: UpdateCvResponse; processed: UpdateCvResponse }>

export type DuplicateCvAPI = Endpoint<{ payload: { id: string }; response: Cv; processed: Cv }>

export type DeleteCvAPI = Endpoint<{ payload: { id: string }; response: null; processed: void }>

/** `basic` is the free black-and-white PDF; `designed` the paid one, as styled. */
export type PdfVariant = 'designed' | 'basic'

/** Not enveloped: the API answers the PDF bytes themselves. */
export type DownloadCvPdfAPI = Endpoint<{ payload: { id: string; variant: PdfVariant }; processed: Blob }>

/** The free PDF of a document only this browser holds (a guest's draft). */
export type DownloadDraftPdfAPI = Endpoint<{ payload: { title: string; content: CvContent }; processed: Blob }>
