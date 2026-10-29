'use client'

import { type FC, useEffect, useState } from 'react'
import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled, DownloadOutlined } from '@ant-design/icons'
import { Button, Spin } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getCvAPI } from '@api/cvs/main'
import { useAuthStore } from '@store/auth/store'
import type { Cv } from '@store/cvs/single/types'
import { usePdfDownload } from '@hooks/usePdfDownload'
import { CHECKOUT_QUERY, editorPath, ROUTES } from '@constants/routes'
import { reportError } from '@helpers/reportError'

type Props = { cvId?: string; status: 'succeeded' | 'failed' | 'pending' }

const PENDING_POLL_MS = 4000
const PENDING_MAX_POLLS = 8

/**
 * Where the gateway's return trip lands (via the API, which has already asked the bank).
 * The CV is re-read rather than trusting `status`: reading it reconciles a pending payment,
 * so "pending" polls a few times until the bank has answered.
 */
export const PaymentResultClient: FC<Props> = ({ cvId, status }) => {
  const t = useTranslations('Payment')
  const tCommon = useTranslations('Common')
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const [cv, setCv] = useState<Cv | null>(null)
  const [polls, setPolls] = useState(0)
  const { download, isDownloading } = usePdfDownload()

  useEffect(() => {
    if (!cvId || !isResolved || !user) return
    let active = true
    getCvAPI({ id: cvId })
      .then((value) => active && setCv(value))
      .catch((error: unknown) => reportError(error, 'payment:result'))
    return () => {
      active = false
    }
  }, [cvId, isResolved, user, polls])

  const paid = Boolean(cv?.paidAt)
  const effective = paid ? 'succeeded' : status === 'succeeded' && cv ? 'pending' : status

  useEffect(() => {
    if (effective !== 'pending' || polls >= PENDING_MAX_POLLS) return
    const timer = setTimeout(() => setPolls((count) => count + 1), PENDING_POLL_MS)
    return () => clearTimeout(timer)
  }, [effective, polls])

  if (cvId && user && !cv && status !== 'failed') {
    return <Spin size='large' className='my-20' />
  }

  const view = {
    succeeded: { icon: <CheckCircleFilled className='text-success' />, title: t('succeeded'), text: t('succeededText') },
    failed: { icon: <CloseCircleFilled className='text-danger' />, title: t('failed'), text: t('failedText') },
    pending: { icon: <ClockCircleFilled className='text-accent' />, title: t('pending'), text: t('pendingText') },
  }[effective]

  return (
    <div className='mx-auto max-w-lg text-center'>
      <div className='text-6xl' aria-hidden='true'>
        {view.icon}
      </div>
      <h1 className='mt-6 font-display text-3xl font-extrabold text-ink'>{view.title}</h1>
      <p className='mt-3 text-lg text-muted'>{view.text}</p>
      <div className='mt-8 flex flex-wrap justify-center gap-3'>
        {effective === 'succeeded' && cv && (
          <Button type='primary' size='large' icon={<DownloadOutlined />} loading={isDownloading} onClick={() => void download(cv.id, cv.title)}>
            {tCommon('download')}
          </Button>
        )}
        {effective === 'failed' && cvId && (
          <Link href={`${editorPath(cvId)}?${CHECKOUT_QUERY}=1`}>
            <Button type='primary' size='large'>
              {t('tryAgain')}
            </Button>
          </Link>
        )}
        {cvId && (
          <Link href={editorPath(cvId)}>
            <Button size='large'>{t('toEditor')}</Button>
          </Link>
        )}
        <Link href={ROUTES.dashboard}>
          <Button size='large' type='text'>
            {t('toDashboard')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
