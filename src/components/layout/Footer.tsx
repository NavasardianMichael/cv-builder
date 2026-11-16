import type { FC, ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { APP_NAME } from '@constants/app'
import { FONTS_SOURCE_URL } from '@constants/fonts'
import { examplePath, guidePath, ROUTES } from '@constants/routes'
import { CV_EXAMPLES, GUIDES } from '@content/index'
import { GA_ID } from '@helpers/analytics'
import { ConsentSettingsLink } from '@components/analytics/ConsentSettingsLink'
import { BrandLogo } from './BrandLogo'
import { PreferredSourceBadge } from './PreferredSourceBadge'

export const Footer: FC = async () => {
  const t = await getTranslations('Footer')
  const tNav = await getTranslations('Nav')

  const columns: { title: string; links: { href: string; label: string }[]; extra?: ReactNode }[] = [
    {
      title: t('product'),
      links: [
        { href: ROUTES.templates, label: tNav('templates') },
        { href: ROUTES.pricing, label: tNav('pricing') },
        { href: ROUTES.contact, label: tNav('contact') },
        { href: ROUTES.signIn, label: tNav('signIn') },
      ],
    },
    {
      // Every article and example from every page: how they are found and crawled.
      title: t('resources'),
      links: [
        { href: ROUTES.guides, label: tNav('guides') },
        ...GUIDES.map((guide) => ({ href: guidePath(guide.slug), label: guide.shortTitle })),
        { href: ROUTES.examples, label: tNav('examples') },
        ...CV_EXAMPLES.map((example) => ({ href: examplePath(example.slug), label: example.shortTitle })),
      ],
    },
    {
      title: t('legal'),
      links: [
        { href: ROUTES.terms, label: t('terms') },
        { href: ROUTES.privacy, label: t('privacy') },
        { href: ROUTES.refundPolicy, label: t('refund') },
      ],
      // Reopens the analytics banner, to change the answer (helpers/consent.ts).
      extra: GA_ID ? (
        <li>
          <ConsentSettingsLink className='cursor-pointer border-0 bg-transparent p-0 text-left font-[inherit] text-sm text-muted hover:text-ink' />
        </li>
      ) : null,
    },
  ]

  return (
    <footer className='border-t border-line bg-surface'>
      <div className='mx-auto grid max-w-page gap-10 px-4 py-12 md:grid-cols-[2fr_1.2fr_1fr] lg:grid-cols-[2fr_1fr_1.4fr_1fr] md:px-6'>
        <div className='max-w-sm'>
          <BrandLogo />
          <p className='mt-4 text-sm leading-relaxed text-muted'>{t('tagline')}</p>
          <p className='mt-3 text-xs text-muted'>
            {t.rich('fonts', {
              link: (chunks) => (
                <a href={FONTS_SOURCE_URL} target='_blank' rel='noopener noreferrer' className='text-muted underline hover:text-ink'>
                  {chunks}
                </a>
              ),
            })}
          </p>
          <div className='mt-5'>
            <PreferredSourceBadge />
          </div>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className='mb-3 text-sm font-semibold text-ink'>{column.title}</h2>
            <ul className='m-0 flex list-none flex-col p-0'>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className='text-sm text-muted no-underline hover:text-ink'>
                    {link.label}
                  </Link>
                </li>
              ))}
              {column.extra}
            </ul>
          </nav>
        ))}
      </div>
      <div className='border-t border-line py-5 text-center text-xs text-muted'>
        {t('rights', { year: new Date().getFullYear(), name: APP_NAME })}
      </div>
    </footer>
  )
}
