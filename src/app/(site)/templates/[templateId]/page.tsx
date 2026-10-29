import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { CreativeWork, WithContext } from 'schema-dts'
import { APP_NAME, LOCALE } from '@constants/app'
import { FONTS } from '@constants/fonts'
import { newCvPath, ROUTES, SAMPLE_QUERY, templatePath } from '@constants/routes'
import { isTemplateId, TEMPLATE_IDS, TEMPLATE_LIST, templateDesign,TEMPLATES } from '@constants/templates'
import { sampleContent } from '@helpers/cvFactory'
import { pageMetadata } from '@helpers/metadata'
import { absoluteUrl } from '@helpers/url'
import { breadcrumbSchema, ORGANIZATION_ID } from '@linkedDataSchema/site'
import { CvFontsLink } from '@components/cv/CvFontsLink'
import { CvPreview } from '@components/cv/CvPreview'
import { JsonLd } from '@components/seo/JsonLd'
import { TemplateCard } from '@components/templates/TemplateCard'

type Props = { params: Promise<{ templateId: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return TEMPLATE_IDS.map((templateId) => ({ templateId }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { templateId } = await params
  if (!isTemplateId(templateId)) return {}
  const t = await getTranslations('Templates')
  const template = TEMPLATES[templateId]
  return pageMetadata({
    title: t('detailTitle', { name: template.name }),
    description: t('detailDescription', { name: template.name, tagline: template.tagline }),
    path: templatePath(templateId),
  })
}

export default async function TemplatePage({ params }: Props) {
  const { templateId } = await params
  if (!isTemplateId(templateId)) notFound()

  const t = await getTranslations('Templates')
  const tNav = await getTranslations('Nav')
  const template = TEMPLATES[templateId]
  const design = templateDesign(templateId)
  const others = TEMPLATE_LIST.filter((other) => other.id !== templateId).slice(0, 4)
  const title = t('detailTitle', { name: template.name })

  const creativeWork: WithContext<CreativeWork> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description: template.description,
    url: absoluteUrl(templatePath(templateId)),
    inLanguage: LOCALE,
    keywords: ['ռեզյումե', 'CV', ...template.bestFor].join(', '),
    isAccessibleForFree: true,
    creator: { '@id': ORGANIZATION_ID },
    isPartOf: { '@type': 'WebSite', name: APP_NAME, url: absoluteUrl('/') },
  }

  return (
    <div className='mesh-bg'>
      <CvFontsLink />
      <JsonLd
        data={[
          creativeWork,
          breadcrumbSchema([
            { name: tNav('home'), path: ROUTES.home },
            { name: tNav('templates'), path: ROUTES.templates },
            { name: template.name, path: templatePath(templateId) },
          ]),
        ]}
      />
      <div className='mx-auto grid max-w-7xl gap-12 px-4 pt-10 pb-16 md:px-6 lg:grid-cols-[1fr_1.1fr]'>
        <div className='lg:sticky lg:top-24 lg:self-start'>
          <nav aria-label='breadcrumb' className='text-sm text-muted'>
            <Link href={ROUTES.templates} className='no-underline hover:text-ink'>
              {tNav('templates')}
            </Link>{' '}
            / <span className='text-ink'>{template.name}</span>
          </nav>
          <h1 className='text-balance mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl'>{title}</h1>
          <p className='mt-3 text-lg font-medium text-accent-strong'>{template.tagline}</p>
          <p className='mt-5 text-lg leading-relaxed text-muted'>{template.description}</p>

          <dl className='mt-8 grid gap-5 sm:grid-cols-2'>
            <div>
              <dt className='text-xs font-semibold tracking-wider text-muted uppercase'>{t('bestFor')}</dt>
              <dd className='m-0 mt-2 flex flex-wrap gap-2'>
                {template.bestFor.map((role) => (
                  <span key={role} className='rounded-full bg-surface px-3 py-1 text-sm ring-1 ring-line'>
                    {role}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className='text-xs font-semibold tracking-wider text-muted uppercase'>{t('layout')}</dt>
              <dd className='m-0 mt-2 text-sm'>{t(`layouts.${template.layout}`)}</dd>
              <dt className='mt-4 text-xs font-semibold tracking-wider text-muted uppercase'>{t('fonts')}</dt>
              <dd className='m-0 mt-2 text-sm'>
                {FONTS[design.headingFont].name} · {FONTS[design.bodyFont].name}
              </dd>
            </div>
          </dl>

          <div className='mt-9 flex flex-wrap gap-3'>
            <Link
              href={newCvPath(templateId)}
              className='inline-flex items-center rounded-full bg-ink px-6 py-3.5 font-semibold text-white no-underline shadow-lg shadow-ink/20 transition hover:-translate-y-0.5'
            >
              {t('useThis')}
            </Link>
            <Link
              href={`${newCvPath(templateId)}&${SAMPLE_QUERY}=1`}
              className='inline-flex items-center rounded-full bg-surface px-6 py-3.5 font-semibold text-ink no-underline ring-1 ring-line'
            >
              {t('startSample')}
            </Link>
          </div>
        </div>

        <div className='overflow-hidden rounded-2xl shadow-[0_30px_70px_-25px_rgba(20,24,45,0.45)] ring-1 ring-black/5'>
          <CvPreview content={sampleContent()} design={design} firstPageOnly={false} />
        </div>
      </div>

      <section className='mx-auto max-w-7xl px-4 pb-10 md:px-6' aria-labelledby='other-templates'>
        <h2 id='other-templates' className='font-display text-2xl font-extrabold text-ink'>
          {t('otherTemplates')}
        </h2>
        <div className='mt-8 grid grid-cols-2 gap-6 md:grid-cols-4'>
          {others.map((other) => (
            <TemplateCard key={other.id} template={other} />
          ))}
        </div>
      </section>
    </div>
  )
}
