export const ENDPOINTS = {
  me: '/identity/me',
  register: '/identity/register',
  login: '/identity/login',
  logout: '/identity/logout',
  updateMe: '/identity/me',
  deleteMe: '/identity/me',
  passwordLink: '/identity/password/link',
  forgotPassword: '/identity/password/forgot',
  resetPassword: '/identity/password/reset',
  google: '/identity/google',
} as const
