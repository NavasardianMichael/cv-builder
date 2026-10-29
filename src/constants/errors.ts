/**
 * Codes the API sends for failures with their own copy (`Errors.codes.<code>` in hy.json).
 * Twin: `server/src/lib/error-codes.ts`, pinned by `twins.spec.ts`.
 */
export const ERROR_CODES = {
  emailTaken: 4001,
  invalidCredentials: 4002,
  weakPassword: 4003,
  resetTokenInvalid: 4004,
  googleOnlyAccount: 4005,
  cvLimitReached: 4010,
  cvAlreadyPaid: 4020,
  cvNotPaid: 4021,
  paymentsUnavailable: 4022,
  paymentInitFailed: 4023,
  pdfFailed: 4030,
  rateLimited: 4290,
} as const

/** Every other failure is shown by kind (`Errors.kinds.<kind>`). */
export type ErrorKind =
  | 'network'
  | 'offline'
  | 'timeout'
  | 'unauthorized'
  | 'notFound'
  | 'conflict'
  | 'rateLimited'
  | 'unavailable'
  | 'server'
  | 'validation'
  | 'unknown'

export const RETRYABLE_ERROR_KINDS: ReadonlySet<ErrorKind> = new Set(['network', 'offline', 'timeout', 'unavailable', 'server'])
