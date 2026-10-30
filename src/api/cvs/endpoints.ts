export const ENDPOINTS = {
  list: '/cvs',
  create: '/cvs',
  single: '/cvs',
  update: '/cvs',
  remove: '/cvs',
  duplicate: '/cvs',
  checkout: '/cvs',
  pdf: '/cvs',
  basicPdf: '/cvs',
  /** The free PDF of a guest's local draft: no account, nothing stored. */
  draftBasicPdf: '/pdf/basic',
} as const
