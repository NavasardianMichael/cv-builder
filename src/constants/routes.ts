import type { TemplateId } from './templates'

/**
 * Every path in the app. Server-built links (email verification, password reset, payment result, Google errors)
 * are twins in `server/src/lib/return-path.ts`, pinned by `twins.spec.ts`.
 */
export const ROUTES = {
  home: '/',
  templates: '/templates',
  pricing: '/pricing',
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  verifyEmail: '/auth/verify-email',
  dashboard: '/dashboard',
  account: '/account',
  editor: '/editor',
  editorNew: '/editor/new',
  paymentResult: '/payment/result',
  render: '/render',
  terms: '/terms',
  privacy: '/privacy',
  refundPolicy: '/refund-policy',
  contact: '/contact',
  about: '/about',
  guides: '/guides',
  examples: '/examples',
} as const

export const templatePath = (id: TemplateId): string => `${ROUTES.templates}/${id}`

/** An article in `src/content/guides`, by its slug (a transliterated search phrase). */
export const guidePath = (slug: string): string => `${ROUTES.guides}/${slug}`

/** A CV example in `src/content/examples`, by its slug. */
export const examplePath = (slug: string): string => `${ROUTES.examples}/${slug}`

/** A new CV filled with a CV example's text, in that example's template. */
export const newCvFromExamplePath = (templateId: TemplateId, slug: string): string =>
  `${ROUTES.editorNew}?${TEMPLATE_QUERY}=${templateId}&${EXAMPLE_QUERY}=${slug}`

export const editorPath = (cvId: string): string => `${ROUTES.editor}/${cvId}`

export const newCvPath = (templateId: TemplateId): string => `${ROUTES.editorNew}?template=${templateId}`

/** A new CV in the free black-and-white design (`BASIC_DESIGN`). */
export const newFreeCvPath = (): string => `${ROUTES.editorNew}?${FREE_QUERY}=1`

/** Signed-in areas; `src/proxy.ts` sends a visitor without a session cookie to sign-in. */
export const PROTECTED_PREFIXES = [ROUTES.dashboard, ROUTES.account]

/**
 * `ROUTES.paymentResult`'s `?status=`, set by the API's return from the bank (twin in
 * `server/src/lib/return-path.ts`), with `payment` (the Payment's id) and `cv` (where the
 * buyer started, if anywhere).
 */
export const PAYMENT_RESULT_STATUSES = ['succeeded', 'failed', 'pending'] as const
export type PaymentResultStatus = (typeof PAYMENT_RESULT_STATUSES)[number]

/** Query names shared across pages. */
export const RETURN_TO_QUERY = 'returnTo'
export const CHECKOUT_QUERY = 'checkout'
export const TEMPLATE_QUERY = 'template'
export const SAMPLE_QUERY = 'sample'
export const FREE_QUERY = 'free'
/** `ROUTES.editorNew`'s CV example slug: the new CV starts with that example's text. */
export const EXAMPLE_QUERY = 'example'
