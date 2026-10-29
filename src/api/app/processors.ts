import type { GetCapabilitiesAPI } from './types'

export const processCapabilitiesResponse: GetCapabilitiesAPI['processor'] = (response) => ({
  google: Boolean(response.value.google),
  payments: Boolean(response.value.payments),
  priceAmd: response.value.priceAmd,
})
