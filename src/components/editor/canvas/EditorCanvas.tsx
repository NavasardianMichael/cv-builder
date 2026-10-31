'use client'

import { type FC, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { CvDocument } from '@components/cv/CvDocument'
import { type CvEditApi, CvEditProvider } from '@components/cv/CvEditContext'
import { A4_HEIGHT_PX, A4_WIDTH_PX } from '@components/cv/CvPreview'
import { AddContactButton, AddItemButton, BasicsToolbar, ContactToolbar, EntryToolbar, SectionToolbar, TagRemoveButton } from './BlockToolbars'
import { PhotoEditor } from './PhotoEditor'

type Props = {
  /** null = fit to the available width. */
  zoom: number | null
  /** Preview: the CV exactly as it will be read — no editing, links clickable, text selectable. */
  previewing: boolean
  onPagesChange: (pages: number) => void
  onFitZoomChange: (zoom: number) => void
}

const CANVAS_GUTTER_PX = 48

/**
 * The editable CV. The document is drawn at true A4 size and scaled to the zoom; dashed
 * guides mark where each A4 page ends (approximate — the PDF repeats page padding and keeps
 * entries whole, so a break can land slightly earlier than its guide).
 */
export const EditorCanvas: FC<Props> = ({ zoom, previewing, onPagesChange, onFitZoomChange }) => {
  const t = useTranslations('Editor')
  const doc = useCvEditorStore.use.doc()
  const selectedBlock = useCvEditorStore.use.selectedBlock()
  const selectBlock = useCvEditorStore.use.selectBlock()

  const frameRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [fitZoom, setFitZoom] = useState(1)
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX)

  useEffect(() => {
    const frame = frameRef.current
    const sheet = sheetRef.current
    if (!frame || !sheet) return
    const observer = new ResizeObserver(() => {
      const next = Math.min(1.1, Math.max(0.35, (frame.clientWidth - CANVAS_GUTTER_PX) / A4_WIDTH_PX))
      setFitZoom(next)
      onFitZoomChange(next)
      setSheetHeight(sheet.offsetHeight)
    })
    observer.observe(frame)
    observer.observe(sheet)
    return () => observer.disconnect()
  }, [onFitZoomChange])

  const pages = Math.max(1, Math.ceil((sheetHeight - 2) / A4_HEIGHT_PX))
  useEffect(() => onPagesChange(pages), [pages, onPagesChange])

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
  const scale = zoom ?? fitZoom

  return (
    <div
      ref={frameRef}
      className='min-h-full w-full px-6 pt-10 pb-24'
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && selectedBlock) selectBlock(null)
      }}
    >
      <div className='mx-auto' style={{ width: A4_WIDTH_PX * scale, height: sheetHeight * scale }}>
        <div className='relative origin-top-left' style={{ width: A4_WIDTH_PX, transform: `scale(${scale})` }}>
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
          {Array.from({ length: pages - 1 }, (_, index) => (
            <div
              key={index}
              className='pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-accent/70'
              style={{ top: A4_HEIGHT_PX * (index + 1) }}
              aria-hidden='true'
            >
              <span className='absolute -top-3 -right-2 translate-x-full rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white'>
                {t('pageBreak', { number: index + 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
