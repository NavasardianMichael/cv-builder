/** The API's session cookie (`config.cookieName`). Read only by `src/proxy.ts` for presence. */
export const SESSION_COOKIE = 'rezyume_session'

/** The reset page's query (`PASSWORD_RESET_QUERY` on the server). */
export const RESET_TOKEN_QUERY = 'token'

/** `?error=` values the API's Google flow redirects back with (`GOOGLE_ERROR`). */
export const GOOGLE_ERRORS = ['google_unavailable', 'google_denied', 'google_failed', 'google_email_unverified'] as const

export type GoogleErrorCode = (typeof GOOGLE_ERRORS)[number]

export const isGoogleError = (value: unknown): value is GoogleErrorCode =>
  typeof value === 'string' && (GOOGLE_ERRORS as readonly string[]).includes(value)

/** Mirrors `PASSWORD_POLICY` in `server/src/lib/password.ts`. */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
