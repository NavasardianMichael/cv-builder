import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { ROUTES } from '@constants/routes'
import { pageMetadata } from '@helpers/metadata'
import { breadcrumbSchema, webApplicationSchema } from '@linkedDataSchema/site'
import { Faq } from '@components/landing/Faq'
import { JsonLd } from '@components/seo/JsonLd'
import { CheckOutlined, LockOutlined } from '@components/ui/icons'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pricing')
  return pageMetadata({ title: t('metaTitle'), description: t('metaDescription', { price: formatAmd(CV_PRICE_AMD) }), path: ROUTES.pricing })
}

export default async function PricingPage() {
  const t = await getTranslations('Pricing')
  const tNav = await getTranslations('Nav')
  const freeItems = t.raw('freeItems') as string[]
  const paidItems = t.raw('paidItems') as string[]

  return (
    <div className='mesh-bg'>
      <JsonLd
        data={[
          webApplicationSchema(),
          breadcrumbSchema([
            { name: tNav('home'), path: ROUTES.home },
            { name: tNav('pricing'), path: ROUTES.pricing },
          ]),
        ]}
      />
      <div className='mx-auto max-w-5xl px-4 pt-14 md:px-6'>
        <div className='text-center'>
          <h1 className='font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl'>{t('title')}</h1>
          <p className='mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted'>{t('subtitle')}</p>
        </div>

        <div className='mt-14 grid gap-6 md:grid-cols-2'>
          <div className='rounded-3xl bg-surface p-8 ring-1 ring-line'>
            <h2 className='m-0 text-lg font-bold text-muted'>{t('free')}</h2>
            <p className='mt-3 mb-6 font-display text-5xl font-extrabold text-ink'>{t('freePrice')}</p>
            <ul className='m-0 flex list-none flex-col gap-3 p-0'>
              {freeItems.map((item) => (
                <li key={item} className='flex gap-3'>
                  <CheckOutlined className='mt-1 text-success' /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className='relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-2xl shadow-ink/30'>
            <div className='pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-accent opacity-30 blur-3xl' aria-hidden='true' />
            <h2 className='relative m-0 text-lg font-bold text-white/70'>{t('paid')}</h2>
            <p className='relative mt-3 mb-1 font-display text-5xl font-extrabold text-white'>{formatAmd(CV_PRICE_AMD)}</p>
            <p className='relative mt-0 mb-6 text-white/60'>{t('perCv')}</p>
            <ul className='relative m-0 flex list-none flex-col gap-3 p-0'>
              {paidItems.map((item) => (
                <li key={item} className='flex gap-3'>
                  <CheckOutlined className='mt-1 text-accent' /> {item}
                </li>
              ))}
            </ul>
            <Link
              href={ROUTES.templates}
              className='relative mt-8 flex justify-center rounded-full bg-accent px-6 py-3.5 font-semibold text-white no-underline transition hover:bg-accent-strong'
            >
              {t('cta')}
            </Link>
            <p className='relative mt-4 mb-0 flex items-center justify-center gap-2 text-xs text-white/60'>
              <LockOutlined /> {t('secure')}
            </p>
          </div>
        </div>
      </div>
      <Faq />
    </div>
  )
}
