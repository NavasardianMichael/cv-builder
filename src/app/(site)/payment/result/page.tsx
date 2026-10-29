import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { privateMetadata } from '@helpers/metadata'
import { PaymentResultClient } from '@components/payment/PaymentResultClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Payment')
  return privateMetadata(t('metaTitle'))
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const STATUSES = ['succeeded', 'failed', 'pending'] as const

export default async function PaymentResultPage({ searchParams }: Props) {
  const query = await searchParams
  const status = STATUSES.find((value) => value === query.status) ?? 'failed'
  const cvId = typeof query.cv === 'string' ? query.cv : undefined
  return (
    <div className='mesh-bg px-4 py-20'>
      <PaymentResultClient cvId={cvId} status={status} />
    </div>
  )
}
