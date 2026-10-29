'use client'

import { type FC, useEffect, useRef, useState } from 'react'
import type { CvContent, CvDesign } from '@store/cvs/single/types'
import { cn } from '@helpers/cn'
import { CvDocument } from './CvDocument'

/** 210mm at 96dpi. */
export const A4_WIDTH_PX = 793.7
/** 297mm at 96dpi. */
export const A4_HEIGHT_PX = 1122.5

type Props = {
  content: CvContent
  design: CvDesign
  className?: string
  /** Crop to the first page's height (cards). Otherwise the whole CV shows. */
  firstPageOnly?: boolean
}

/**
 * A CV scaled to fit its container's width — template cards, dashboard thumbnails, the
 * landing page. Measures its own width, so it works in any grid. `inert` keeps the scaled
 * copy's links out of the tab order and away from screen readers; the page around it says
 * what it is.
 */
export const CvPreview: FC<Props> = ({ content, design, className, firstPageOnly = true }) => {
  const frameRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX)

  useEffect(() => {
    const frame = frameRef.current
    const sheet = sheetRef.current
    if (!frame || !sheet) return
    const observer = new ResizeObserver(() => {
      setScale(frame.clientWidth / A4_WIDTH_PX)
      setSheetHeight(sheet.offsetHeight)
    })
    observer.observe(frame)
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={frameRef}
      className={cn('relative w-full overflow-hidden', className)}
      style={
        firstPageOnly
          ? { aspectRatio: `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}` }
          : { height: scale ? sheetHeight * scale : undefined, aspectRatio: scale ? undefined : `${A4_WIDTH_PX} / ${A4_HEIGHT_PX}` }
      }
      inert
      aria-hidden='true'
    >
      <div
        ref={sheetRef}
        className='absolute top-0 left-0 origin-top-left'
        style={{ width: A4_WIDTH_PX, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}
      >
        <CvDocument content={content} design={design} />
      </div>
    </div>
  )
}
