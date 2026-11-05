import { FONT_SLUGS } from './fonts'
import { TEMPLATE_IDS } from './templates'

/** Brand and site-wide facts. */
export const APP_NAME = 'Իմ ինքնակենսագրականը'
export const APP_NAME_LATIN = 'CV Builder'

/** The one-line pitch: page titles, OG cards, llms.txt. */
export const APP_TAGLINE = 'Հայերեն ինքնակենսագրականի (CV) կառուցիչ'

export const APP_DESCRIPTION =
  `Ստեղծեք պրոֆեսիոնալ հայերեն ինքնակենսագրական (CV) րոպեների ընթացքում՝ ${TEMPLATE_IDS.length} ձևանմուշ, ${FONT_SLUGS.length} հայերեն տառատեսակ,` +
  ' ամբողջական խմբագրում հենց էջի վրա։ Պարզ, սև-սպիտակ, առանց նկարի ձևանմուշով PDF-ն անվճար է, պատրաստի, գունավոր, նկարով ձևանմուշովը՝ մեկանգամյա վճարով։'

/** The catalogue's sizes, for copy that names them (`{templates}`, `{fonts}` in hy.json). */
export const CATALOGUE_COUNTS = { templates: TEMPLATE_IDS.length, fonts: FONT_SLUGS.length }

/** The public domain, as printed in the free PDF's watermark (which links to it). */
export const SITE_DOMAIN = 'cv-builder.eapps.site'

/** `NEXT_PUBLIC_SITE_URL` when unset (local dev). */
export const SITE_URL_FALLBACK = 'http://localhost:7009'

export const API_URL_FALLBACK = 'http://localhost:9009'

export const API_REQUEST_TIMEOUT_MS = 30_000
/** Rendering a PDF in headless Chrome can take a while on a cold browser. */
export const API_PDF_TIMEOUT_MS = 90_000

export const LOCALE = 'hy'
export const OG_LOCALE = 'hy_AM'
/** Dates are shown in Armenian time wherever the browser or server is. */
export const TIME_ZONE = 'Asia/Yerevan'

export const SUPPORT_EMAIL = 'cv-builder@eapps.site'
/** Shown on the contact page as written; an empty one is left out. */
export const SUPPORT_PHONE = '098 75 16 15'
/** The phone in international form, for the Organization JSON-LD. */
export const SUPPORT_PHONE_TEL = '+37498751615'
/** The address in parts, for the Organization JSON-LD; `SUPPORT_ADDRESS` is the line shown. */
export const SUPPORT_POSTAL_ADDRESS = { street: 'Կուրղինյան 14շ, 33', locality: 'Երևան', country: 'AM' } as const
export const SUPPORT_ADDRESS = `Ք․ ${SUPPORT_POSTAL_ADDRESS.locality}, ${SUPPORT_POSTAL_ADDRESS.street}`
