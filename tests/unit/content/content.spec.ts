import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { examplePath, guidePath, ROUTES, templatePath } from '@constants/routes'
import { SECTION_META } from '@constants/sections'
import { TEMPLATE_IDS } from '@constants/templates'
import { CV_EXAMPLES, GUIDES, pageTexts } from '@content/index'
import type { CvExample, Guide } from '@content/types'
import { inlineLinks } from '@helpers/inlineMarkup'

/**
 * The content pipeline's gate (`.github/workflows/content.yml`): what a page needs to be
 * served, found and read — and the Armenian punctuation slips that are easiest to type.
 */

const PAGES: (Guide | CvExample)[] = [...GUIDES, ...CV_EXAMPLES]
const label = (page: Guide | CvExample): string => page.slug

const ARMENIAN_LETTER = 'Ա-և'

/** Paths a content link may point at: public pages only. */
const LINKABLE = new Set<string>([
  ROUTES.home,
  ROUTES.templates,
  ROUTES.pricing,
  ROUTES.contact,
  ROUTES.guides,
  ROUTES.examples,
  ...GUIDES.map((guide) => guidePath(guide.slug)),
  ...CV_EXAMPLES.map((example) => examplePath(example.slug)),
  ...TEMPLATE_IDS.map((id) => templatePath(id)),
])

/** Lowercase Latin, digits, single dashes between. */
const isSlug = (value: string): boolean => /^[a-z0-9-]+$/.test(value) && !/^-|-$|--/.test(value)

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

  it('links only to public pages of this site', () => {
    for (const page of PAGES) {
      for (const href of pageTexts(page).flatMap(inlineLinks)) {
        expect(LINKABLE.has(href), `${label(page)} links to ${href}`).toBe(true)
      }
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
  const texts = PAGES.flatMap((page) => pageTexts(page).map((text) => ({ page: label(page), text })))

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
