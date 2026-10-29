import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ROUTES } from '@constants/routes'
import { TEMPLATE_LIST } from '@constants/templates'
import { pageMetadata } from '@helpers/metadata'
import { breadcrumbSchema, templatesListSchema } from '@linkedDataSchema/site'
import { CvFontsLink } from '@components/cv/CvFontsLink'
import { JsonLd } from '@components/seo/JsonLd'
import { TemplateCard } from '@components/templates/TemplateCard'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Templates')
  return pageMetadata({ title: t('metaTitle'), description: t('metaDescription'), path: ROUTES.templates })
}

export default async function TemplatesPage() {
  const t = await getTranslations('Templates')
  const tNav = await getTranslations('Nav')
  return (
    <div className='mesh-bg'>
      <CvFontsLink />
      <JsonLd
        data={[
          templatesListSchema(),
          breadcrumbSchema([
            { name: tNav('home'), path: ROUTES.home },
            { name: tNav('templates'), path: ROUTES.templates },
          ]),
        ]}
      />
      <div className='mx-auto max-w-7xl px-4 pt-14 pb-10 md:px-6'>
        <h1 className='text-balance max-w-3xl font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl'>{t('title')}</h1>
        <p className='mt-5 max-w-2xl text-lg leading-relaxed text-muted'>{t('subtitle')}</p>
        <div className='mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 xl:grid-cols-4'>
          {TEMPLATE_LIST.map((template) => (
            <TemplateCard key={template.id} template={template} headingLevel='h2' />
          ))}
        </div>
      </div>
    </div>
  )
}
