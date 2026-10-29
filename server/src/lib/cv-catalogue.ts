/**
 * The closed sets a CV document may name. Twin of the web's `src/constants/templates.ts`,
 * `src/constants/fonts.ts` and `src/constants/sections.ts`; there is no import path between
 * the packages, so `tests/unit/server/twins.spec.ts` pins them equal.
 */
export const TEMPLATE_IDS = [
  'classic',
  'modern',
  'minimal',
  'executive',
  'creative',
  'elegant',
  'tech',
  'timeline',
  'compact',
  'bold',
  'academic',
  'soft',
] as const

export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const FONT_SLUGS = [
  'ghea-grapalat',
  'vrdznagir',
  'arm-hmks-bebas-neue',
  'montserrat-armenian',
  'tumanian-dzeragir',
  'braind-amanor',
  'artsakh',
  'davel-aghvor',
  'free-sans',
  'poqrik-dzeragir',
  'mardoto',
  'arian-amu',
  'free-serif',
  'nasa-font',
  'arti',
  '90',
  'reactive',
  'gaa-gayane',
  'braind-yerevan',
  'amar',
] as const

export type FontSlug = (typeof FONT_SLUGS)[number]

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
