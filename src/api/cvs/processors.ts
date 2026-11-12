import type { CreateCvAPI, GetCvAPI, GetCvsAPI, UpdateCvAPI } from './types'

export const processCvsResponse: GetCvsAPI['processor'] = (response) => response.value

export const processCvResponse: GetCvAPI['processor'] & CreateCvAPI['processor'] = (response) => response.value

export const processUpdateCvResponse: UpdateCvAPI['processor'] = (response) => response.value
