/**
 * The one product (docs/PAYMENTS.md): **full access** — every template's designed PDF, for
 * every CV of the buyer — for `PASS_DAYS` days, at `PASS_PRICE_AMD`. Bought while it runs, the
 * new days go on top. Not a subscription: nothing renews by itself. When it ends nothing is
 * deleted; the free black-and-white PDF stays free for anyone.
 *
 * The server's numbers (`server/src/services/pricing.ts`, `retention.ts`) are the ones charged
 * and enforced; these are what pages print, pinned equal by `tests/unit/server/twins.spec.ts`.
 */
export const PASS_PRICE_AMD = 2000

/** How long one payment opens everything. */
export const PASS_DAYS = 21

/**
 * What is unused for this long is deleted (`server/src/services/retention.ts`): an account not
 * signed in to, and with no download and no running access, for this many days — a guest's CV
 * likewise. The pages promise it in words ("a year").
 */
export const RETENTION_DAYS = 365

export const CURRENCY = 'AMD'

/**
 * "2,000 դրամ" — grouped the way Armenian sites print prices. Spelled out, not ֏: GHEA
 * Grapalat, the app font, draws a pomegranate at U+058F.
 */
export const formatAmd = (amount: number): string => `${amount.toLocaleString('en-US')} դրամ`

const DAY_MS = 24 * 60 * 60 * 1000

/** Whether an access ending at `until` (epoch ms; null: never bought) is running at `now`. */
export const isAccessActive = (until: number | null, now: number): boolean => until !== null && until > now

/** Whole days left, counting a started day as one ("1 day left" until the very end). */
export const accessDaysLeft = (until: number, now: number): number => Math.max(0, Math.ceil((until - now) / DAY_MS))
