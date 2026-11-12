import type { APIResponse } from '@interfaces/api'
import { ENDPOINTS } from './endpoints'
import type { AccessResponse, CheckoutAPI, CheckoutResponse, GetAccessAPI } from './types'
import { axiosInstance } from '../axiosInstance'

export const getAccessAPI: GetAccessAPI['api'] = async (payload) => {
  const { data } = await axiosInstance.get<APIResponse<AccessResponse>>(ENDPOINTS.access, {
    params: payload?.paymentId ? { payment: payload.paymentId } : undefined,
  })
  return { until: data.value.accessUntil ? Date.parse(data.value.accessUntil) : null, payment: data.value.payment }
}

export const checkoutAPI: CheckoutAPI['api'] = async ({ cvId, client, resume }) => {
  const { data } = await axiosInstance.post<APIResponse<CheckoutResponse>>(ENDPOINTS.checkout, {
    cvId,
    client,
    ...(resume ? { resume: true } : {}),
  })
  return 'openPayment' in data.value
    ? { kind: 'open', minutesAgo: data.value.openPayment.minutesAgo }
    : { kind: 'redirect', url: data.value.redirectUrl }
}
