'use client'

import type { FC } from 'react'
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloudSyncOutlined,
  ExclamationCircleFilled,
  LaptopOutlined,
  RedoOutlined,
  SettingOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Input, Tag, Tooltip } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { useCvEditorStore } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { ROUTES } from '@constants/routes'
import { BrandMark } from '@components/layout/BrandLogo'
import { DownloadButton } from './download/DownloadButton'

type Props = {
  zoom: number | null
  fitZoom: number
  pages: number
  onZoomChange: (zoom: number | null) => void
  onOpenPanel: () => void
  autoCheckout: boolean
}

const ZOOM_STEP = 0.1

const SaveIndicator: FC = () => {
  const t = useTranslations('Editor.status')
  const status = useCvEditorStore.use.saveStatus()
  const isDraft = useCvEditorStore.use.cvId() === DRAFT_ID

  if (status === 'error') {
    return (
      <span className='flex items-center gap-1.5 text-xs text-danger'>
        <ExclamationCircleFilled /> {t('error')}
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className='flex items-center gap-1.5 text-xs text-muted'>
        {isDraft ? <LaptopOutlined /> : <CheckCircleFilled className='text-success' />}
        {isDraft ? t('local') : t('saved')}
      </span>
    )
  }
  return (
    <span className='flex items-center gap-1.5 text-xs text-muted'>
      <CloudSyncOutlined spin={status === 'saving'} /> {t(status)}
    </span>
  )
}

export const EditorTopBar: FC<Props> = ({ zoom, fitZoom, pages, onZoomChange, onOpenPanel, autoCheckout }) => {
  const t = useTranslations('Editor')
  const tCommon = useTranslations('Common')
  const doc = useCvEditorStore.use.doc()
  const paidAt = useCvEditorStore.use.paidAt()
  const canUndo = useCvEditorStore.use.past().length > 0
  const canRedo = useCvEditorStore.use.future().length > 0
  const undo = useCvEditorStore.use.undo()
  const redo = useCvEditorStore.use.redo()
  const setTitle = useCvEditorStore.use.setTitle()
  const user = useAuthStore.use.user()

  const current = zoom ?? fitZoom
  const step = (direction: 1 | -1) => onZoomChange(Math.min(1.6, Math.max(0.4, Math.round((current + direction * ZOOM_STEP) * 10) / 10)))

  return (
    <header className='flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3'>
      <Link href={user ? ROUTES.dashboard : ROUTES.home} aria-label={tCommon('back')} className='flex items-center gap-1 text-muted'>
        <ArrowLeftOutlined />
        <BrandMark className='hidden size-7 sm:block' />
      </Link>
      <Input
        variant='borderless'
        className='max-w-56 min-w-0 font-semibold'
        value={doc?.title ?? ''}
        placeholder={t('untitled')}
        aria-label={t('titleLabel')}
        maxLength={120}
        onChange={(event) => setTitle(event.target.value)}
      />
      {paidAt && (
        <Tag color='success' className='hidden md:inline-block'>
          {tCommon('paid')}
        </Tag>
      )}
      <div className='hidden md:block'>
        <SaveIndicator />
      </div>

      <div className='ml-auto flex items-center gap-1'>
        <Tooltip title={t('undo')}>
          <Button type='text' icon={<UndoOutlined />} disabled={!canUndo} onClick={undo} aria-label={t('undo')} />
        </Tooltip>
        <Tooltip title={t('redo')}>
          <Button type='text' icon={<RedoOutlined />} disabled={!canRedo} onClick={redo} aria-label={t('redo')} />
        </Tooltip>
        <div className='mx-1 hidden items-center gap-0.5 rounded-lg bg-canvas px-1 lg:flex'>
          <Button type='text' size='small' icon={<ZoomOutOutlined />} onClick={() => step(-1)} aria-label={t('zoomOut')} />
          <button
            type='button'
            className='w-12 cursor-pointer border-0 bg-transparent text-xs font-medium tabular-nums'
            title={t('fit')}
            onClick={() => onZoomChange(null)}
          >
            {Math.round(current * 100)}%
          </button>
          <Button type='text' size='small' icon={<ZoomInOutlined />} onClick={() => step(1)} aria-label={t('zoomIn')} />
        </div>
        <span className='mr-1 hidden text-xs text-muted xl:inline'>{t('pages', { count: pages })}</span>
        <Button className='lg:hidden' icon={<SettingOutlined />} onClick={onOpenPanel} aria-label={t('panelOpen')} />
        <DownloadButton autoOpen={autoCheckout} />
      </div>
    </header>
  )
}
