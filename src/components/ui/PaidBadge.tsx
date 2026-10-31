'use client'

import type { FC } from 'react'
import { CheckCircleFilled } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'

/**
 * Marks a CV that is already bought. An ink pill, not the success green: white text on that
 * green is under 4.5:1, and ink reads on every template's thumbnail, light or dark.
 */
export const PaidBadge: FC<{ className?: string }> = ({ className }) => {
  const tCommon = useTranslations('Common')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap text-white',
        className
      )}
    >
      <CheckCircleFilled className='text-success' aria-hidden='true' />
      {tCommon('paid')}
    </span>
  )
}
