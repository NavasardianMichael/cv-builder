import type { TemplateId } from './templates'

/**
 * Every path in the app. Server-built links (password reset, payment result, Google errors)
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
} as const

export const templatePath = (id: TemplateId): string => `${ROUTES.templates}/${id}`

export const editorPath = (cvId: string): string => `${ROUTES.editor}/${cvId}`

export const newCvPath = (templateId: TemplateId): string => `${ROUTES.editorNew}?template=${templateId}`

/** Signed-in areas; `src/proxy.ts` sends a visitor without a session cookie to sign-in. */
export const PROTECTED_PREFIXES = [ROUTES.dashboard, ROUTES.account]

/** Query names shared across pages. */
export const RETURN_TO_QUERY = 'returnTo'
export const CHECKOUT_QUERY = 'checkout'
export const TEMPLATE_QUERY = 'template'
export const SAMPLE_QUERY = 'sample'
