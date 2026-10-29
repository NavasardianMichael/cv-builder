import type { FC } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { newCvPath } from '@constants/routes'
import { DEFAULT_TEMPLATE_ID } from '@constants/templates'
import { ArrowRightOutlined } from '@components/ui/icons'

export const FinalCta: FC = async () => {
  const t = await getTranslations('Home')
  return (
    <section className='mx-auto max-w-7xl px-4 md:px-6'>
      <div className='relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center sm:px-12'>
        <div
          className='pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent opacity-30 blur-3xl'
          aria-hidden='true'
        />
        <h2 className='text-balance relative mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl'>
          {t('finalTitle')}
        </h2>
        <Link
          href={newCvPath(DEFAULT_TEMPLATE_ID)}
          className='relative mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-accent-strong'
        >
          {t('finalCta')} <ArrowRightOutlined />
        </Link>
      </div>
    </section>
  )
}
