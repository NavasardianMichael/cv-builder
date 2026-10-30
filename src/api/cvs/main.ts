import type { Cv } from '@store/cvs/single/types'
import type { APIResponse } from '@interfaces/api'
import { API_PDF_TIMEOUT_MS } from '@constants/app'
import { ENDPOINTS } from './endpoints'
import { processCheckoutResponse, processCvResponse, processCvsResponse, processUpdateCvResponse } from './processors'
import type {
  CheckoutCvAPI,
  CheckoutResponse,
  CreateCvAPI,
  DeleteCvAPI,
  DownloadCvPdfAPI,
  DownloadDraftPdfAPI,
  DuplicateCvAPI,
  GetCvAPI,
  GetCvsAPI,
  UpdateCvAPI,
  UpdateCvResponse,
} from './types'
import { axiosInstance } from '../axiosInstance'

export const getCvsAPI: GetCvsAPI['api'] = async () => {
  const { data } = await axiosInstance.get<APIResponse<Cv[]>>(ENDPOINTS.list)
  return processCvsResponse(data)
}

export const createCvAPI: CreateCvAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.post<APIResponse<Cv>>(ENDPOINTS.create, payload)
  return processCvResponse(data)
}

export const getCvAPI: GetCvAPI['api'] = async ({ id }) => {
  const { data } = await axiosInstance.get<APIResponse<Cv>>(`${ENDPOINTS.single}/${encodeURIComponent(id)}`)
  return processCvResponse(data)
}

export const updateCvAPI: UpdateCvAPI['api'] = async ({ id, ...payload }) => {
  const { data } = await axiosInstance.put<APIResponse<UpdateCvResponse>>(
    `${ENDPOINTS.update}/${encodeURIComponent(id)}`,
    payload
  )
  return processUpdateCvResponse(data)
}

export const duplicateCvAPI: DuplicateCvAPI['api'] = async ({ id }) => {
  const { data } = await axiosInstance.post<APIResponse<Cv>>(
    `${ENDPOINTS.duplicate}/${encodeURIComponent(id)}/duplicate`
  )
  return processCvResponse(data)
}

export const deleteCvAPI: DeleteCvAPI['api'] = async ({ id }) => {
  await axiosInstance.delete(`${ENDPOINTS.remove}/${encodeURIComponent(id)}`)
}

export const checkoutCvAPI: CheckoutCvAPI['api'] = async ({ id }) => {
  const { data } = await axiosInstance.post<APIResponse<CheckoutResponse>>(
    `${ENDPOINTS.checkout}/${encodeURIComponent(id)}/checkout`
  )
  return processCheckoutResponse(data)
}

/**
 * A PDF request's failure still answers the JSON envelope, which axios hands over as a Blob
 * too; it is parsed back so `classifyError` can read its code (402 = not paid).
 */
const rethrowPdfError = async (error: unknown): Promise<never> => {
  const response = (error as { response?: { data?: unknown } }).response
  if (response?.data instanceof Blob) {
    try {
      response.data = JSON.parse(await response.data.text())
    } catch {
      // Not JSON; leave it for the generic copy.
    }
  }
  throw error
}

/** The PDF as a Blob. */
export const downloadCvPdfAPI: DownloadCvPdfAPI['api'] = async ({ id, variant }) => {
  const url =
    variant === 'basic'
      ? `${ENDPOINTS.basicPdf}/${encodeURIComponent(id)}/pdf/basic`
      : `${ENDPOINTS.pdf}/${encodeURIComponent(id)}/pdf`
  try {
    const { data } = await axiosInstance.get<Blob>(url, {
      responseType: 'blob',
      timeout: API_PDF_TIMEOUT_MS,
    })
    return data
  } catch (error) {
    return rethrowPdfError(error)
  }
}

/** The free PDF of a guest's draft, sent as the body: the server prints it and keeps nothing. */
export const downloadDraftPdfAPI: DownloadDraftPdfAPI['api'] = async (payload) => {
  try {
    const { data } = await axiosInstance.post<Blob>(ENDPOINTS.draftBasicPdf, payload, {
      responseType: 'blob',
      timeout: API_PDF_TIMEOUT_MS,
    })
    return data
  } catch (error) {
    return rethrowPdfError(error)
  }
}
