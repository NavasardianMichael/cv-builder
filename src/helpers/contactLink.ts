import type { CvContact } from '@store/cvs/single/types'
import { toWebsiteUrl } from './url'

/**
 * Where a contact links to. Its own `url` when the user attached one; otherwise one worked
 * out from its type and text — the text itself stays exactly as typed. Pure, and used by the
 * CV render, so the editor, the previews and the PDF link the same way.
 */

const ARMENIA = '374'
/** Armenian national numbers: a trunk 0, then 8 digits (91 123456, 10 123456, 322 21234). */
const NATIONAL_DIGITS = 8

/**
 * Runs that look like a phone number: an optional `+`, then digits with the separators people
 * type (spaces, dashes, dots, brackets). It stops at letters, commas and slashes, so
 * "Հեռ.՝ 091 123456 (WhatsApp)" yields "091 123456" and "091 12 34 56, 010 123456" the first.
 */
const PHONE_RUN = /\+?\(?\d[\d\s().\-‐‑‒–—]*\d/g

const toE164 = (digits: string, international: boolean): string | null => {
  if (international) {
    if (digits.startsWith(ARMENIA)) {
      // "+374 091 123456": the trunk 0 kept after the country code.
      const national = digits.slice(ARMENIA.length).replace(/^0(?=\d{8}$)/, '')
      return national.length === NATIONAL_DIGITS ? `+${ARMENIA}${national}` : null
    }
    // Another country: E.164 allows up to 15 digits; fewer than 8 is not a full number.
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  }
  if (digits.startsWith('00')) return toE164(digits.slice(2), true)
  // "374 91 123456" written without the plus.
  if (digits.startsWith(ARMENIA) && digits.length >= ARMENIA.length + NATIONAL_DIGITS) return toE164(digits, true)
  if (digits.length === NATIONAL_DIGITS + 1 && digits.startsWith('0')) return `+${ARMENIA}${digits.slice(1)}`
  if (digits.length === NATIONAL_DIGITS) return `+${ARMENIA}${digits}`
  return null
}

const parseRun = (run: string): string | null => {
  const trimmed = run.trim()
  return toE164(trimmed.replace(/\D/g, ''), trimmed.startsWith('+'))
}

/**
 * The number in whatever the user typed, as E.164 (`+37491123456`), or null. A bare national
 * number is taken as Armenian: `091 123 456`, `91-12-34-56`, `(010) 12 34 56`, `0322 2 12 34`,
 * `374 91 123456`, `00374…` and `+374 091…` all resolve; `+7 926…` keeps its own country.
 * Two numbers separated only by spaces are split by taking the shortest leading part that
 * is a whole number.
 */
export const parsePhone = (text: string): string | null => {
  for (const match of text.matchAll(PHONE_RUN)) {
    const run = match[0]
    const whole = parseRun(run)
    if (whole) return whole
    const parts = run.split(/\s+/)
    for (let count = 1; count < parts.length; count += 1) {
      const prefix = parseRun(parts.slice(0, count).join(' '))
      if (prefix) return prefix
    }
  }
  return null
}

const EMAIL = /[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]+/

/** The first address in the text, so "Էլ.՝ ani@mail.am" still links. */
export const emailHref = (text: string): string | undefined => {
  const address = EMAIL.exec(text)?.[0]?.replace(/[.։]+$/, '')
  return address ? `mailto:${address}` : undefined
}

export const phoneHref = (text: string): string | undefined => {
  const number = parsePhone(text)
  return number ? `tel:${number}` : undefined
}

/**
 * A profile written as a bare handle ("anihov", "@anihov") or as an address. LinkedIn,
 * GitHub and Telegram handles have no dots, so text with one is an address.
 */
const profileHref =
  (base: string) =>
  (text: string): string | undefined => {
    const handle = /^@?([\w-]+)$/.exec(text.trim())?.[1]
    return handle ? `${base}${handle}` : toWebsiteUrl(text)
  }

const AUTO_HREF: Record<CvContact['type'], (text: string) => string | undefined> = {
  email: emailHref,
  phone: phoneHref,
  location: () => undefined,
  website: toWebsiteUrl,
  linkedin: profileHref('https://www.linkedin.com/in/'),
  github: profileHref('https://github.com/'),
  telegram: profileHref('https://t.me/'),
  other: () => undefined,
}

/**
 * A link the user attached by hand: a web address, an email (`mailto:` optional) or a phone
 * number (`tel:` optional — "tel:091 123456" is cleaned up like the phone field). Undefined
 * when it is none of those; the link form says so before saving.
 */
export const toLinkHref = (text: string): string | undefined => {
  const trimmed = text.trim()
  if (!trimmed) return undefined
  if (/^mailto:/i.test(trimmed)) return emailHref(trimmed.slice('mailto:'.length))
  if (/^tel:/i.test(trimmed)) return phoneHref(trimmed.slice('tel:'.length))
  if (EMAIL.test(trimmed) && !/^https?:/i.test(trimmed)) return emailHref(trimmed)
  return toWebsiteUrl(trimmed)
}

/** The link a contact renders with, or undefined for plain text. */
export const contactHref = (contact: CvContact): string | undefined =>
  contact.url.trim() ? toLinkHref(contact.url) : AUTO_HREF[contact.type](contact.value)
