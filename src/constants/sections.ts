/**
 * Section types. Twin: `SECTION_TYPES` in `server/src/lib/cv-catalogue.ts`.
 *
 * `kind` decides which body a section renders: free `text`, a list of `entries`
 * (title / subtitle / period / location / description), or `tags` (a name and maybe a level).
 *
 * `SECTION_DEFAULT_TITLES` is document content, not UI copy: it is written into a new section's
 * `title`, which the user then owns, so it lives here rather than in `messages/hy.json`.
 */
export const SECTION_TYPES = [
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'projects',
  'certificates',
  'awards',
  'volunteering',
  'interests',
  'references',
  'custom',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

export type SectionKind = 'text' | 'entries' | 'tags'

export type SectionMeta = {
  kind: SectionKind
  /** Tags carry a 0-5 level. */
  levels: boolean
  /** Where a two-column template puts it unless the user says otherwise. */
  prefersSide: boolean
  /** Only one of these makes sense per CV; the "add section" menu hides it once present. */
  single: boolean
}

export const SECTION_META: Record<SectionType, SectionMeta> = {
  summary: { kind: 'text', levels: false, prefersSide: false, single: true },
  experience: { kind: 'entries', levels: false, prefersSide: false, single: true },
  education: { kind: 'entries', levels: false, prefersSide: false, single: true },
  skills: { kind: 'tags', levels: true, prefersSide: true, single: true },
  languages: { kind: 'tags', levels: true, prefersSide: true, single: true },
  projects: { kind: 'entries', levels: false, prefersSide: false, single: true },
  certificates: { kind: 'entries', levels: false, prefersSide: true, single: true },
  awards: { kind: 'entries', levels: false, prefersSide: true, single: true },
  volunteering: { kind: 'entries', levels: false, prefersSide: false, single: true },
  interests: { kind: 'tags', levels: false, prefersSide: true, single: true },
  references: { kind: 'entries', levels: false, prefersSide: false, single: true },
  custom: { kind: 'entries', levels: false, prefersSide: false, single: false },
}

export const SECTION_DEFAULT_TITLES: Record<SectionType, string> = {
  summary: 'Իմ մասին',
  experience: 'Աշխատանքային փորձ',
  education: 'Կրթություն',
  skills: 'Հմտություններ',
  languages: 'Լեզուներ',
  projects: 'Նախագծեր',
  certificates: 'Վկայականներ և դասընթացներ',
  awards: 'Մրցանակներ',
  volunteering: 'Կամավորական գործունեություն',
  interests: 'Հետաքրքրություններ',
  references: 'Երաշխավորներ',
  custom: 'Այլ',
}

/** Level words for the `text` level style, index = level. Languages read differently. */
export const LEVEL_LABELS: Record<'default' | 'languages', string[]> = {
  default: ['', 'Սկսնակ', 'Բավարար', 'Լավ', 'Շատ լավ', 'Փորձագետ'],
  languages: ['', 'Սկսնակ', 'Միջին', 'Լավ', 'Ազատ', 'Մայրենի'],
}

/** Mirrors `CV_LIMITS` in `server/src/services/cvDocument.ts`; past these the API drops items. */
export const CV_LIMITS = {
  sections: 24,
  entries: 40,
  tags: 60,
  photoBytes: 700_000,
} as const

export const MAX_LEVEL = 5
