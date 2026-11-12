'use client'

import type { FC } from 'react'
import { CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { PdfVariant } from '@api/cvs/types'
import type { Cv } from '@store/cvs/single/types'
import { CHECKOUT_QUERY, editorPath } from '@constants/routes'
import { formatDateTime } from '@helpers/date'
import { CvPreview } from '@components/cv/CvPreview'

type Props = {
  cv: Cv
  /** Left out for a guest's draft: a browser holds one, so it cannot be copied. */
  onDuplicate?: (cv: Cv) => void
  onDelete: (cv: Cv) => void
  onDownload: (cv: Cv, variant: PdfVariant) => void
  /**
   * The designed PDF: downloads while full access runs, else opens the CV with the checkout
   * (`?checkout=1`). Left out for a guest's draft, which only the free PDF can print.
   */
  designed?: 'download' | 'buy'
}

/** One CV on the dashboard. Whether its designed PDF downloads is the owner's access, not the CV's. */
export const CvCard: FC<Props> = ({ cv, onDuplicate, onDelete, onDownload, designed }) => {
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')

  return (
    <article className='group'>
      <Link
        href={editorPath(cv.id)}
        className='block'
        aria-label={`${tCommon('edit')}: ${cv.title}`}
      >
        <div className='relative overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_-12px_rgba(20,24,45,0.25)] ring-1 ring-black/5 transition group-hover:-translate-y-1 group-hover:shadow-xl'>
          <CvPreview content={cv.content} design={cv.design} />
        </div>
      </Link>
      <div className='mt-3 flex items-start gap-2 px-1'>
        <div className='min-w-0 flex-1'>
          <h2 className='m-0 truncate text-base font-semibold text-ink'>{cv.title}</h2>
          <p className='m-0 mt-0.5 text-xs text-muted'>
            {t('updated', { date: formatDateTime(cv.updatedAt) })}
          </p>
        </div>
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: <Link href={editorPath(cv.id)}>{tCommon('edit')}</Link> },
              ...(designed === 'download'
                ? [{ key: 'download', icon: <DownloadOutlined />, label: tCommon('download'), onClick: () => onDownload(cv, 'designed') }]
                : designed === 'buy'
                  ? [{ key: 'download', icon: <DownloadOutlined />, label: <Link href={`${editorPath(cv.id)}?${CHECKOUT_QUERY}=1`}>{tCommon('download')}</Link> }]
                  : []),
              { key: 'basic', icon: <DownloadOutlined />, label: tCommon('downloadBasic'), onClick: () => onDownload(cv, 'basic') },
              ...(onDuplicate ? [{ key: 'duplicate', icon: <CopyOutlined />, label: tCommon('duplicate'), onClick: () => onDuplicate(cv) }] : []),
              { type: 'divider' as const },
              { key: 'delete', icon: <DeleteOutlined />, label: tCommon('delete'), danger: true, onClick: () => onDelete(cv) },
            ],
          }}
        >
          <Button type='text' icon={<MoreOutlined />} aria-label={cv.title} />
        </Dropdown>
      </div>
    </article>
  )
}
