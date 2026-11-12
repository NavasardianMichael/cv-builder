'use client'

import type { FC } from 'react'
import { Alert } from 'antd'
import { useTranslations } from 'next-intl'
import { useAccessUntil, useNow } from '@hooks/useAccess'
import { accessDaysLeft, isAccessActive, PASS_DAYS } from '@constants/pricing'
import { formatDateTime } from '@helpers/date'

/**
 * Full access on the dashboard (docs/PAYMENTS.md): while it runs, until when and how many days
 * are left; once it has run out, that every CV is still here and what works without it.
 * Nothing for someone who never bought it, or while it is unknown.
 */
export const AccessBanner: FC<{ className?: string }> = ({ className }) => {
  const t = useTranslations('Dashboard')
  const until = useAccessUntil()
  const now = useNow()
  if (until === undefined || until === null || now === 0) return null

  const date = formatDateTime(until)
  const active = isAccessActive(until, now)

  return (
    // Margin on a wrapper: antd's Alert styles are unlayered and reset `margin`.
    <div className={className}>
      {active ? (
        <Alert
          type='success'
          showIcon
          title={t('accessActiveTitle', { date })}
          description={t('accessActiveText', { left: accessDaysLeft(until, now), days: PASS_DAYS })}
        />
      ) : (
        <Alert type='info' showIcon title={t('accessEndedTitle', { date })} description={t('accessEndedText', { days: PASS_DAYS })} />
      )}
    </div>
  )
}
