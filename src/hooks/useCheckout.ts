'use client'

import { useCallback } from 'react'
import { App } from 'antd'
import { useTranslations } from 'next-intl'
import { checkoutCvAPI } from '@api/cvs/main'
import { CURRENCY, CV_PRICE_AMD } from '@constants/pricing'
import { trackEvent } from '@helpers/analytics'
import { collectClientInfo } from '@helpers/clientInfo'

/**
 * Starts a payment for a saved CV and leaves for the bank's page. When an earlier attempt's
 * bank page may still be open in another tab (the API answers `open` instead of starting
 * one), the buyer is offered to continue that same payment: one order can be charged only
 * once, whichever tab it is paid in. The minutes come from the server's clock, never this
 * device's.
 *
 * Resolves true when the browser is on its way to the bank, false when the buyer chose to
 * stay. API failures — `cvAlreadyPaid` among them — are thrown to the caller, which knows
 * what to show.
 */
export const useCheckout = (): ((cvId: string) => Promise<boolean>) => {
  const t = useTranslations('Payment.openPayment')
  const { modal } = App.useApp()

  return useCallback(
    async (cvId: string) => {
      let result = await checkoutCvAPI({ id: cvId, client: collectClientInfo() })
      if (result.kind === 'open') {
        const resume = await modal.confirm({
          title: t('title'),
          content: t('text', { minutes: result.minutesAgo }),
          okText: t('continue'),
          cancelText: t('cancel'),
        })
        if (!resume) return false
        result = await checkoutCvAPI({ id: cvId, client: collectClientInfo(), resume: true })
        if (result.kind !== 'redirect') return false
      }
      trackEvent('begin_checkout', { currency: CURRENCY, value: CV_PRICE_AMD })
      window.location.assign(result.url)
      return true
    },
    [modal, t]
  )
}
