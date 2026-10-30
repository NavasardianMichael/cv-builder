import puppeteer, { type Browser, type Page } from 'puppeteer'
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
 * One browser is shared and relaunched if it dies; `MAX_CONCURRENT` caps the pages printing
 * at once, which is what bounds memory.
 */
/** `watermark` stamps the free PDF's "made with" link in every page's bottom-right corner. */
export type RenderDocument = { title: string; content: CvContent; design: CvDesign; watermark: boolean }

const MAX_CONCURRENT = 2
const NAVIGATION_TIMEOUT_MS = 30_000

let browserPromise: Promise<Browser> | null = null

const launch = (): Promise<Browser> =>
  puppeteer.launch({
    headless: true,
    args: config.puppeteerNoSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  })

const getBrowser = async (): Promise<Browser> => {
  browserPromise ??= launch().then((browser) => {
    browser.on('disconnected', () => {
      browserPromise = null
    })
    return browser
  })
  try {
    return await browserPromise
  } catch (error) {
    browserPromise = null
    throw error
  }
}

let active = 0
const waiting: (() => void)[] = []

const acquire = async (): Promise<void> => {
  if (active < MAX_CONCURRENT) {
    active += 1
    return
  }
  await new Promise<void>((resolve) => waiting.push(resolve))
  active += 1
}

const release = (): void => {
  active -= 1
  waiting.shift()?.()
}

export const renderCvPdf = async (cv: RenderDocument): Promise<Uint8Array> => {
  await acquire()
  let page: Page | null = null

  try {
    page = await (await getBrowser()).newPage()
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
    await page?.close().catch(() => undefined)
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
