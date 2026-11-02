import type { CSSProperties, ReactNode } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { APP_DESCRIPTION, APP_NAME, APP_NAME_LATIN, LOCALE, OG_LOCALE } from '@constants/app'
import { SEARCH_KEYWORDS, SITE_VERIFICATION } from '@constants/seo'
import { cn } from '@helpers/cn'
import { getSiteUrl } from '@helpers/url'
import { Analytics } from '@components/analytics/Analytics'
import { App } from '@components/App'
import '@styles/globals.css'
import { fontUi } from '@styles/fonts'
import { BRAND_CSS_VARS, CSS_VAR_SCOPE, INK } from '@styles/tokens'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: INK[900],
  colorScheme: 'light',
}

/**
 * Site-wide defaults. No `alternates.canonical` here: metadata is inherited, so a root
 * canonical would mark every page a duplicate of `/`. Each public route declares its own.
 * Icons and the OG image come from the `icon.tsx` / `opengraph-image.tsx` conventions.
 */
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: `${APP_NAME} — Հայերեն ինքնակենսագրականի կառուցիչ`, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: SEARCH_KEYWORDS,
  verification: {
    ...(SITE_VERIFICATION.google && { google: SITE_VERIFICATION.google }),
    ...(SITE_VERIFICATION.yandex && { yandex: SITE_VERIFICATION.yandex }),
    ...(SITE_VERIFICATION.bing && { other: { 'msvalidate.01': SITE_VERIFICATION.bing } }),
  },
  manifest: '/manifest.webmanifest',
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    locale: OG_LOCALE,
    title: `${APP_NAME} — Հայերեն ինքնակենսագրականի կառուցիչ`,
    description: APP_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image' },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  other: { 'application-name-latin': APP_NAME_LATIN },
}

type Props = { children: ReactNode }

export default function RootLayout({ children }: Props) {
  return (
    <html
      lang={LOCALE}
      className={cn(fontUi.variable, CSS_VAR_SCOPE)}
      style={BRAND_CSS_VARS as CSSProperties}
    >
      <body>
        <AntdRegistry>
          <NextIntlClientProvider>
            <App>{children}</App>
          </NextIntlClientProvider>
        </AntdRegistry>
        <Analytics />
      </body>
    </html>
  )
}
