import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { examplePath, guidePath, ROUTES, templatePath } from '@constants/routes'
import { SECTION_META } from '@constants/sections'
import { TEMPLATE_IDS } from '@constants/templates'
import { ABOUT } from '@content/about'
import { exampleImageEntry, exampleRenderInput } from '@content/exampleImages'
import { CV_EXAMPLES, GUIDES, pageTexts, sectionTexts, videoFiles } from '@content/index'
import type { CvExample, Guide } from '@content/types'
import { contentFromSample } from '@helpers/cvFactory'
import { inlineLinks } from '@helpers/inlineMarkup'
import { fingerprint } from '../../../scripts/content/example-images.mjs'
import { coerceContent } from '../../../server/src/services/cvDocument'

/**
 * The content pipeline's gate (`.github/workflows/content.yml`): what a page needs to be
 * served, found and read — and the Armenian punctuation slips that are easiest to type.
 */

const PAGES: (Guide | CvExample)[] = [...GUIDES, ...CV_EXAMPLES]

const aboutTexts = (): string[] => [ABOUT.title, ABOUT.metaTitle, ABOUT.description, ...ABOUT.intro, ...ABOUT.sections.flatMap(sectionTexts)]
const label = (page: Guide | CvExample): string => page.slug

const ARMENIAN_LETTER = 'Ա-և'

/** Paths a content link may point at: public pages only. */
const LINKABLE = new Set<string>([
  ROUTES.home,
  ROUTES.templates,
  ROUTES.pricing,
  ROUTES.contact,
  ROUTES.about,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.refundPolicy,
  ROUTES.guides,
  ROUTES.examples,
  ...GUIDES.map((guide) => guidePath(guide.slug)),
  ...CV_EXAMPLES.map((example) => examplePath(example.slug)),
  ...TEMPLATE_IDS.map((id) => templatePath(id)),
])

/** Lowercase Latin, digits, single dashes between. */
const isSlug = (value: string): boolean => /^[a-z0-9-]+$/.test(value) && !/^-|-$|--/.test(value)

/** Official sources a page may cite (opened in a new tab): https only, these hosts only. */
const TRUSTED_HOSTS = new Set(['europass.europa.eu', 'fonter.am'])

