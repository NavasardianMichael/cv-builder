import type { CSSProperties, FC } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { newCvPath, ROUTES } from '@constants/routes'
import { DEFAULT_TEMPLATE_ID, templateDesign,type TemplateId } from '@constants/templates'
import { sampleContent } from '@helpers/cvFactory'
import { CvPreview } from '@components/cv/CvPreview'
import { ArrowRightOutlined } from '@components/ui/icons'

/** Three real templates, rendered live from the sample CV, fanned out like papers on a desk. */
const STACK: { id: TemplateId; className: string; tilt: string; delay: string }[] = [
  { id: 'elegant', className: 'left-0 top-10 w-[46%] z-10', tilt: '-7deg', delay: '0s' },
  { id: 'creative', className: 'right-0 top-6 w-[46%] z-10', tilt: '6deg', delay: '1.2s' },
  { id: 'modern', className: 'left-1/2 top-0 w-[54%] -translate-x-1/2 z-20', tilt: '0deg', delay: '0.6s' },
]

export const Hero: FC = async () => {
  const t = await getTranslations('Home')
  const price = formatAmd(CV_PRICE_AMD)
  const content = sampleContent()

  return (
    <section className='mesh-bg overflow-hidden'>
      <div className='mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-20 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-28'>
        <div>
          <span className='inline-flex items-center gap-2 rounded-full bg-surface/80 px-3.5 py-1.5 text-sm font-medium text-ink shadow-sm ring-1 ring-line'>
            <span className='size-2 rounded-full bg-accent' aria-hidden='true' />
            {t('eyebrow')}
          </span>
          <h1 className='text-balance mt-6 font-display text-4xl leading-[1.08] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl'>
            {t('heroTitle')} <span className='text-accent'>{t('heroTitleAccent')}</span>
          </h1>
          <p className='mt-6 max-w-xl text-lg leading-relaxed text-muted'>{t('heroSubtitle', { price })}</p>
          <div className='mt-8 flex flex-wrap items-center gap-3'>
            <Link
              href={newCvPath(DEFAULT_TEMPLATE_ID)}
              className='inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-base font-semibold text-white no-underline shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-ink-deep'
            >
              {t('heroCta')} <ArrowRightOutlined />
            </Link>
            <Link
              href={ROUTES.templates}
              className='inline-flex items-center rounded-full bg-surface px-6 py-3.5 text-base font-semibold text-ink no-underline ring-1 ring-line transition hover:ring-ink/30'
            >
              {t('heroSecondary')}
            </Link>
          </div>
          <p className='mt-4 text-sm text-muted'>{t('heroNote')}</p>
          <dl className='mt-10 grid max-w-lg grid-cols-3 gap-4'>
            {[
              { value: '12', label: t('stats.templates') },
              { value: '20', label: t('stats.fonts') },
              { value: price, label: t('stats.price') },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className='sr-only'>{stat.label}</dt>
                <dd className='m-0 font-display text-2xl font-extrabold text-ink sm:text-3xl'>{stat.value}</dd>
                <dd className='m-0 mt-1 text-xs leading-snug text-muted sm:text-sm'>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className='relative mx-auto aspect-[1.15] w-full max-w-xl' aria-hidden='true'>
          {STACK.map((item) => (
            <div
              key={item.id}
              className={`animate-float absolute ${item.className}`}
              style={{ '--tilt': item.tilt, animationDelay: item.delay } as CSSProperties}
            >
              <div className='overflow-hidden rounded-xl shadow-[0_30px_60px_-20px_rgba(20,24,45,0.45)] ring-1 ring-black/5'>
                <CvPreview content={content} design={templateDesign(item.id)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
