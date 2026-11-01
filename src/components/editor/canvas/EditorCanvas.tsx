'use client'

import { type CSSProperties, type FC, type MouseEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { clampZoom } from '@helpers/canvasZoom'
import { cn } from '@helpers/cn'
import { CvDocument } from '@components/cv/CvDocument'
import { type CvEditApi, CvEditProvider } from '@components/cv/CvEditContext'
import { A4_HEIGHT_PX, A4_WIDTH_PX } from '@components/cv/CvPreview'
import { AddContactButton, AddItemButton, BasicsToolbar, ContactToolbar, EntryToolbar, SectionToolbar, TagRemoveButton } from './BlockToolbars'
import { PhotoEditor } from './PhotoEditor'

type Props = {
  /** null = fit to the available width. */
  zoom: number | null
  /** A pinch on a touch screen sets it. */
  onZoomChange: (zoom: number) => void
  /** Preview: the CV exactly as it will be read — no editing, links clickable, text selectable. */
  previewing: boolean
  /**
   * Set while the sheet is too small to type on (a phone, zoomed out): a tap then names the
   * block under it — `basics`, a section id, or null — instead of putting a caret in 4px text.
   */
  onBlockTap?: (blockId: string | null) => void
  onPagesChange: (pages: number) => void
  onFitZoomChange: (zoom: number) => void
}

/** The space beside the sheet, both sides together: less on a phone, where width is scarce. */
const gutterFor = (width: number): number => (width < 576 ? 24 : 48)

type TouchPoints = { readonly length: number; readonly [index: number]: { clientX: number; clientY: number } }

const distanceOf = (touches: TouchPoints): number =>
  Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

/**
 * The editable CV. The document is drawn at true A4 size and scaled to the zoom; dashed
 * guides mark where each A4 page ends (approximate — the PDF repeats page padding and keeps
 * entries whole, so a break can land slightly earlier than its guide).
 *
 * Touch screens pinch to zoom the sheet, not the page: the scroller takes only pans
 * (`touch-action`), and two fingers set the zoom, keeping the point between them in place.
 */
export const EditorCanvas: FC<Props> = ({ zoom, onZoomChange, previewing, onBlockTap, onPagesChange, onFitZoomChange }) => {
  const t = useTranslations('Editor')
  const doc = useCvEditorStore.use.doc()
  const selectedBlock = useCvEditorStore.use.selectedBlock()
  const selectBlock = useCvEditorStore.use.selectBlock()

  const scrollerRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [fitZoom, setFitZoom] = useState(1)
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX)
  const scale = zoom ?? fitZoom

  useEffect(() => {
    const scroller = scrollerRef.current
    const sheet = sheetRef.current
    if (!scroller || !sheet) return
    const observer = new ResizeObserver(() => {
      const width = scroller.clientWidth
      const next = Math.min(1.1, Math.max(0.35, (width - gutterFor(width)) / A4_WIDTH_PX))
      setFitZoom(next)
      onFitZoomChange(next)
      setSheetHeight(sheet.offsetHeight)
    })
    observer.observe(scroller)
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [onFitZoomChange])

  const pages = Math.max(1, Math.ceil((sheetHeight - 2) / A4_HEIGHT_PX))
  useEffect(() => onPagesChange(pages), [pages, onPagesChange])

  // The pinch reads the zoom it starts from and reports through refs, so its listeners are
  // attached once rather than on every frame of the gesture.
  const scaleRef = useRef(scale)
  const onZoomChangeRef = useRef(onZoomChange)
  /** Where the fingers were, as a fraction of the scrolled content: kept there after the zoom. */
  const anchorRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    scaleRef.current = scale
    onZoomChangeRef.current = onZoomChange
  })

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    let start: { distance: number; zoom: number } | null = null

    const onTouchStart = (event: TouchEvent) => {
      start = event.touches.length === 2 ? { distance: distanceOf(event.touches), zoom: scaleRef.current } : null
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!start || event.touches.length !== 2) return
      event.preventDefault()
      const rect = scroller.getBoundingClientRect()
      const left = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left
      const top = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top
      anchorRef.current = {
        x: (scroller.scrollLeft + left) / scroller.scrollWidth,
        y: (scroller.scrollTop + top) / scroller.scrollHeight,
        left,
        top,
      }
      onZoomChangeRef.current(clampZoom((start.zoom * distanceOf(event.touches)) / start.distance))
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) start = null
    }

    scroller.addEventListener('touchstart', onTouchStart, { passive: true })
    // Not passive: a pinch must not also zoom the page (iOS ignores `touch-action` for that).
    scroller.addEventListener('touchmove', onTouchMove, { passive: false })
    scroller.addEventListener('touchend', onTouchEnd)
    scroller.addEventListener('touchcancel', onTouchEnd)
    return () => {
      scroller.removeEventListener('touchstart', onTouchStart)
      scroller.removeEventListener('touchmove', onTouchMove)
      scroller.removeEventListener('touchend', onTouchEnd)
      scroller.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const anchor = anchorRef.current
    if (!scroller || !anchor) return
    anchorRef.current = null
    scroller.scrollLeft = anchor.x * scroller.scrollWidth - anchor.left
    scroller.scrollTop = anchor.y * scroller.scrollHeight - anchor.top
  }, [scale])

  // Actions are stable functions, so a snapshot of the store is enough to call them.
  const api = useMemo<CvEditApi>(
    () => ({
      actions: useCvEditorStoreBase.getState(),
      selectedBlock,
      sectionToolbar: (section, index, count) => (
        <SectionToolbar sectionId={section.id} title={section.title} style={section.style} hidden={section.hidden} index={index} count={count} />
      ),
      basicsToolbar: () => <BasicsToolbar />,
      entryToolbar: (sectionId, entry, index, count) => <EntryToolbar sectionId={sectionId} entry={entry} index={index} count={count} />,
      tagRemove: (sectionId, tagId) => <TagRemoveButton sectionId={sectionId} tagId={tagId} />,
      contactToolbar: (contact) => <ContactToolbar contact={contact} />,
      addContactButton: (count) => <AddContactButton count={count} />,
      addItemButton: (section) => <AddItemButton sectionId={section.id} type={section.type} />,
      photoEditor: (photo, initials) => <PhotoEditor photo={photo} initials={initials} />,
    }),
    [selectedBlock]
  )

  if (!doc) return null

  const tapBlock = (event: MouseEvent) => {
    // The layer covers the sheet, so look through it for the block that was drawn there.
    const block = document
      .elementsFromPoint(event.clientX, event.clientY)
      .map((element) => element.closest<HTMLElement>('[data-block]'))
      .find(Boolean)
    onBlockTap?.(block?.dataset.block ?? null)
  }

  return (
    <div
      ref={scrollerRef}
      className={cn(
        'min-w-0 flex-1 touch-pan-x touch-pan-y overflow-auto overscroll-contain bg-[color-mix(in_srgb,var(--brand-ink)_7%,var(--brand-canvas))]',
        onBlockTap && 'cv-canvas-tap'
      )}
    >
      <div
        className='min-h-full w-max min-w-full px-3 pt-6 pb-24 sm:px-6 sm:pt-10'
        onPointerDown={(event) => {
          if (event.target === event.currentTarget && selectedBlock) selectBlock(null)
        }}
      >
        <div className='mx-auto' style={{ width: A4_WIDTH_PX * scale, height: sheetHeight * scale }}>
          <div
            className='relative origin-top-left'
            style={{ width: A4_WIDTH_PX, transform: `scale(${scale})`, '--cv-ui-scale': 1 / scale } as CSSProperties}
          >
            <div ref={sheetRef} className='shadow-[0_18px_50px_-12px_rgba(20,24,45,0.35)]'>
              {/* Preview renders without the edit context: the same path as the PDF. */}
              {previewing ? (
                <CvDocument content={doc.content} design={doc.design} />
              ) : (
                <CvEditProvider value={api}>
                  <CvDocument content={doc.content} design={doc.design} />
                </CvEditProvider>
              )}
            </div>
            {onBlockTap && !previewing && (
              // A button for each block would be the accessible way, but this mode exists only
              // for fingers on a sheet too small to read; the panels carry the same edits.
              <div className='absolute inset-0 z-40 cursor-pointer' aria-hidden='true' onClick={tapBlock} />
            )}
            {Array.from({ length: pages - 1 }, (_, index) => (
              <div
                key={index}
                className='pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-accent/70'
                style={{ top: A4_HEIGHT_PX * (index + 1) }}
                aria-hidden='true'
              >
                {/* Beside the sheet where there is room for it; on a phone, just inside its edge. */}
                <span
                  className='absolute -top-3 right-2 origin-top-right rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white sm:-right-2 sm:origin-top-left sm:translate-x-full'
                  style={{ scale: 'var(--cv-ui-scale)' }}
                >
                  {t('pageBreak', { number: index + 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
