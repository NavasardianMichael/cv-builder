import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CHECKOUT_QUERY } from '@constants/routes'
import { CvFontsLink } from '@components/cv/CvFontsLink'
import { EditorShell } from '@components/editor/EditorShell'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Editor')
  return { title: t('metaTitle'), robots: { index: false, follow: false } }
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditorPage({ params, searchParams }: Props) {
  const { id } = await params
  const query = await searchParams
  return (
    <>
      <CvFontsLink />
      <EditorShell cvId={id} autoCheckout={query[CHECKOUT_QUERY] === '1'} />
    </>
  )
}
