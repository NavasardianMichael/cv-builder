import type { CvDesign } from '@store/cvs/single/types'

/**
 * The template catalogue. Twin: `TEMPLATE_IDS` in `server/src/lib/cv-catalogue.ts`.
 *
 * A template is a layout (its component in `src/components/cv/templates/`) plus the design it
 * starts from. Choosing a template applies `defaults`; after that every colour and font is
 * the user's. Names and descriptions are Armenian copy kept here, not in the catalogue,
 * because the SEO pages and JSON-LD read them as data.
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

/**
 * - `single`: one column.
 * - `side-left` / `side-right`: a sidebar, which takes the sections whose type prefers it.
 * - `split`: two equal columns.
 */
export type TemplateLayout = 'single' | 'side-left' | 'side-right' | 'split'

export type TemplateMeta = {
  id: TemplateId
  name: string
  /** One line for cards. */
  tagline: string
  /** A paragraph for the template's own page. */
  description: string
  /** Who it suits — rendered as chips and used in the page's keywords. */
  bestFor: string[]
  layout: TemplateLayout
  defaults: Omit<CvDesign, 'templateId' | 'showIcons'> & { showIcons?: boolean }
}

export const TEMPLATES: Record<TemplateId, TemplateMeta> = {
  classic: {
    id: 'classic',
    name: 'Դասական',
    tagline: 'Ժամանակի փորձությունն անցած, խիստ և հստակ',
    description:
      'Մեկ սյունակով, կենտրոնացված վերնագրով և բարակ բաժանարար գծերով ձևանմուշ՝ serif տառատեսակով։ Հարմար է պետական, իրավաբանական, ֆինանսական և ցանկացած պահպանողական ոլորտի համար, որտեղ կարևոր է կարգն ու ընթեռնելիությունը։',
    bestFor: ['Իրավաբան', 'Հաշվապահ', 'Պետական ծառայող'],
    layout: 'single',
    defaults: {
      palette: { accent: '#1f3a5f', background: '#ffffff', text: '#2a2d34', heading: '#111827', muted: '#6b7280', sidebarBackground: '#f4f5f7', sidebarText: '#2a2d34' },
      headingFont: 'free-serif',
      bodyFont: 'ghea-grapalat',
      fontScale: 1,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'circle',
      showPhoto: false,
      levelStyle: 'text',
    },
  },
  modern: {
    id: 'modern',
    name: 'Ժամանակակից',
    tagline: 'Մուգ կողագոտի, լուսանկար և մաքուր տիպոգրաֆիկա',
    description:
      'Ձախ մուգ կողագոտում են լուսանկարը, կոնտակտները, հմտություններն ու լեզուները, իսկ հիմնական մասում՝ փորձն ու կրթությունը։ Ամենապահանջված ձևանմուշն է՝ համընդհանուր և ժամանակակից։',
    bestFor: ['Մենեջեր', 'Վաճառքի մասնագետ', 'Ծրագրավորող'],
    layout: 'side-left',
    defaults: {
      palette: { accent: '#14b8a6', background: '#ffffff', text: '#334155', heading: '#0f172a', muted: '#64748b', sidebarBackground: '#1e293b', sidebarText: '#e2e8f0' },
      headingFont: 'montserrat-armenian',
      bodyFont: 'mardoto',
      fontScale: 1,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'circle',
      showPhoto: true,
      levelStyle: 'bars',
    },
  },
  minimal: {
    id: 'minimal',
    name: 'Մինիմալ',
    tagline: 'Շատ օդ, քիչ գույն, ոչ մի ավելորդ բան',
    description:
      'Սև ու սպիտակ, մեծ լուսանցքներով և նուրբ վերնագրերով ձևանմուշ, որտեղ բովանդակությունն է խոսում։ Լավ է դիզայներների, ճարտարապետների և նրանց համար, ովքեր սիրում են զսպվածություն։',
    bestFor: ['Դիզայներ', 'Ճարտարապետ', 'Խմբագիր'],
    layout: 'single',
    defaults: {
      palette: { accent: '#111111', background: '#ffffff', text: '#333333', heading: '#000000', muted: '#8a8a8a', sidebarBackground: '#f5f5f5', sidebarText: '#333333' },
      headingFont: 'montserrat-armenian',
      bodyFont: 'mardoto',
      fontScale: 0.98,
      lineHeight: 1.55,
      spacing: 'relaxed',
      photoShape: 'square',
      showPhoto: false,
      levelStyle: 'none',
      showIcons: false,
    },
  },
  executive: {
    id: 'executive',
    name: 'Ղեկավար',
    tagline: 'Մուգ գլխագիր, ոսկեգույն շեշտեր, վստահություն',
    description:
      'Լայն մուգ գլխագիրը և ոսկեգույն շեշտերը ստեղծում են ներկայանալի, «ավագ» տպավորություն։ Աջ սյունակում՝ հմտություններն ու լեզուները։ Ստեղծված է ղեկավարների, տնօրենների և խորհրդատուների համար։',
    bestFor: ['Տնօրեն', 'Ղեկավար', 'Խորհրդատու'],
    layout: 'side-right',
    defaults: {
      palette: { accent: '#b08d57', background: '#ffffff', text: '#30343b', heading: '#1c2433', muted: '#767b85', sidebarBackground: '#1c2433', sidebarText: '#f5f1ea' },
      headingFont: 'free-serif',
      bodyFont: 'gaa-gayane',
      fontScale: 1,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'rounded',
      showPhoto: true,
      levelStyle: 'dots',
    },
  },
  creative: {
    id: 'creative',
    name: 'Ստեղծագործական',
    tagline: 'Վառ կողագոտի, մեծ անուն, համարձակ վերնագրեր',
    description:
      'Աջ կողմում վառ գունավոր սյունակ, խոշոր անուն և Bebas Neue ոճի վերնագրեր։ Ընտրեք, եթե ձեր ոլորտում անհատականությունն ավելի կարևոր է, քան կանոնները՝ մարքեթինգ, մեդիա, դիզայն։',
    bestFor: ['Մարքեթոլոգ', 'SMM մասնագետ', 'Գրաֆիկ դիզայներ'],
    layout: 'side-right',
    defaults: {
      palette: { accent: '#ff6b4a', background: '#fffaf5', text: '#2d2a26', heading: '#1f1f1f', muted: '#8b8178', sidebarBackground: '#ff6b4a', sidebarText: '#ffffff' },
      headingFont: 'arm-hmks-bebas-neue',
      bodyFont: 'mardoto',
      fontScale: 1,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'circle',
      showPhoto: true,
      levelStyle: 'bars',
    },
  },
  elegant: {
    id: 'elegant',
    name: 'Էլեգանտ',
    tagline: 'Կրեմագույն թուղթ, ազնիվ տառեր, հայկական զարդանախշ',
    description:
      'Կենտրոնացված, նրբագեղ ձևանմուշ կրեմագույն ֆոնի վրա՝ Braind Amanor վերնագրերով և դեկորատիվ բաժանարարներով։ Համապատասխանում է մշակույթի, կրթության, հյուրընկալության ոլորտներին։',
    bestFor: ['Ուսուցիչ', 'Մշակույթի մասնագետ', 'Հյուրանոցային ոլորտ'],
    layout: 'single',
    defaults: {
      palette: { accent: '#8c2f39', background: '#fbf7f0', text: '#3d3530', heading: '#2a1f1a', muted: '#8a7f76', sidebarBackground: '#f1e9dc', sidebarText: '#3d3530' },
      headingFont: 'braind-amanor',
      bodyFont: 'gaa-gayane',
      fontScale: 1,
      lineHeight: 1.5,
      spacing: 'normal',
      photoShape: 'circle',
      showPhoto: true,
      levelStyle: 'text',
    },
  },
  tech: {
    id: 'tech',
    name: 'Տեխնոլոգիական',
    tagline: 'Մուգ վահանակ, կանաչ շեշտ, հմտությունները՝ պիտակներով',
    description:
      'Ծրագրավորողների և IT մասնագետների համար՝ մուգ գլխամաս, «տերմինալային» կանաչ շեշտեր և հմտությունների պիտակներ։ Կարդացվում է արագ, ինչպես լավ գրված կոդը։',
    bestFor: ['Ծրագրավորող', 'DevOps', 'QA ինժեներ'],
    layout: 'side-left',
    defaults: {
      palette: { accent: '#10b981', background: '#ffffff', text: '#1f2937', heading: '#0b1220', muted: '#6b7280', sidebarBackground: '#0b1220', sidebarText: '#e5e7eb' },
      headingFont: 'nasa-font',
      bodyFont: 'mardoto',
      fontScale: 0.98,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'rounded',
      showPhoto: true,
      levelStyle: 'none',
    },
  },
  timeline: {
    id: 'timeline',
    name: 'Ժամանակագրություն',
    tagline: 'Կարիերան՝ որպես պատմություն ուղղահայաց գծի վրա',
    description:
      'Փորձն ու կրթությունը դասավորված են ուղղահայաց ժամանակագծի վրա՝ կետերով և ամսաթվերով։ Լավագույնն է, երբ ուզում եք ցույց տալ աճը և հետևողական կարիերան։',
    bestFor: ['Նախագծի ղեկավար', 'HR մասնագետ', 'Ինժեներ'],
    layout: 'single',
    defaults: {
      palette: { accent: '#7c3aed', background: '#ffffff', text: '#2e2a3a', heading: '#1a1530', muted: '#7a7488', sidebarBackground: '#f4f1fb', sidebarText: '#2e2a3a' },
      headingFont: 'braind-yerevan',
      bodyFont: 'arian-amu',
      fontScale: 1,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'circle',
      showPhoto: true,
      levelStyle: 'dots',
    },
  },
  compact: {
    id: 'compact',
    name: 'Կոմպակտ',
    tagline: 'Երկու հավասար սյունակ՝ շատ փորձը մեկ էջում',
    description:
      'Խիտ, երկու հավասար սյունակով ձևանմուշ փոքր տառաչափով։ Երբ ասելիքը շատ է, իսկ էջը՝ մեկ, սա ամենախնայողական ընտրությունն է։',
    bestFor: ['Փորձառու մասնագետ', 'Գիտաշխատող', 'Ինժեներ'],
    layout: 'split',
    defaults: {
      palette: { accent: '#0f766e', background: '#ffffff', text: '#27303a', heading: '#0f1b24', muted: '#6b7680', sidebarBackground: '#f2f7f6', sidebarText: '#27303a' },
      headingFont: 'free-sans',
      bodyFont: 'free-sans',
      fontScale: 0.9,
      lineHeight: 1.35,
      spacing: 'compact',
      photoShape: 'square',
      showPhoto: false,
      levelStyle: 'dots',
    },
  },
  bold: {
    id: 'bold',
    name: 'Համարձակ',
    tagline: 'Դեղին ու սև, խոշոր անուն, աչքի ընկնող',
    description:
      'Սև ֆոնի վրա դեղին շեշտերով մեծ գլխագիր և ուժեղ կոնտրաստ։ Նրանց համար, ովքեր ուզում են, որ իրենց ռեզյումեն տարբերվի կույտի մեջ։',
    bestFor: ['Ստարտափ', 'Վաճառքներ', 'Կրեատիվ ոլորտ'],
    layout: 'single',
    defaults: {
      palette: { accent: '#facc15', background: '#ffffff', text: '#1f1f1f', heading: '#111111', muted: '#6f6f6f', sidebarBackground: '#111111', sidebarText: '#fafafa' },
      headingFont: 'amar',
      bodyFont: 'mardoto',
      fontScale: 1,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'square',
      showPhoto: true,
      levelStyle: 'bars',
    },
  },
  academic: {
    id: 'academic',
    name: 'Ակադեմիական',
    tagline: 'Բաժինների անունները ձախ սյունակում, ինչպես գիտական CV-ում',
    description:
      'Դասական ակադեմիական դասավորություն. բաժնի անունը ձախ նեղ սյունակում, բովանդակությունը՝ աջում։ Հրապարակումներ, դասավանդում, դրամաշնորհներ՝ ամեն ինչ կարգով։',
    bestFor: ['Դասախոս', 'Գիտաշխատող', 'Ասպիրանտ'],
    layout: 'single',
    defaults: {
      palette: { accent: '#7f1d1d', background: '#ffffff', text: '#2b2b2b', heading: '#1a1a1a', muted: '#707070', sidebarBackground: '#faf6f4', sidebarText: '#2b2b2b' },
      headingFont: 'free-serif',
      bodyFont: 'free-serif',
      fontScale: 1,
      lineHeight: 1.45,
      spacing: 'normal',
      photoShape: 'square',
      showPhoto: false,
      levelStyle: 'text',
      showIcons: false,
    },
  },
  soft: {
    id: 'soft',
    name: 'Մեղմ',
    tagline: 'Պաստելային քարտեր, կլորացված անկյուններ, ջերմություն',
    description:
      'Բաց մանուշակագույն ֆոնի վրա սպիտակ քարտեր՝ կլորացված անկյուններով։ Ընկերական և ժամանակակից տեսք՝ հարմար սկսնակների, ուսանողների և սպասարկման ոլորտի համար։',
    bestFor: ['Ուսանող', 'Սկսնակ մասնագետ', 'Հաճախորդների սպասարկում'],
    layout: 'side-left',
    defaults: {
      palette: { accent: '#6d5dfc', background: '#f4f2ff', text: '#3a3650', heading: '#221f38', muted: '#8a86a3', sidebarBackground: '#ffffff', sidebarText: '#3a3650' },
      headingFont: 'montserrat-armenian',
      bodyFont: 'mardoto',
      fontScale: 1,
      lineHeight: 1.5,
      spacing: 'normal',
      photoShape: 'circle',
      showPhoto: true,
      levelStyle: 'dots',
    },
  },
}

export const TEMPLATE_LIST: TemplateMeta[] = TEMPLATE_IDS.map((id) => TEMPLATES[id])

export const DEFAULT_TEMPLATE_ID: TemplateId = 'modern'

/**
 * Templates that paint with the sidebar roles: a sidebar strip, a full-bleed band (executive,
 * bold) or cards (soft). Elsewhere those two colours do nothing, so the panel hides them.
 */
export const TEMPLATES_WITH_SIDE_COLORS: ReadonlySet<TemplateId> = new Set([
  'modern',
  'executive',
  'creative',
  'tech',
  'bold',
  'soft',
])

export const isTemplateId = (value: unknown): value is TemplateId =>
  typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value)

/** The full design a template starts a CV with. */
export const templateDesign = (id: TemplateId): CvDesign => {
  const { defaults } = TEMPLATES[id]
  return { ...defaults, palette: { ...defaults.palette }, showIcons: defaults.showIcons ?? true, templateId: id }
}
