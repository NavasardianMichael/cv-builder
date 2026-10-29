import type { GetMeAPI, LoginAPI, RegisterAPI, ResetPasswordAPI } from './types'

export const processGetMeResponse: GetMeAPI['processor'] = (response) => response.value

export const processUserResponse: LoginAPI['processor'] & RegisterAPI['processor'] & ResetPasswordAPI['processor'] = (
  response
) => response.value
