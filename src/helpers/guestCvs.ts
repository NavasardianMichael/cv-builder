import { reportError } from './reportError'

/**
 * Whether this browser holds CVs bought without an account. The CVs themselves are reached
 * through the API's httpOnly guest cookie, which the page cannot read; this flag only decides
 * whether a guest is shown the way back to them ("My CVs"). Set when a guest's draft becomes
 * a server CV; cleared once someone signs in, since the API then moves those CVs to the account.
 *
 * Wrapped like `localDraft.ts`: storage can throw, and losing the flag only hides a link.
 */
const KEY = 'rezyume:guest-cvs:v1'

export const hasGuestCvs = (): boolean => {
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export const markGuestCvs = (): void => {
  try {
    window.localStorage.setItem(KEY, '1')
  } catch (error) {
    reportError(error, 'guestCvs:mark')
  }
}

export const clearGuestCvsMark = (): void => {
  try {
    window.localStorage.removeItem(KEY)
  } catch (error) {
    reportError(error, 'guestCvs:clear')
  }
}
