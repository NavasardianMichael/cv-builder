import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { EXAMPLE_QUERY, FREE_QUERY, SAMPLE_QUERY, TEMPLATE_QUERY } from '@constants/routes'
import { BASIC_DESIGN, DEFAULT_TEMPLATE_ID, isTemplateId } from '@constants/templates'
import { findExample } from '@content/index'
import { NewCvClient } from '@components/editor/NewCvClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Editor')
  return { title: t('metaTitle'), robots: { index: false, follow: false } }
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function NewCvPage({ searchParams }: Props) {
  const query = await searchParams
  const template = query[TEMPLATE_QUERY]
  const free = query[FREE_QUERY] === '1'
  // A CV example page's "use this example": its text, in the given template or its own.
  const example = findExample(query[EXAMPLE_QUERY])
  const fallback = example?.templateId ?? DEFAULT_TEMPLATE_ID
  return (
    <NewCvClient
      templateId={free ? BASIC_DESIGN.templateId : isTemplateId(template) ? template : fallback}
      sample={query[SAMPLE_QUERY] === '1'}
      free={free}
      example={example ? { slug: example.slug, cv: example.cv } : null}
    />
  )
}
