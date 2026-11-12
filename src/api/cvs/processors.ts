import type { CheckoutCvAPI, CreateCvAPI, GetCvAPI, GetCvsAPI, UpdateCvAPI } from './types'

export const processCvsResponse: GetCvsAPI['processor'] = (response) => response.value

export const processCvResponse: GetCvAPI['processor'] & CreateCvAPI['processor'] = (response) => response.value

export const processUpdateCvResponse: UpdateCvAPI['processor'] = (response) => response.value

export const processCheckoutResponse: CheckoutCvAPI['processor'] = (response) =>
  'openPayment' in response.value
    ? { kind: 'open', minutesAgo: response.value.openPayment.minutesAgo }
    : { kind: 'redirect', url: response.value.redirectUrl }
