/**
 * The twenty Armenian fonts a CV can use, self-hosted from `public/fonts/` (woff2, subset to
 * Latin, Cyrillic and Armenian by `scripts/fonts/build_fonts.py`). Source: fonter.am's most
 * popular list, keeping only fonts whose own page there says "free for commercial or personal
 * use" — see `public/fonts/LICENSES.md`.
 *
 * Twin: `FONT_SLUGS` in `server/src/lib/cv-catalogue.ts` (pinned by `twins.spec.ts`).
 */
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

export type FontCategory = 'sans' | 'serif' | 'display' | 'script'

export type FontMeta = {
  slug: FontSlug
  name: string
  author: string
  category: FontCategory
  /** Weights shipped. A heading asks for 700; the browser synthesises bold where absent. */
  weights: number[]
  italic: boolean
  /** Has its own Latin letters (emails, URLs). Others fall back per glyph to Mardoto. */
  latin: boolean
}

export const FONTS: Record<FontSlug, FontMeta> = {
  'ghea-grapalat': { slug: 'ghea-grapalat', name: 'GHEA Grapalat', author: 'Էդիկ Ղաբուզյան', category: 'serif', weights: [400, 700], italic: true, latin: true },
  vrdznagir: { slug: 'vrdznagir', name: 'Vrdznagir', author: 'Levon Chkolyan', category: 'script', weights: [400], italic: false, latin: false },
  'arm-hmks-bebas-neue': { slug: 'arm-hmks-bebas-neue', name: "Arm Hmk's Bebas Neue", author: 'Hamik Mayilyan, Ryoichi Tsunekawa', category: 'display', weights: [400], italic: false, latin: true },
  'montserrat-armenian': { slug: 'montserrat-armenian', name: 'Montserrat Armenian', author: 'Vahan Hovhannisyan', category: 'sans', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italic: false, latin: true },
  'tumanian-dzeragir': { slug: 'tumanian-dzeragir', name: "Tumanian's Handwriting", author: 'Ruben Tarumian', category: 'script', weights: [400], italic: false, latin: true },
  'braind-amanor': { slug: 'braind-amanor', name: 'Braind Amanor', author: 'Էդուարդ Քանքանյան', category: 'display', weights: [400], italic: false, latin: false },
  artsakh: { slug: 'artsakh', name: 'Artsakh', author: 'Sargis Qalajyan, Narek Tsarukyan', category: 'display', weights: [400], italic: false, latin: false },
  'davel-aghvor': { slug: 'davel-aghvor', name: 'Davel Aghvor', author: 'Levon Chkolyan', category: 'display', weights: [400], italic: false, latin: false },
  'free-sans': { slug: 'free-sans', name: 'Free Sans', author: 'GNU FreeFont', category: 'sans', weights: [400, 700], italic: true, latin: true },
  'poqrik-dzeragir': { slug: 'poqrik-dzeragir', name: 'Poqrik dzeragir', author: 'poqrik.am', category: 'script', weights: [400], italic: false, latin: false },
  mardoto: { slug: 'mardoto', name: 'Mardoto', author: 'Christian Robertson, Vahan Hovhannisyan', category: 'sans', weights: [100, 300, 400, 500, 700, 900], italic: true, latin: true },
  'arian-amu': { slug: 'arian-amu', name: 'Arian AMU', author: 'Ruben Tarumian', category: 'sans', weights: [400, 700], italic: true, latin: true },
  'free-serif': { slug: 'free-serif', name: 'Free Serif', author: 'GNU FreeFont', category: 'serif', weights: [400, 700], italic: true, latin: true },
  'nasa-font': { slug: 'nasa-font', name: 'NASA Font', author: 'Narek Tsarukyan, Sargis Qalajyan', category: 'display', weights: [400], italic: false, latin: false },
  arti: { slug: 'arti', name: 'Arti', author: 'ՀԲԸՄ', category: 'script', weights: [400], italic: false, latin: false },
  '90': { slug: '90', name: '90', author: 'Levon Chkolyan', category: 'display', weights: [400], italic: false, latin: false },
  reactive: { slug: 'reactive', name: 'Reactive', author: 'Mariam Hovhannesyan', category: 'display', weights: [400], italic: false, latin: false },
  'gaa-gayane': { slug: 'gaa-gayane', name: 'GAA Gayane', author: 'Gayane Andreasyan', category: 'sans', weights: [400, 500, 600, 700, 800], italic: true, latin: true },
  'braind-yerevan': { slug: 'braind-yerevan', name: 'Braind Yerevan', author: 'Էդուարդ Քանքանյան', category: 'sans', weights: [400], italic: false, latin: true },
  amar: { slug: 'amar', name: 'Amar', author: 'VooDoo Marketing', category: 'display', weights: [400], italic: false, latin: false },
}

export const FONT_CATEGORY_ORDER: FontCategory[] = ['sans', 'serif', 'display', 'script']

/** The `@font-face` family `scripts/fonts/build-css.mjs` declares for a slug. */
export const cvFontFamily = (slug: FontSlug): string => `'cv-${slug}'`

/** A full stack: the chosen face, then Mardoto for glyphs it lacks (Latin, digits). */
export const cvFontStack = (slug: FontSlug): string => `${cvFontFamily(slug)}, 'cv-mardoto', 'cv-free-sans', sans-serif`

/** Served by Next from `public/`; linked only by pages that render CVs. */
export const CV_FONTS_STYLESHEET = '/fonts/cv-fonts.css'
