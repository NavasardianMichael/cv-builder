import { type CvDesign } from '@store/cvs/single/types'
import { templateDesign } from '@constants/templates'
import manifest from './exampleImages.json'
import type { CvExample } from './types'

/**
 * Each CV example's picture: its first page, printed by the same renderer as the PDF
 * (`/render`) and saved as WebP in `public/content/examples/` by `pnpm content:images`.
 * A real image, unlike the HTML preview, can show in Google Images and in the Article's
 * structured data.
 *
 * `exampleImages.json` records, per slug, the fingerprint of what was drawn (the CV and its
 * template's design). The content tests recompute it: a CV changed without a new picture fails
 * the content pipeline instead of shipping a stale one.
 */
export type ExampleImage = { src: string; width: number; height: number }

type ManifestEntry = { fingerprint: string; width: number; height: number }

const IMAGES = manifest as Record<string, ManifestEntry>

/** What the picture depends on. Template styling (cv.css) is not in it: after restyling a template, run `pnpm content:images`. */
export const exampleRenderInput = (example: CvExample): { cv: CvExample['cv']; design: CvDesign } => ({
  cv: example.cv,
  design: templateDesign(example.templateId),
})

export const exampleImageEntry = (slug: string): ManifestEntry | undefined => IMAGES[slug]

/** The picture's URL (the fingerprint busts caches when it changes) and size. The content tests require one per example. */
export const exampleImage = (example: CvExample): ExampleImage => {
  const entry = IMAGES[example.slug]
  if (!entry) throw new Error(`no picture for the CV example "${example.slug}": run pnpm content:images`)
  return { src: `/content/examples/${example.slug}.webp?v=${entry.fingerprint}`, width: entry.width, height: entry.height }
}

/** The picture's alt text: what it shows, in the words people search for. */
export const exampleImageAlt = (example: CvExample, templateName: string): string =>
  `${example.title}՝ «${templateName}» ձևանմուշով`
