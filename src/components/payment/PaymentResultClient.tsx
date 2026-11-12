'use client'

import { type FC, useEffect, useState } from 'react'
import { ArrowLeftOutlined, CheckCircleFilled, ClockCircleFilled, CloseCircleFilled, DownloadOutlined, LockOutlined } from '@ant-design/icons'
import { Alert, Button, Spin } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getCvAPI } from '@api/cvs/main'
import type { PaymentStatus } from '@api/purchases/types'
import { useAuthStore } from '@store/auth/store'
import type { Cv } from '@store/cvs/single/types'
import { usePurchasesStore } from '@store/purchases/store'
import { useAccessUntil } from '@hooks/useAccess'
import { useCheckout } from '@hooks/useCheckout'
import { usePdfDownload } from '@hooks/usePdfDownload'
import { ERROR_CODES } from '@constants/errors'
import { CURRENCY, PASS_DAYS, PASS_PRICE_AMD } from '@constants/pricing'
import { editorPath, type PaymentResultStatus, RETURN_TO_QUERY, ROUTES } from '@constants/routes'
import { trackEvent } from '@helpers/analytics'
import { formatDateTime } from '@helpers/date'
import { classifyError } from '@helpers/error'
import { reportError } from '@helpers/reportError'
import { ErrorAlert } from '@components/ui/ErrorAlert'

type Props = {
  status: PaymentResultStatus
  /** The Payment the bank returned for: its own status is re-read from the API. */
  paymentId?: string
  /** Where the buyer started, if from a saved CV: offered for download, and the way back. */
  cvId?: string
}

const PENDING_POLL_MS = 4000
const PENDING_MAX_POLLS = 8

/**
 * Where the gateway's return trip lands (via the API, which has already asked the bank). What
 * was bought is full access for `PASS_DAYS` days, so the page re-reads the buyer's access and
 * this payment's status (`GET /purchases?payment=`) rather than trusting `status`: reading
 * reconciles a pending payment, so "pending" polls a few times until the bank has answered —
 * and says so once it stops, rather than promising a refresh that will not come. Succeeded, it
 * says until when everything downloads and what stays after. A guest is reminded that the
 * access lives only in this browser.
 *
 * "Try again" on a failure starts a new payment from here, straight to the bank's page: the
 * buyer saw the price, terms and guest warning moments ago. Never offered while pending — the
 * first payment may yet be charged.
 */
