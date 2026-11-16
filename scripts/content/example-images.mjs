#!/usr/bin/env node
/**
 * `pnpm content:images` — draws each CV example's first page as WebP
 * (`public/content/examples/<slug>.webp`) and records what was drawn in
 * `src/content/exampleImages.json` (see `src/content/exampleImages.ts`).
 *
 * Needs the web running (`pnpm dev` or `pnpm start`, :7009, or CONTENT_IMAGES_ORIGIN). It opens
 * `/render` — the PDF's own print page — and hands it the document exactly as the API's
 * headless Chrome does (`window.__CV_RENDER__`), so the picture is the PDF's first page.
 *
 * Run by tsx (it imports the TypeScript content): the package script takes care of that.
 * `--force` redraws every picture; otherwise only those whose fingerprint changed.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CV_EXAMPLES } from '../../src/content/index.ts'
import { exampleRenderInput } from '../../src/content/exampleImages.ts'
import { contentFromSample } from '../../src/helpers/cvFactory.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const ORIGIN = (process.env.CONTENT_IMAGES_ORIGIN ?? 'http://localhost:7009').replace(/\/+$/, '')
const OUT_DIR = path.join(ROOT, 'public/content/examples')
const MANIFEST = path.join(ROOT, 'src/content/exampleImages.json')
/** A4 at 96dpi, drawn at 2x: sharp on any screen, ~1588 px wide. */
const A4 = { width: 794, height: 1123 }
const SCALE = 2

/** Twin of the content test's: the hash of what the picture shows. */
export const fingerprint = (input) => createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16)

const main = async () => {
  // Puppeteer is the API's dependency (it prints the PDFs); borrow it rather than add a second Chrome.
  const puppeteer = createRequire(path.join(ROOT, 'server/package.json'))('puppeteer')

  try {
    await fetch(`${ORIGIN}/render`, { signal: AbortSignal.timeout(60_000) })
  } catch {
    throw new Error(`the web is not answering at ${ORIGIN}: start it (pnpm dev) and run again`)
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  const force = process.argv.includes('--force')
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({ headless: 'shell' })
  try {
    for (const example of CV_EXAMPLES) {
      const input = exampleRenderInput(example)
      const print = fingerprint(input)
      if (!force && manifest[example.slug]?.fingerprint === print) {
        console.log(`  ${example.slug}: up to date`)
        continue
      }
      const page = await browser.newPage()
      await page.setViewport({ ...A4, deviceScaleFactor: SCALE })
      const doc = { title: example.title, content: contentFromSample(input.cv), design: input.design }
      await page.evaluateOnNewDocument((d) => {
        window.__CV_RENDER__ = d
      }, doc)
      await page.goto(`${ORIGIN}/render`, { waitUntil: 'networkidle0', timeout: 120_000 })
      await page.waitForSelector('[data-cv-ready="true"]', { timeout: 60_000 })
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      if (height > A4.height + 4) console.log(`  ${example.slug}: runs past one page (${height}px); the picture shows page 1`)
      const file = path.join(OUT_DIR, `${example.slug}.webp`)
      await page.screenshot({ path: file, type: 'webp', quality: 82, clip: { x: 0, y: 0, ...A4 } })
      await page.close()
      manifest[example.slug] = { fingerprint: print, width: A4.width * SCALE, height: A4.height * SCALE }
      console.log(`  ${example.slug}: drawn (${Math.round(readFileSync(file).length / 1024)} KB)`)
    }
  } finally {
    await browser.close()
  }

  // Only the examples that exist, in their order.
  const ordered = Object.fromEntries(CV_EXAMPLES.flatMap((example) => (manifest[example.slug] ? [[example.slug, manifest[example.slug]]] : [])))
  writeFileSync(MANIFEST, `${JSON.stringify(ordered, null, 2)}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
