'use client'

import { type FC, useState } from 'react'
import { CloseOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useTranslations } from 'next-intl'
import { stepZoom } from '@helpers/canvasZoom'

type Props = {
  zoom: number | null
  fitZoom: number
  onZoomChange: (zoom: number | null) => void
  /** The sheet is too small to type on: say how to edit it. */
  showTapHint: boolean
}

const HINT_KEY = 'cv-builder:canvas-tap-hint-seen'

const hintSeen = (): boolean => {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Phones and tablets: zoom buttons floating over the canvas (the desktop has them in the top
 * bar), and, while the sheet is too small to type on, how to edit it — until it is closed once.
 */
export const CanvasZoomControl: FC<Props> = ({ zoom, fitZoom, onZoomChange, showTapHint }) => {
  const t = useTranslations('Editor')
  const [hintClosed, setHintClosed] = useState(hintSeen)
  const current = zoom ?? fitZoom

  const closeHint = () => {
    setHintClosed(true)
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      // Private mode: the hint comes back next time, which is harmless.
    }
  }

  return (
    <div className='pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col items-end gap-2 lg:hidden'>
      {showTapHint && !hintClosed && (
        <div className='pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl bg-ink-deep py-2 pr-1 pl-3 text-xs leading-relaxed text-white shadow-lg'>
          <span className='py-1'>{t('mobileHint')}</span>
          <Button
            type='text'
            size='small'
            className='shrink-0 text-white/80'
            icon={<CloseOutlined />}
            aria-label={t('mobileHintClose')}
            onClick={closeHint}
          />
        </div>
      )}
      <div className='pointer-events-auto flex items-center gap-0.5 rounded-full bg-surface p-1 shadow-lg ring-1 ring-black/5'>
        <Button type='text' shape='circle' icon={<ZoomOutOutlined />} onClick={() => onZoomChange(stepZoom(current, -1))} aria-label={t('zoomOut')} />
        <button
          type='button'
          className='h-8 w-12 cursor-pointer rounded-full border-0 bg-transparent text-xs font-medium tabular-nums'
          aria-label={t('fit')}
          onClick={() => onZoomChange(null)}
        >
          {Math.round(current * 100)}%
        </button>
        <Button type='text' shape='circle' icon={<ZoomInOutlined />} onClick={() => onZoomChange(stepZoom(current, 1))} aria-label={t('zoomIn')} />
      </div>
    </div>
  )
}
