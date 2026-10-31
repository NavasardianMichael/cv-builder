import { TEMPLATE_IDS } from './templates'

/** Brand and site-wide facts. The brand name is a placeholder until the real one is chosen. */
export const APP_NAME = 'Ռեզյումե'
export const APP_NAME_LATIN = 'Rezyume'

/** The one-line pitch: page titles, OG cards, llms.txt. */
export const APP_TAGLINE = 'Հայերեն ինքնակենսագրականի (CV) կառուցիչ'

export const APP_DESCRIPTION =
  `Ստեղծեք պրոֆեսիոնալ հայերեն ինքնակենսագրական (CV) րոպեների ընթացքում՝ ${TEMPLATE_IDS.length} ձևանմուշ, 20 հայերեն տառատեսակ, ` +
  'ամբողջական խմբագրում հենց էջի վրա։ Պարզ սև-սպիտակ PDF-ն անվճար է, ձևավորվածը՝ մեկանգամյա վճարով։'

/** The public domain, as printed in the free PDF's watermark (which links to it). */
export const SITE_DOMAIN = 'cv-builder.eapps.com'

/** `NEXT_PUBLIC_SITE_URL` when unset (local dev). */
export const SITE_URL_FALLBACK = 'http://localhost:7009'

export const API_URL_FALLBACK = 'http://localhost:9009'

export const API_REQUEST_TIMEOUT_MS = 30_000
/** Rendering a PDF in headless Chrome can take a while on a cold browser. */
export const API_PDF_TIMEOUT_MS = 90_000

export const LOCALE = 'hy'
export const OG_LOCALE = 'hy_AM'

export const SUPPORT_EMAIL = 'support@rezyume.am'
