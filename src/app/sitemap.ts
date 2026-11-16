import type { MetadataRoute } from 'next'
import { examplePath, guidePath, ROUTES, templatePath } from '@constants/routes'
import { TEMPLATE_IDS } from '@constants/templates'
import { CV_EXAMPLES, GUIDES } from '@content/index'
import { absoluteUrl } from '@helpers/url'

/** Every indexable page. One language, so no alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    lastModified?: string
  ) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
    ...(lastModified ? { lastModified } : {}),
  })
  // The newest content date: the hubs change when one of their pages does.
  const latest = (dates: string[]): string => dates.reduce((a, b) => (a > b ? a : b))

  return [
    page(ROUTES.home, 1, 'weekly'),
    page(ROUTES.templates, 0.9, 'weekly'),
    ...TEMPLATE_IDS.map((id) => page(templatePath(id), 0.8, 'monthly')),
    page(ROUTES.examples, 0.8, 'weekly', latest(CV_EXAMPLES.map((example) => example.updated))),
    ...CV_EXAMPLES.map((example) => page(examplePath(example.slug), 0.8, 'monthly', example.updated)),
    page(ROUTES.guides, 0.8, 'weekly', latest(GUIDES.map((guide) => guide.updated))),
    ...GUIDES.map((guide) => page(guidePath(guide.slug), 0.8, 'monthly', guide.updated)),
    page(ROUTES.pricing, 0.7, 'monthly'),
    page(ROUTES.contact, 0.3, 'yearly'),
    page(ROUTES.terms, 0.2, 'yearly'),
    page(ROUTES.privacy, 0.2, 'yearly'),
    page(ROUTES.refundPolicy, 0.2, 'yearly'),
  ]
}
