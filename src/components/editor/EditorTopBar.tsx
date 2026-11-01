'use client'

import type { FC } from 'react'
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloudSyncOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  LaptopOutlined,
  RedoOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Input } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { ROUTES } from '@constants/routes'
import { stepZoom } from '@helpers/canvasZoom'
import { BrandMark } from '@components/layout/BrandLogo'
import { HintTooltip } from '@components/ui/HintTooltip'
import { PaidBadge } from '@components/ui/PaidBadge'
import { DownloadButton } from './download/DownloadButton'

type Props = {
  zoom: number | null
  fitZoom: number
  pages: number
  onZoomChange: (zoom: number | null) => void
  autoCheckout: boolean
  previewing: boolean
  onPreviewChange: (previewing: boolean) => void
}

/** The save state; under `md` the icon alone, its words left to screen readers. */
const SaveIndicator: FC = () => {
  const t = useTranslations('Editor.status')
  const status = useCvEditorStore.use.saveStatus()
  const isDraft = useCvEditorStore.use.cvId() === DRAFT_ID

  if (status === 'error') {
    return (
      <span className='flex shrink-0 items-center gap-1.5 text-xs text-danger' title={t('error')}>
        <ExclamationCircleFilled /> <span className='sr-only md:not-sr-only'>{t('error')}</span>
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className='flex shrink-0 items-center gap-1.5 text-xs text-muted' title={isDraft ? t('local') : t('saved')}>
        {isDraft ? <LaptopOutlined /> : <CheckCircleFilled className='text-success' />}
        <span className='sr-only md:not-sr-only'>{isDraft ? t('local') : t('saved')}</span>
      </span>
    )
  }
  return (
    <span className='flex shrink-0 items-center gap-1.5 text-xs text-muted' title={t(status)}>
      <CloudSyncOutlined spin={status === 'saving'} /> <span className='sr-only md:not-sr-only'>{t(status)}</span>
    </span>
  )
}

export const EditorTopBar: FC<Props> = ({ zoom, fitZoom, pages, onZoomChange, autoCheckout, previewing, onPreviewChange }) => {
  const t = useTranslations('Editor')
  const tCommon = useTranslations('Common')
  // Narrow selectors: this bar must not re-render on every keystroke in the CV.
  const title = useCvEditorStoreBase((state) => state.doc?.title)
  const paidAt = useCvEditorStore.use.paidAt()
  const canUndo = useCvEditorStoreBase((state) => state.past.length > 0)
  const canRedo = useCvEditorStoreBase((state) => state.future.length > 0)
  const undo = useCvEditorStore.use.undo()
  const redo = useCvEditorStore.use.redo()
  const setTitle = useCvEditorStore.use.setTitle()
  const user = useAuthStore.use.user()

  const current = zoom ?? fitZoom
  const step = (direction: 1 | -1) => onZoomChange(stepZoom(current, direction))

  return (
    <header className='flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3'>
      <Link href={user ? ROUTES.dashboard : ROUTES.home} aria-label={tCommon('back')} className='flex items-center gap-1 text-muted'>
        <ArrowLeftOutlined />
        <BrandMark className='hidden size-7 sm:block' />
      </Link>
      <Input
        variant='borderless'
        className='max-w-56 min-w-0 flex-1 px-1 font-semibold sm:px-2.5'
        value={title ?? ''}
        placeholder={t('untitled')}
        aria-label={t('titleLabel')}
        maxLength={120}
        onChange={(event) => setTitle(event.target.value)}
      />
      {paidAt && <PaidBadge className='hidden md:inline-flex' />}
      <SaveIndicator />

      <div className='ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1'>
        <HintTooltip title={t('undo')}>
          <Button type='text' icon={<UndoOutlined />} disabled={!canUndo} onClick={undo} aria-label={t('undo')} />
        </HintTooltip>
        <HintTooltip title={t('redo')}>
          <Button type='text' icon={<RedoOutlined />} disabled={!canRedo} onClick={redo} aria-label={t('redo')} />
        </HintTooltip>
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
        {/* Phones and tablets switch preview from the bottom bar. A wrapper hides it: antd's
            own `display` on the button outranks a utility class. */}
        <span className='hidden lg:flex'>
          <HintTooltip title={previewing ? t('previewExitHint') : t('previewHint')}>
            <Button
              type={previewing ? 'primary' : 'default'}
              icon={previewing ? <EditOutlined /> : <EyeOutlined />}
              aria-pressed={previewing}
              aria-label={previewing ? t('previewExit') : t('preview')}
              onClick={() => onPreviewChange(!previewing)}
            />
          </HintTooltip>
        </span>
        <DownloadButton autoOpen={autoCheckout} />
      </div>
    </header>
  )
}
