import type { CSSProperties, ReactNode } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { APP_DESCRIPTION, APP_NAME, APP_NAME_LATIN, LOCALE, OG_LOCALE } from '@constants/app'
import { cn } from '@helpers/cn'
import { getSiteUrl } from '@helpers/url'
import { App } from '@components/App'
import '@styles/globals.css'
import { fontDisplay, fontUi } from '@styles/fonts'
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
  keywords: ['ինքնակենսագրական', 'ռեզյումե', 'CV', 'ինքնակենսագրություն', 'ինքնակենսագրականի ձևանմուշ', 'ռեզյումեի ձևանմուշ', 'CV հայերեն', 'աշխատանք Հայաստանում', 'resume Armenia'],
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
      className={cn(fontUi.variable, fontDisplay.variable, CSS_VAR_SCOPE)}
      style={BRAND_CSS_VARS as CSSProperties}
    >
      <body>
        <AntdRegistry>
          <NextIntlClientProvider>
            <App>{children}</App>
          </NextIntlClientProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
