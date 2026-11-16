import { administrator } from './examples/administrator'
import { hachakhordneriSpasarkum } from './examples/hachakhordneri-spasarkum'
import { hashvapah } from './examples/hashvapah'
import { marketingiMasnaget } from './examples/marketingi-masnaget'
import { tsragravorogh } from './examples/tsragravorogh'
import { usutsich } from './examples/usutsich'
import { vacharqiMenejer } from './examples/vacharqi-menejer'
import { cvHartser } from './guides/cv-hartser'
import { cvRezyumeInqnakensagrutyun } from './guides/cv-rezyume-inqnakensagrutyun'
import { inchpesGrelInqnakensagrakan } from './guides/inchpes-grel-inqnakensagrakan'
import { inqnakensagrakanArantsPordzi } from './guides/inqnakensagrakan-arants-pordzi'
import { ughektsoghNamak } from './guides/ughektsogh-namak'
import type { ContentSection, ContentVideo, CvExample, FaqItem, Guide } from './types'

/**
 * Every article and CV example, in the order the hubs list them. Adding a page: a file named
 * after its slug in `guides/` or `examples/`, a line here, then `pnpm test` — the content
 * tests check the rest. A push that changes only `src/content/**` deploys through
 * `.github/workflows/content.yml` (docs/DEPLOYMENT.md, "Content").
 */
export const GUIDES: Guide[] = [
  inchpesGrelInqnakensagrakan,
  inqnakensagrakanArantsPordzi,
  cvRezyumeInqnakensagrutyun,
  ughektsoghNamak,
  cvHartser,
]

export const CV_EXAMPLES: CvExample[] = [
  tsragravorogh,
  hashvapah,
  vacharqiMenejer,
  usutsich,
  hachakhordneriSpasarkum,
  marketingiMasnaget,
  administrator,
]

export const findGuide = (slug: unknown): Guide | undefined => GUIDES.find((guide) => guide.slug === slug)

export const findExample = (slug: unknown): CvExample | undefined => CV_EXAMPLES.find((example) => example.slug === slug)

/** In the given order, unknown slugs left out. */
export const guidesBySlug = (slugs: string[]): Guide[] => slugs.flatMap((slug) => findGuide(slug) ?? [])
export const examplesBySlug = (slugs: string[]): CvExample[] => slugs.flatMap((slug) => findExample(slug) ?? [])

/** A section's text, heading included: reading time and the content tests. */
export const sectionTexts = (section: ContentSection): string[] => [
  section.heading,
  ...section.blocks.flatMap((block) => {
    switch (block.kind) {
      case 'p':
      case 'tip':
        return [block.text]
      case 'list':
        return block.items
      case 'compare':
        return [block.weak, block.strong]
      case 'sample':
        return [block.text]
    }
  }),
]

/** Armenian words read slower than English ones: ~160 a minute. */
const WORDS_PER_MINUTE = 160

export const readingMinutes = (page: { intro: string[]; sections: ContentSection[]; faq: FaqItem[] }): number => {
  const text = [...page.intro, ...page.sections.flatMap(sectionTexts), ...page.faq.flatMap((item) => [item.question, item.answer])].join(' ')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** A content video's files, served from `public/`. */
export const videoFiles = (video: ContentVideo): { src: string; poster: string; captions: string } => ({
  src: `/content/video/${video.file}.mp4`,
  poster: `/content/video/${video.file}.jpg`,
  captions: `/content/video/${video.file}.vtt`,
})

/** Every text field of a page, for the content tests. */
export const pageTexts = (page: Guide | CvExample): string[] => [
  ...('video' in page && page.video ? [page.video.title, page.video.description] : []),
  page.title,
  page.shortTitle,
  page.metaTitle,
  page.description,
  ...page.intro,
  ...page.sections.flatMap(sectionTexts),
  ...page.faq.flatMap((item) => [item.question, item.answer]),
]
