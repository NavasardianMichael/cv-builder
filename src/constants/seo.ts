import { SITE_DOMAIN } from './app'

/**
 * What people type to find this. The site is Armenian-only, so the English and Russian
 * phrasings live in metadata alone: the `keywords` meta (a weak signal for Yandex and Bing,
 * ignored by Google), the JSON-LD `keywords` / `alternateName`, and `/llms.txt`, which answer
 * engines read. Ranking for them in Google would take pages written in those languages.
 *
 * "ռեզյումե" is kept as a keyword only — the copy always says "ինքնակենսագրական" — because
 * people search both.
 */
export const KEYWORDS_HY = [
  'ինքնակենսագրական',
  'ինքնակենսագրական կազմել',
  'ինքնակենսագրականի ձևանմուշ',
  'ինքնակենսագրական հայերեն',
  'ինքնակենսագրություն',
  'CV',
  'CV հայերեն',
  'CV կազմել',
  'CV ձևանմուշ',
  'ռեզյումե',
  'աշխատանք Հայաստանում',
]

export const KEYWORDS_EN = [
  'Armenian CV builder',
  'CV in Armenian',
  'Armenian resume builder',
  'resume in Armenian',
  'Armenian CV template',
  'CV maker Armenia',
]

export const KEYWORDS_RU = [
  'резюме на армянском',
  'резюме на армянском языке',
  'конструктор резюме на армянском',
  'шаблон резюме на армянском',
  'составить резюме на армянском',
  'CV на армянском',
]

export const SEARCH_KEYWORDS = [...KEYWORDS_HY, ...KEYWORDS_EN, ...KEYWORDS_RU]

/** The service's name as an English or Russian speaker would put it. */
export const ALTERNATE_NAMES = ['CV Builder', 'Armenian CV Builder', 'Конструктор резюме на армянском']

/**
 * Google's "preferred sources" page for this site: a reader who adds it sees the site more
 * often in Top Stories and AI answers. The no-script deeplink from
 * developers.google.com/search/docs/appearance/preferred-sources, so the footer's badge is
 * drawn in the app's own colours and loads nothing from Google.
 */
export const GOOGLE_PREFERRED_SOURCE_URL = `https://www.google.com/preferences/source?q=${SITE_DOMAIN}`

/**
 * Google Search Console's ownership tag, inlined at build time and left out when empty. A DNS
 * TXT record verifies the same ownership without it (docs/PRODUCTION_SETUP.md step 11).
 */
export const SITE_VERIFICATION = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
}
