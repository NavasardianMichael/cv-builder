import type { MetadataRoute } from 'next'
import { examplePath, guidePath, ROUTES, templatePath } from '@constants/routes'
import { TEMPLATE_IDS } from '@constants/templates'
import { ABOUT } from '@content/about'
import { exampleImage } from '@content/exampleImages'
import { CV_EXAMPLES, GUIDES, videoFiles } from '@content/index'
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
    // The CV picture too, so it can be found in Google Images.
    ...CV_EXAMPLES.map((example) => ({
      ...page(examplePath(example.slug), 0.8, 'monthly', example.updated),
      images: [absoluteUrl(exampleImage(example).src)],
    })),
    page(ROUTES.guides, 0.8, 'weekly', latest(GUIDES.map((guide) => guide.updated))),
    ...GUIDES.map((guide) => ({
      ...page(guidePath(guide.slug), 0.8, 'monthly', guide.updated),
      ...(guide.video
        ? {
            videos: [
              {
                title: guide.video.title,
                description: guide.video.description,
                thumbnail_loc: absoluteUrl(videoFiles(guide.video).poster),
                content_loc: absoluteUrl(videoFiles(guide.video).src),
                duration: guide.video.durationSeconds,
                publication_date: `${guide.video.uploaded}T12:00:00+04:00`,
              },
            ],
          }
        : {}),
    })),
    page(ROUTES.pricing, 0.7, 'monthly'),
    page(ROUTES.about, 0.4, 'yearly', ABOUT.updated),
    page(ROUTES.contact, 0.3, 'yearly'),
    page(ROUTES.terms, 0.2, 'yearly'),
    page(ROUTES.privacy, 0.2, 'yearly'),
    page(ROUTES.refundPolicy, 0.2, 'yearly'),
  ]
}
