import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PAYMENT_RESULT_STATUSES } from '@constants/routes'
import { privateMetadata } from '@helpers/metadata'
import { PaymentResultClient } from '@components/payment/PaymentResultClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Payment')
  return privateMetadata(t('metaTitle'))
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function PaymentResultPage({ searchParams }: Props) {
  const query = await searchParams
  const status = PAYMENT_RESULT_STATUSES.find((value) => value === query.status) ?? 'failed'
  const cvId = typeof query.cv === 'string' ? query.cv : undefined
  const paymentId = typeof query.payment === 'string' ? query.payment : undefined
  return (
    // The screen below the header (h-16), so the spinner and the result sit in its middle.
    <div className='mesh-bg flex min-h-[calc(100dvh-4rem)] flex-col px-4 py-14 sm:py-20'>
      <PaymentResultClient cvId={cvId} paymentId={paymentId} status={status} />
    </div>
  )
}
