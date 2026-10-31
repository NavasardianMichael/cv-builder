/**
 * Contact types: what a line in the CV's contacts row is — its icon, its link and its
 * placeholder. Twin: `CONTACT_TYPES` in `server/src/lib/cv-catalogue.ts`.
 *
 * The placeholders are document copy (they render on the sheet, like a new section's default
 * title), so they live here; the add menu's names are UI copy (`Editor.contacts.types`).
 */
export const CONTACT_TYPES = [
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
  'github',
  'telegram',
  'other',
] as const

export type ContactType = (typeof CONTACT_TYPES)[number]

export const CONTACT_PLACEHOLDERS: Record<ContactType, string> = {
  email: 'էլ. փոստ',
  phone: 'հեռախոս',
  location: 'քաղաք, երկիր',
  website: 'կայք',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  telegram: 'Telegram',
  other: 'այլ տվյալ',
}

/** The five fixed fields a CV had before contacts became a list; also a new CV's contacts. */
export const LEGACY_CONTACT_TYPES = [
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
] as const satisfies readonly ContactType[]

/** Keeps the header a header. Twin: `CV_LIMITS.contacts` on the server. */
export const MAX_CONTACTS = 12
