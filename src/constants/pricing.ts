/**
 * The price pages print. The server's `CV_PRICE_AMD` (`server/src/services/pricing.ts`) is
 * the one charged; `twins.spec.ts` pins them equal.
 */
export const CV_PRICE_AMD = 2000

export const CURRENCY = 'AMD'

/** "2,000 ֏" — grouped the way Armenian sites print prices. */
export const formatAmd = (amount: number): string => `${amount.toLocaleString('en-US')} ֏`
