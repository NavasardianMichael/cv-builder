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
 * Search-console ownership tags, each inlined at build time and left out when empty. A DNS
 * TXT record verifies the same ownership without them (docs/PRODUCTION_SETUP.md step 10).
 */
export const SITE_VERIFICATION = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? '',
  bing: process.env.NEXT_PUBLIC_BING_VERIFICATION ?? '',
}
