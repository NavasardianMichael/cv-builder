'use client'

import type { FC } from 'react'
import { CopyOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'
import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import type { PdfVariant } from '@api/cvs/types'
import type { Cv } from '@store/cvs/single/types'
import { editorPath } from '@constants/routes'
import { CvPreview } from '@components/cv/CvPreview'
import { PaidBadge } from '@components/ui/PaidBadge'

type Props = {
  cv: Cv
  onDuplicate: (cv: Cv) => void
  onDelete: (cv: Cv) => void
  onDownload: (cv: Cv, variant: PdfVariant) => void
}

export const CvCard: FC<Props> = ({ cv, onDuplicate, onDelete, onDownload }) => {
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')
  const format = useFormatter()

  return (
    <article className='group'>
      <Link
        href={editorPath(cv.id)}
        className='block'
        aria-label={`${tCommon('edit')}: ${cv.title}${cv.paidAt ? ` (${tCommon('paid')})` : ''}`}
      >
        <div className='relative overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_-12px_rgba(20,24,45,0.25)] ring-1 ring-black/5 transition group-hover:-translate-y-1 group-hover:shadow-xl'>
          <CvPreview content={cv.content} design={cv.design} />
          {cv.paidAt && <PaidBadge className='absolute top-3 right-3 shadow-md ring-2 ring-white' />}
        </div>
      </Link>
      <div className='mt-3 flex items-start gap-2 px-1'>
        <div className='min-w-0 flex-1'>
          <h2 className='m-0 truncate text-base font-semibold text-ink'>{cv.title}</h2>
          <p className='m-0 mt-0.5 text-xs text-muted'>
            {t('updated', { date: format.dateTime(new Date(cv.updatedAt), { dateStyle: 'medium', timeStyle: 'short' }) })}
          </p>
        </div>
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: <Link href={editorPath(cv.id)}>{tCommon('edit')}</Link> },
              cv.paidAt
                ? { key: 'download', icon: <DownloadOutlined />, label: tCommon('download'), onClick: () => onDownload(cv, 'designed') }
                : { key: 'download', icon: <DownloadOutlined />, label: tCommon('downloadBasic'), onClick: () => onDownload(cv, 'basic') },
              { key: 'duplicate', icon: <CopyOutlined />, label: tCommon('duplicate'), onClick: () => onDuplicate(cv) },
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
