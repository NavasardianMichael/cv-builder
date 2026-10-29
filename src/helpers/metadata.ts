import type { Metadata } from 'next'
import { APP_NAME, OG_LOCALE } from '@constants/app'
import { absoluteUrl } from './url'

/**
 * Per-page metadata for an indexable route: a self-canonical, and OpenGraph/Twitter that
 * repeat the page's own title and description (a root default would stamp the homepage's
 * onto every share card). One language, so no hreflang set.
 */
export const pageMetadata = ({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string
  description: string
  path: string
  /** Skip the root layout's "%s | Ռեզյումե" template (the homepage names the brand itself). */
  absoluteTitle?: boolean
}): Metadata => ({
  title: absoluteTitle ? { absolute: title } : title,
  description,
  alternates: { canonical: absoluteUrl(path) },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    locale: OG_LOCALE,
    url: absoluteUrl(path),
    title: absoluteTitle ? title : `${title} | ${APP_NAME}`,
    description,
  },
  twitter: { card: 'summary_large_image', title, description },
})

/** Signed-in and transactional pages: never indexed. */
export const privateMetadata = (title: string): Metadata => ({
  title,
  robots: { index: false, follow: false },
})