export const PaymentResultClient: FC<Props> = ({ status, paymentId, cvId }) => {
  const t = useTranslations('Payment')
  const tCommon = useTranslations('Common')
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  // Loads the visitor's access for whoever is signed in; `refresh` below asks again.
  const until = useAccessUntil()
  const refreshAccess = usePurchasesStore.use.refresh()
  const [payment, setPayment] = useState<PaymentStatus | null | undefined>(undefined)
  const [polls, setPolls] = useState(0)
  const [cv, setCv] = useState<Cv | null>(null)
  const checkout = useCheckout()
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<unknown>(null)
  const { download, isDownloading } = usePdfDownload()

  // Once the visitor's access has loaded, and on every poll: `until` itself changes with each refresh.
  const accessLoaded = until !== undefined
  useEffect(() => {
    if (!accessLoaded) return
    let active = true
    void refreshAccess(paymentId).then((access) => active && setPayment(access.payment))
    return () => {
      active = false
    }
  }, [accessLoaded, paymentId, polls, refreshAccess])

  useEffect(() => {
    if (!cvId || !isResolved) return
    let active = true
    getCvAPI({ id: cvId })
      .then((value) => active && setCv(value))
      .catch((error: unknown) => reportError(error, 'payment:result'))
    return () => {
      active = false
    }
  }, [cvId, isResolved])

  /**
   * This payment as its record says. The redirect's `failed` stands even while the record is
   * still pending (back with nothing charged, routes/payments.ts). With no record readable here
   * (another browser, no payment id) the redirect's word is all there is.
   */
  const effective: PaymentResultStatus =
    payment === 'succeeded'
      ? 'succeeded'
      : payment === 'failed' || payment === 'refunded' || status === 'failed'
        ? 'failed'
        : payment === 'pending'
          ? 'pending'
          : status

  // Revisiting this page repeats the event; GA counts one purchase per transaction_id.
  useEffect(() => {
    if (effective === 'succeeded' && paymentId) trackEvent('purchase', { currency: CURRENCY, value: PASS_PRICE_AMD, transaction_id: paymentId })
  }, [effective, paymentId])

  useEffect(() => {
    if (effective !== 'pending' || polls >= PENDING_MAX_POLLS) return
    const timer = setTimeout(() => setPolls((count) => count + 1), PENDING_POLL_MS)
    return () => clearTimeout(timer)
  }, [effective, polls])

  const retry = async () => {
    setRetryError(null)
    setRetrying(true)
    try {
      // False: an earlier payment may still be open, and the buyer chose to stay.
      if (!(await checkout(cvId ?? null))) setRetrying(false)
    } catch (failure) {
      setRetrying(false)
      // A payment whose redirect was lost went through after all: read again, which shows it.
      if (classifyError(failure).code === ERROR_CODES.earlierPaymentSucceeded) return setPolls((count) => count + 1)
      setRetryError(failure)
    }
  }

  if (payment === undefined && status !== 'failed') {
    return (
      <div className='grid flex-1 place-items-center'>
        <Spin size='large' />
      </div>
    )
  }

  const date = until ? formatDateTime(until) : ''
  const view = {
    succeeded: { icon: <CheckCircleFilled className='text-success' />, title: t('succeeded'), text: t('succeededText', { date, days: PASS_DAYS }) },
    failed: { icon: <CloseCircleFilled className='text-danger' />, title: t('failed'), text: t('failedText') },
    pending:
      polls < PENDING_MAX_POLLS
        ? { icon: <ClockCircleFilled className='text-accent' />, title: t('pending'), text: t('pendingText') }
        : { icon: <ClockCircleFilled className='text-accent' />, title: t('unconfirmed'), text: t('unconfirmedText') },
  }[effective]

  return (
    <div className='mx-auto my-auto w-full max-w-lg text-center'>
      <div className='text-6xl' aria-hidden='true'>
        {view.icon}
      </div>
      <h1 className='mt-6 font-display text-title font-extrabold text-ink sm:text-3xl'>{view.title}</h1>
      <p className='mt-3 text-lg text-muted'>{view.text}</p>
      {effective === 'succeeded' && <p className='mt-3 text-sm text-muted'>{t('afterText', { days: PASS_DAYS })}</p>}
      {/* Margin on a wrapper: antd's Alert styles are unlayered and reset `margin`. */}
      {isResolved && !user && effective === 'succeeded' && (
        <div className='mt-6 text-left'>
          <Alert
            type='warning'
            showIcon
            title={t('guestTitle')}
            description={t('guestText')}
            action={
              <Link href={`${ROUTES.signIn}?${RETURN_TO_QUERY}=${encodeURIComponent(cvId ? editorPath(cvId) : ROUTES.dashboard)}`}>
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
        {effective === 'succeeded' && cv && (
          <Button type='primary' size='large' icon={<DownloadOutlined />} loading={isDownloading} onClick={() => void download(cv.id, cv.title)}>
            {tCommon('download')}
          </Button>
        )}
        {effective === 'failed' && (
          <Button type='primary' size='large' icon={<LockOutlined />} loading={retrying} onClick={() => void retry()}>
            {retrying ? t('redirecting') : t('tryAgain')}
          </Button>
        )}
        {cvId ? (
          <Link href={editorPath(cvId)}>
            <Button size='large'>{t('toEditor')}</Button>
          </Link>
        ) : (
          <Link href={ROUTES.templates}>
            <Button size='large'>{t('toTemplates')}</Button>
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
