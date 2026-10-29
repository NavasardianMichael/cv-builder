import type { FC } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@constants/routes'
import { type TemplateId,TEMPLATES } from '@constants/templates'
import { TemplateCard } from '@components/templates/TemplateCard'
import { ArrowRightOutlined } from '@components/ui/icons'

/** A spread of tastes, not the first six in catalogue order. */
const FEATURED: TemplateId[] = ['modern', 'creative', 'elegant', 'tech', 'classic', 'bold']

export const TemplateShowcase: FC = async () => {
  const t = await getTranslations('Home')
  return (
    <section className='mx-auto max-w-7xl px-4 py-20 md:px-6' aria-labelledby='showcase-title'>
      <div className='flex flex-wrap items-end justify-between gap-6'>
        <div className='max-w-2xl'>
          <h2 id='showcase-title' className='text-balance font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl'>
            {t('templatesTitle')}
          </h2>
          <p className='mt-4 text-lg text-muted'>{t('templatesSubtitle')}</p>
        </div>
        <Link href={ROUTES.templates} className='inline-flex items-center gap-2 font-semibold text-ink no-underline hover:text-accent-strong'>
          {t('templatesAll')} <ArrowRightOutlined />
        </Link>
      </div>
      <div className='mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3'>
        {FEATURED.map((id) => (
          <TemplateCard key={id} template={TEMPLATES[id]} />
        ))}
      </div>
    </section>
  )
}
