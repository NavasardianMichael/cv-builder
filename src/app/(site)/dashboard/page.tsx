import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { privateMetadata } from '@helpers/metadata'
import { CvFontsLink } from '@components/cv/CvFontsLink'
import { DashboardClient } from '@components/dashboard/DashboardClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard')
  return privateMetadata(t('metaTitle'))
}

export default function DashboardPage() {
  return (
    <>
      <CvFontsLink />
      <DashboardClient />
    </>
  )
}
