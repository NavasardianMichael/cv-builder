'use client'

import { type FC, useEffect, useState } from 'react'
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  DownloadOutlined,
  InfoCircleFilled,
  LockOutlined,
} from '@ant-design/icons'
import { Alert, Button, Spin } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getCvAPI } from '@api/cvs/main'
import { useAuthStore } from '@store/auth/store'
import type { Cv } from '@store/cvs/single/types'
import { useCheckout } from '@hooks/useCheckout'
import { usePdfDownload } from '@hooks/usePdfDownload'
import { ERROR_CODES } from '@constants/errors'
import { CURRENCY, CV_PRICE_AMD } from '@constants/pricing'
import { editorPath, type PaymentResultStatus, RETURN_TO_QUERY, ROUTES } from '@constants/routes'
import { trackEvent } from '@helpers/analytics'
import { classifyError } from '@helpers/error'
import { reportError } from '@helpers/reportError'
import { ErrorAlert } from '@components/ui/ErrorAlert'

type Props = { cvId?: string; status: PaymentResultStatus }

const PENDING_POLL_MS = 4000
const PENDING_MAX_POLLS = 8

/**
 * Where the gateway's return trip lands (via the API, which has already asked the bank).
 * The CV is re-read rather than trusting `status`: reading it reconciles a pending payment,
 * so "pending" polls a few times until the bank has answered — and says so once it stops,
 * rather than promising a refresh that will not come. A guest reads it through the guest
 * cookie, and is reminded that what they bought lives only in this browser.
 *
 * "Try again" on a failure starts a new payment from here, straight to the bank's page: the
 * buyer saw the price, terms and guest warning moments ago. Never offered while pending — the
 * first payment may yet be charged, and a second one would charge twice.
 *
 * `duplicate`: the CV was paid by an earlier attempt. The CV is theirs: download. Nothing is
 * promised about the second payment's money — whether the API returned it depends on the
 * bank's permission — so a buyer charged twice is asked to contact us, and is refunded.
 */
export const PaymentResultClient: FC<Props> = ({ cvId, status }) => {
  const t = useTranslations('Payment')
  const tCommon = useTranslations('Common')
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const [cv, setCv] = useState<Cv | null>(null)
  /** The CV could not be read (another browser, a cleared cookie): show the bank's verdict as is. */
  const [unreadable, setUnreadable] = useState(false)
  const [polls, setPolls] = useState(0)
  const checkout = useCheckout()
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<unknown>(null)
  const { download, isDownloading } = usePdfDownload()

  const retry = async () => {
    if (!cvId) return
    setRetryError(null)
    setRetrying(true)
    try {
      // False: an earlier payment may still be open, and the buyer chose not to start another.
      if (!(await checkout(cvId))) setRetrying(false)
    } catch (failure) {
      setRetrying(false)
      // Paid after all (a late payment, another tab): re-read the CV, which shows "succeeded".
      if (classifyError(failure).code === ERROR_CODES.cvAlreadyPaid) return setPolls((count) => count + 1)
      setRetryError(failure)
    }
  }

  useEffect(() => {
    if (!cvId || !isResolved) return
    let active = true
    getCvAPI({ id: cvId })
      .then((value) => active && setCv(value))
      .catch((error: unknown) => {
        reportError(error, 'payment:result')
        if (active) setUnreadable(true)
      })
    return () => {
      active = false
    }
  }, [cvId, isResolved, polls])

  const paid = Boolean(cv?.paidAt)
  const effective: PaymentResultStatus =
    status === 'duplicate' ? 'duplicate' : paid ? 'succeeded' : status === 'succeeded' && cv ? 'pending' : status
  /** The CV is theirs: by this payment, or — a duplicate — by the earlier one. */
  const owned = paid && (effective === 'succeeded' || effective === 'duplicate')

  // Revisiting this page repeats the event; GA counts one purchase per transaction_id.
  useEffect(() => {
    if (paid && cvId) trackEvent('purchase', { currency: CURRENCY, value: CV_PRICE_AMD, transaction_id: cvId })
  }, [paid, cvId])

  useEffect(() => {
    if (effective !== 'pending' || polls >= PENDING_MAX_POLLS) return
    const timer = setTimeout(() => setPolls((count) => count + 1), PENDING_POLL_MS)
    return () => clearTimeout(timer)
  }, [effective, polls])

  if (cvId && !cv && !unreadable && status !== 'failed') {
    return (
      <div className='grid flex-1 place-items-center'>
        <Spin size='large' />
      </div>
    )
  }

  const view = {
    succeeded: { icon: <CheckCircleFilled className='text-success' />, title: t('succeeded'), text: t('succeededText') },
    failed: { icon: <CloseCircleFilled className='text-danger' />, title: t('failed'), text: t('failedText') },
    pending:
      polls < PENDING_MAX_POLLS
        ? { icon: <ClockCircleFilled className='text-accent' />, title: t('pending'), text: t('pendingText') }
        : { icon: <ClockCircleFilled className='text-accent' />, title: t('unconfirmed'), text: t('unconfirmedText') },
    duplicate: { icon: <InfoCircleFilled className='text-accent' />, title: t('duplicate'), text: t('duplicateText') },
  }[effective]

  return (
    <div className='mx-auto my-auto w-full max-w-lg text-center'>
      <div className='text-6xl' aria-hidden='true'>
        {view.icon}
      </div>
      <h1 className='mt-6 font-display text-title font-extrabold text-ink sm:text-3xl'>{view.title}</h1>
      <p className='mt-3 text-lg text-muted'>{view.text}</p>
      {/* Margin on a wrapper: antd's Alert styles are unlayered and reset `margin`. */}
      {isResolved && !user && cv && owned && (
        <div className='mt-6 text-left'>
          <Alert
            type='warning'
            showIcon
            title={t('guestTitle')}
            description={t('guestText')}
            action={
              <Link href={`${ROUTES.signIn}?${RETURN_TO_QUERY}=${encodeURIComponent(editorPath(cv.id))}`}>
                <Button size='small'>{t('guestSignIn')}</Button>
              </Link>
            }
          />
        </div>
      )}
      {Boolean(retryError) && (
        <div className='mt-6 text-left'>
          <ErrorAlert error={retryError} />
        </div>
      )}
      <div className='mt-8 flex flex-wrap justify-center gap-3'>
        {owned && cv && (
          <Button type='primary' size='large' icon={<DownloadOutlined />} loading={isDownloading} onClick={() => void download(cv.id, cv.title)}>
            {tCommon('download')}
          </Button>
        )}
        {effective === 'failed' && cvId && (
          <Button type='primary' size='large' icon={<LockOutlined />} loading={retrying} onClick={() => void retry()}>
            {retrying ? t('redirecting') : t('tryAgain')}
          </Button>
        )}
        {cvId && (
          <Link href={editorPath(cvId)}>
            <Button size='large'>{t('toEditor')}</Button>
          </Link>
        )}
        {effective === 'duplicate' && (
          <Link href={ROUTES.contact}>
            <Button size='large'>{t('contactUs')}</Button>
          </Link>
        )}
        <Link href={ROUTES.dashboard}>
          <Button size='large' type='text' icon={<ArrowLeftOutlined />}>
            {t('toDashboard')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