const isAllowedLink = (href: string): boolean => {
  if (href.startsWith('/')) return LINKABLE.has(href)
  try {
    const url = new URL(href)
    return url.protocol === 'https:' && TRUSTED_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

const fileSlugs = (folder: string): string[] =>
  readdirSync(path.join(process.cwd(), 'src/content', folder))
    .filter((name) => name.endsWith('.ts'))
    .map((name) => name.replace(/\.ts$/, ''))
    .sort()

describe('content registry', () => {
  it('lists every file once, under its own slug', () => {
    expect(GUIDES.map((guide) => guide.slug).sort()).toEqual(fileSlugs('guides'))
    expect(CV_EXAMPLES.map((example) => example.slug).sort()).toEqual(fileSlugs('examples'))
  })

  it('gives every page a URL-safe slug', () => {
    for (const page of PAGES) expect(isSlug(page.slug), label(page)).toBe(true)
  })

  it('links every page from at least one other page', () => {
    const linked = new Set([
      ...GUIDES.flatMap((guide) => [...guide.related, ...guide.relatedExamples]),
      ...CV_EXAMPLES.flatMap((example) => [...example.related, ...example.relatedGuides]),
    ])
    for (const page of PAGES) expect(linked.has(page.slug), `${label(page)} is linked from no page`).toBe(true)
  })

  it('relates only to pages that exist, never to itself', () => {
    const guides = new Set(GUIDES.map((guide) => guide.slug))
    const examples = new Set(CV_EXAMPLES.map((example) => example.slug))
    for (const guide of GUIDES) {
      for (const slug of guide.related) expect(guides.has(slug) && slug !== guide.slug, `${guide.slug} → ${slug}`).toBe(true)
      for (const slug of guide.relatedExamples) expect(examples.has(slug), `${guide.slug} → ${slug}`).toBe(true)
    }
    for (const example of CV_EXAMPLES) {
      for (const slug of example.related) expect(examples.has(slug) && slug !== example.slug, `${example.slug} → ${slug}`).toBe(true)
      for (const slug of example.relatedGuides) expect(guides.has(slug), `${example.slug} → ${slug}`).toBe(true)
    }
  })
})

describe('search metadata', () => {
  it('keeps titles and descriptions within what results show', () => {
    for (const page of PAGES) {
      expect(page.metaTitle.length, `${label(page)} metaTitle`).toBeLessThanOrEqual(65)
      expect(page.title.length, `${label(page)} title (Article headline)`).toBeLessThanOrEqual(110)
      expect(page.description.length, `${label(page)} description`).toBeGreaterThanOrEqual(110)
      expect(page.description.length, `${label(page)} description`).toBeLessThanOrEqual(160)
    }
  })

  it('gives every page a unique title and description', () => {
    for (const field of ['title', 'metaTitle', 'description'] as const) {
      const values = PAGES.map((page) => page[field])
      expect(new Set(values).size, field).toBe(values.length)
    }
  })

  it('names Latin-lettered searches on every page', () => {
    for (const page of PAGES) {
      expect(page.searchTerms.some((term) => /^[a-z0-9 -]+$/.test(term)), label(page)).toBe(true)
      expect(page.latinTitle, label(page)).toMatch(/^[\x20-\x7E—]+$/)
    }
  })

  it('dates every page, never updated before it was published', () => {
    for (const page of PAGES) {
      expect(page.published, label(page)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(page.updated, label(page)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(page.updated >= page.published, label(page)).toBe(true)
    }
  })
})

describe('page structure', () => {
  it('anchors sections uniquely, leaving `hartser` to the questions', () => {
    for (const page of PAGES) {
      const ids = page.sections.map((section) => section.id)
      expect(new Set(ids).size, label(page)).toBe(ids.length)
      for (const id of ids) {
        expect(isSlug(id), `${label(page)} #${id}`).toBe(true)
        expect(id, label(page)).not.toBe('hartser')
      }
    }
  })

  it('has a body: sections, or a page of questions', () => {
    for (const page of PAGES) {
      expect(page.intro.length, label(page)).toBeGreaterThan(0)
      expect(page.sections.length >= 3 || page.faq.length >= 8, label(page)).toBe(true)
    }
  })

  it('links only to public pages of this site and to trusted sources', () => {
    const about = { slug: 'about', texts: aboutTexts() }
    for (const { slug, texts } of [...PAGES.map((page) => ({ slug: page.slug, texts: pageTexts(page) })), about]) {
      for (const href of texts.flatMap(inlineLinks)) {
        expect(isAllowedLink(href), `${slug} links to ${href}`).toBe(true)
      }
    }
  })

  // "Use this example" saves the CV through the API, which trims what breaks its rules
  // (lengths, counts, catalogue types) without an error. A content-only push deploys no API,
  // so the content must fit the API that is already live.
  it('keeps every example CV whole through the API save', () => {
    for (const example of CV_EXAMPLES) {
      const content = contentFromSample(example.cv)
      expect(coerceContent(content), example.slug).toEqual(content)
    }
  })

  it('has a current picture of every example CV (pnpm content:images)', () => {
    for (const example of CV_EXAMPLES) {
      const entry = exampleImageEntry(example.slug)
      expect(entry, `${example.slug}: no picture — run pnpm content:images`).toBeDefined()
      expect(entry?.fingerprint, `${example.slug}: the CV changed since its picture — run pnpm content:images`).toBe(
        fingerprint(exampleRenderInput(example))
      )
      expect(existsSync(path.join(process.cwd(), 'public/content/examples', `${example.slug}.webp`)), example.slug).toBe(true)
    }
  })

  it('has the files of every content video (pnpm content:video)', () => {
    for (const guide of GUIDES) {
      if (!guide.video) continue
      for (const file of Object.values(videoFiles(guide.video))) {
        expect(existsSync(path.join(process.cwd(), 'public', file)), `${guide.slug}: ${file}`).toBe(true)
      }
      expect(guide.video.durationSeconds, guide.slug).toBeGreaterThan(0)
      expect(guide.video.uploaded, guide.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('shows complete CVs in the examples', () => {
    for (const example of CV_EXAMPLES) {
      const types = example.cv.sections.map((section) => section.type)
      for (const type of ['summary', 'experience', 'education', 'skills', 'languages'] as const) {
        expect(types, `${example.slug} has no ${type}`).toContain(type)
      }
      expect(example.cv.contacts.length, example.slug).toBeGreaterThan(1)
      for (const section of example.cv.sections) {
        const kind = SECTION_META[section.type].kind
        if (kind === 'entries') expect(section.entries?.length, `${example.slug} ${section.type}`).toBeGreaterThan(0)
        if (kind === 'tags') expect(section.tags?.length, `${example.slug} ${section.type}`).toBeGreaterThan(0)
        if (kind === 'text') expect(section.text, `${example.slug} ${section.type}`).toBeTruthy()
      }
    }
  })
})

describe('Armenian punctuation', () => {
  const texts = [
    ...PAGES.flatMap((page) => pageTexts(page).map((text) => ({ page: label(page), text }))),
    ...aboutTexts().map((text) => ({ page: 'about', text })),
  ]

  it('asks questions with ՞ on the word, never ?', () => {
    for (const page of PAGES) {
      for (const item of page.faq) expect(item.question, label(page)).toMatch(/՞/)
    }
    for (const { page, text } of texts) expect(text, page).not.toMatch(/\?/)
  })

  it('ends sentences with ։, not a Latin full stop or colon', () => {
    // «էլ. փոստ» and other abbreviations are followed by a lowercase word, a sentence end by a capital.
    const fullStop = new RegExp(`[${ARMENIAN_LETTER}]{2,}\\.\\s+[Ա-Ֆ]`)
    const lastStop = new RegExp(`[${ARMENIAN_LETTER}]{2,}\\.$`)
    const colon = new RegExp(`[${ARMENIAN_LETTER}]:`)
    for (const { page, text } of texts) {
      expect(text, page).not.toMatch(fullStop)
      expect(text, page).not.toMatch(lastStop)
      expect(text, page).not.toMatch(colon)
    }
  })

  it('quotes with «», not straight quotes, and has no stray spaces', () => {
    for (const { page, text } of texts) {
      expect(text, page).not.toMatch(/"/)
      expect(text, page).not.toMatch(/ {2}|^\s|\s$| [,։․՝]/)
      expect(text, page).not.toMatch(new RegExp(`[${ARMENIAN_LETTER}]!`))
    }
  })
})
