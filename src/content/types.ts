import type { SampleCv } from '@constants/sampleCvs'
import type { TemplateId } from '@constants/templates'

/**
 * The site's articles (`/guides`) and CV examples (`/examples`): Armenian copy as typed data,
 * one file per page, named after its slug. Text fields take two inline marks, rendered by
 * `RichText`: `[label](/path)` links and `**bold**`. `tests/unit/content` checks the rest —
 * slugs, lengths, links, related pages, Armenian punctuation.
 */

export type ContentBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  /** A highlighted piece of advice. */
  | { kind: 'tip'; text: string }
  /** The same line written weakly, then well. */
  | { kind: 'compare'; weak: string; strong: string }
  /** Text meant to be copied: a cover letter, a summary. `label` names it. */
  | { kind: 'sample'; label: string; text: string }

export type ContentSection = {
  /** The heading's anchor, for the table of contents: lowercase Latin, dashes. */
  id: string
  heading: string
  blocks: ContentBlock[]
}

export type FaqItem = { question: string; answer: string }

/** What every content page has: metadata, search phrasing and dates. */
type ContentPage = {
  /** The URL's last part: the main search phrase, transliterated (`inchpes-grel-inqnakensagrakan`). */
  slug: string
  /** The `<h1>` and the Article headline. */
  title: string
  /** For cards, breadcrumbs and the share image. */
  shortTitle: string
  /** `<title>`: the main keyword first, at most 65 characters, no brand (Google adds the site name). */
  metaTitle: string
  /** The meta description, 110-160 characters. */
  description: string
  /** The title in Latin letters, as many people type Armenian: the Article's `alternativeHeadline`. */
  latinTitle: string
  /** Other ways people search for this, Latin-lettered among them: shown under the article. */
  searchTerms: string[]
  /** ISO dates (YYYY-MM-DD). */
  published: string
  updated: string
  intro: string[]
  sections: ContentSection[]
  faq: FaqItem[]
}

export type Guide = ContentPage & {
  /** The template drawn on the share image. */
  cardTemplate: TemplateId
  /** Other guides, by slug. */
  related: string[]
  /** CV examples, by slug. */
  relatedExamples: string[]
}

export type CvExample = ContentPage & {
  /** The profession, as a card names it: «Ծրագրավորող». */
  profession: string
  /** The template the example is shown and opened in. */
  templateId: TemplateId
  /** The CV itself: shown on the page, and the text of "use this example". */
  cv: SampleCv
  /** Other examples, by slug. */
  related: string[]
  /** Guides, by slug. */
  relatedGuides: string[]
}
