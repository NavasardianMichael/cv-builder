/**
 * Links this server builds into the web app, and the guard on where a redirect may land.
 * Import-free (no config) so `tests/unit/server/` can pin them against the web's
 * `src/constants/routes.ts` and `src/constants/auth.ts`.
 */

/** The query name the web's reset page reads (`RESET_TOKEN_QUERY`). */
export const PASSWORD_RESET_QUERY = 'token'
export const PASSWORD_RESET_PATH = '/auth/reset-password'

/** Where a finished checkout lands (`ROUTES.paymentResult`). */
export const PAYMENT_RESULT_PATH = '/payment/result'

/** Where Google sign-in errors land (`ROUTES.signIn`), with `?error=`. */
export const SIGN_IN_PATH = '/auth/sign-in'

/** Signed-in default destination (`ROUTES.dashboard`). */
export const DASHBOARD_PATH = '/dashboard'

/**
 * A post-sign-in destination is accepted only as a same-site path: it must start with a single
 * `/`, so `//evil.example` and `/\evil.example` (both protocol-relative to a browser) and any
 * absolute URL are refused. Without this, `returnTo` is an open redirect.
 */
export const isSafeReturnPath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 512 &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\') &&
  !/[\r\n]/.test(value)

export const buildWebUrl = (origin: string, path: string, query: Record<string, string> = {}): string => {
  const url = new URL(path, origin.endsWith('/') ? origin : `${origin}/`)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
  return url.toString()
}
