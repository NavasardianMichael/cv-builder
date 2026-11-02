/**
 * The price pages print. The server's `CV_PRICE_AMD` (`server/src/services/pricing.ts`) is
 * the one charged; `twins.spec.ts` pins them equal.
 */
export const CV_PRICE_AMD = 2000

export const CURRENCY = 'AMD'

/**
 * "2,000 դրամ" — grouped the way Armenian sites print prices. Spelled out, not ֏: GHEA
 * Grapalat, the app font, draws a pomegranate at U+058F.
 */
export const formatAmd = (amount: number): string => `${amount.toLocaleString('en-US')} դրամ`
