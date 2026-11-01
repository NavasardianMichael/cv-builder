import puppeteer, { type Browser } from 'puppeteer'
import type { CvContent, CvDesign } from './cvDocument.js'
import { config } from '../config.js'

/**
 * CV -> PDF, by printing the web app's own `/render` page in headless Chrome. The PDF is
 * therefore the editor's preview exactly: same React template, same CSS, same fonts — and
 * real, selectable text with the fonts embedded.
 *
 * The document is handed to the page before any script runs (`evaluateOnNewDocument`), so
 * `/render` has no API of its own and no URL that could print someone else's CV. Every
 * request the page makes outside `renderOrigin` is aborted.
 *
 * Every print launches its own browser and closes it, so between downloads Chrome holds no
 * memory at all, and a crash or leak dies with the one print it happened in. It is
 * `chrome-headless-shell`, which Puppeteer downloads beside Chrome: the same PDF on about
 * two-thirds of the memory, and a launch under 100ms — about half a second per download in
 * all, against a browser kept warm. `MAX_CONCURRENT` caps the browsers alive at once, which
 * is what bounds memory, and `MAX_WAITING` caps the queue behind them.
 */
/** `watermark` stamps the free PDF's "made with" link in every page's bottom-right corner. */
export type RenderDocument = { title: string; content: CvContent; design: CvDesign; watermark: boolean }

const MAX_CONCURRENT = 1
/**
 * Beyond this many waiting, a print is refused (`PdfBusyError`) rather than queued: the free
 * PDF is public, and a script must not be able to stack work in front of paying customers.
 */
const MAX_WAITING = 8
const NAVIGATION_TIMEOUT_MS = 30_000

const launch = (): Promise<Browser> =>
  puppeteer.launch({
    headless: 'shell',
    // A PDF is drawn as vectors, never on a GPU: this only spares the GPU helper process.
    args: ['--disable-gpu', ...(config.puppeteerNoSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : [])],
  })

let active = 0
const waiting: (() => void)[] = []

/** The print queue is full; try again shortly. */
export class PdfBusyError extends Error {}

const acquire = async (): Promise<void> => {
  if (active < MAX_CONCURRENT) {
    active += 1
    return
  }
  if (waiting.length >= MAX_WAITING) throw new PdfBusyError('PDF queue is full')
  await new Promise<void>((resolve) => waiting.push(resolve))
  active += 1
}

const release = (): void => {
  active -= 1
  waiting.shift()?.()
}

export const renderCvPdf = async (cv: RenderDocument): Promise<Uint8Array> => {
  await acquire()
  let browser: Browser | null = null

  try {
    browser = await launch()
    const page = await browser.newPage()
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const url = request.url()
      if (url.startsWith(`${config.renderOrigin}/`) || url.startsWith('data:')) void request.continue()
      else void request.abort()
    })

    await page.evaluateOnNewDocument((doc) => {
      ;(window as unknown as { __CV_RENDER__: unknown }).__CV_RENDER__ = doc
    }, cv)

    await page.goto(`${config.renderOrigin}/render`, { waitUntil: 'networkidle0', timeout: NAVIGATION_TIMEOUT_MS })
    await page.waitForSelector('[data-cv-ready="true"]', { timeout: NAVIGATION_TIMEOUT_MS })
    await page.evaluate(() => globalThis.document.fonts.ready.then(() => undefined))

    return await page.pdf({ printBackground: true, preferCSSPageSize: true })
  } finally {
    await browser?.close().catch(() => undefined)
    release()
  }
}

/** A filesystem- and header-safe file name; Armenian letters are kept. */
export const pdfFileName = (title: string): string => {
  const base = title
    .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return `${base || 'CV'}.pdf`
}
