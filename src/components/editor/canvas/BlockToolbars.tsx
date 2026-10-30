'use client'

import { type FC, memo, useEffect, useRef, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BgColorsOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Button, Input, type InputRef, Popconfirm, Popover } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import type { BlockStyle, CvEntry } from '@store/cvs/single/types'
import { SECTION_META, type SectionType } from '@constants/sections'
import { toWebsiteUrl } from '@helpers/url'
import { ToolbarShell, ToolButton } from './ToolButton'
import { BlockStyleForm } from '../controls/BlockStyleForm'

/**
 * The controls the editor injects into the CV through `CvEditApi` (see EditorCanvas). They
 * render inside the CV's DOM, positioned by `.cv-toolbar` / `.cv-item-toolbar` in cv.css,
 * which shows them on hover or while their block is selected.
 */

/** The style button: opening it selects the block, so its toolbar stays put while editing. */
const StyleButton: FC<{ blockId: string; title: string; style: BlockStyle; onChange: (style: Partial<BlockStyle>) => void }> = ({
  blockId,
  title,
  style,
  onChange,
}) => {
  const t = useTranslations('Editor.block')
  const selectBlock = useCvEditorStore.use.selectBlock()
  const [open, setOpen] = useState(false)

  return (
    <Popover
      trigger='click'
      placement='bottomRight'
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        selectBlock(next ? blockId : null)
      }}
      content={<BlockStyleForm title={title} style={style} onChange={onChange} />}
    >
      <ToolButton icon={<BgColorsOutlined />} label={t('style')} />
    </Popover>
  )
}

type SectionToolbarProps = { sectionId: string; title: string; style: BlockStyle; hidden: boolean; index: number; count: number }

/** Plain props and `memo`: typing in one of the section's items must not re-render it. */
const SectionToolbarComponent: FC<SectionToolbarProps> = ({ sectionId, title, style, hidden, index, count }) => {
  const t = useTranslations('Editor.block')
  const moveSection = useCvEditorStore.use.moveSection()
  const toggleSectionHidden = useCvEditorStore.use.toggleSectionHidden()
  const removeSection = useCvEditorStore.use.removeSection()
  const setSectionStyle = useCvEditorStore.use.setSectionStyle()

  return (
    <div className='cv-toolbar'>
      <ToolbarShell>
        <ToolButton icon={<ArrowUpOutlined />} label={t('moveUp')} disabled={index === 0} onClick={() => moveSection(sectionId, -1)} />
        <ToolButton
          icon={<ArrowDownOutlined />}
          label={t('moveDown')}
          disabled={index === count - 1}
          onClick={() => moveSection(sectionId, 1)}
        />
        <StyleButton
          blockId={sectionId}
          title={t('styleTitle')}
          style={style}
          onChange={(next) => setSectionStyle(sectionId, next)}
        />
        <ToolButton
          icon={hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          label={hidden ? t('show') : t('hide')}
          onClick={() => toggleSectionHidden(sectionId)}
        />
        <Popconfirm
          title={t('deleteConfirm', { title: title || '…' })}
          okButtonProps={{ danger: true }}
          onConfirm={() => removeSection(sectionId)}
        >
          <ToolButton icon={<DeleteOutlined />} label={t('delete')} tone='danger' />
        </Popconfirm>
      </ToolbarShell>
    </div>
  )
}

export const SectionToolbar = memo(SectionToolbarComponent)

const BasicsToolbarComponent: FC = () => {
  const t = useTranslations('Editor.block')
  const style = useCvEditorStoreBase((state) => state.doc?.content.basics.style)
  const setBasicsStyle = useCvEditorStore.use.setBasicsStyle()
  if (!style) return null
  return (
    <div className='cv-toolbar'>
      <ToolbarShell>
        <StyleButton blockId='basics' title={t('headerStyleTitle')} style={style} onChange={setBasicsStyle} />
      </ToolbarShell>
    </div>
  )
}

/** `memo`, no props: it reads its own style, so the header's re-renders need not reach it. */
export const BasicsToolbar = memo(BasicsToolbarComponent)

/** Attaches a URL to an item: its title becomes a link in the preview and the PDF. */
const EntryLinkForm: FC<{ entry: CvEntry; onSave: (url: string) => void }> = ({ entry, onSave }) => {
  const t = useTranslations('Editor.block')
  // `?? ''`: an item from a draft saved before links existed has no `url` yet.
  const [draft, setDraft] = useState(entry.url ?? '')
  const inputRef = useRef<InputRef>(null)
  // The popover opened on a click on the link button, so the field taking focus is expected.
  useEffect(() => inputRef.current?.focus(), [])
  const invalid = Boolean(draft.trim()) && !toWebsiteUrl(draft)

  const save = () => {
    if (!invalid) onSave(draft.trim())
  }

  return (
    <div className='flex w-72 flex-col gap-2'>
      <span className='text-sm font-semibold'>{t('linkTitle')}</span>
      <Input
        ref={inputRef}
        value={draft}
        placeholder='https://'
        status={invalid ? 'error' : undefined}
        prefix={<LinkOutlined className='text-muted' />}
        onChange={(event) => setDraft(event.target.value)}
        onPressEnter={save}
        aria-label={t('linkTitle')}
      />
      {invalid ? (
        <span className='text-xs text-danger'>{t('linkInvalid')}</span>
      ) : (
        <span className='text-xs text-muted'>{t('linkHint')}</span>
      )}
      <div className='flex justify-end gap-2'>
        {entry.url && (
          <Button size='small' danger onClick={() => onSave('')}>
            {t('linkRemove')}
          </Button>
        )}
        <Button size='small' type='primary' disabled={invalid} onClick={save}>
          {t('linkSave')}
        </Button>
      </div>
    </div>
  )
}

export const EntryToolbar: FC<{ sectionId: string; entry: CvEntry; index: number; count: number }> = ({ sectionId, entry, index, count }) => {
  const t = useTranslations('Editor.block')
  const moveEntry = useCvEditorStore.use.moveEntry()
  const duplicateEntry = useCvEditorStore.use.duplicateEntry()
  const removeEntry = useCvEditorStore.use.removeEntry()
  const setEntryField = useCvEditorStore.use.setEntryField()
  // Focus moves into the popover (a portal), so the toolbar's own :hover/:focus-within no
  // longer hold it open; this flag does (`data-open` in cv.css).
  const [linkOpen, setLinkOpen] = useState(false)

  return (
    <div className='cv-item-toolbar' data-open={linkOpen || undefined}>
      <ToolbarShell className='p-0.5'>
        <Popover
          trigger='click'
          placement='bottomRight'
          open={linkOpen}
          onOpenChange={setLinkOpen}
          destroyOnHidden
          content={
            <EntryLinkForm
              entry={entry}
              onSave={(url) => {
                setEntryField(sectionId, entry.id, 'url', url)
                setLinkOpen(false)
              }}
            />
          }
        >
          <ToolButton
            icon={<LinkOutlined />}
            label={entry.url ? t('linkEdit') : t('linkAdd')}
            className={entry.url ? 'text-accent' : undefined}
          />
        </Popover>
        <ToolButton icon={<ArrowUpOutlined />} label={t('moveUp')} disabled={index === 0} onClick={() => moveEntry(sectionId, entry.id, -1)} />
        <ToolButton
          icon={<ArrowDownOutlined />}
          label={t('moveDown')}
          disabled={index === count - 1}
          onClick={() => moveEntry(sectionId, entry.id, 1)}
        />
        <ToolButton icon={<CopyOutlined />} label={t('duplicate')} onClick={() => duplicateEntry(sectionId, entry.id)} />
        <ToolButton icon={<DeleteOutlined />} label={t('removeItem')} tone='danger' onClick={() => removeEntry(sectionId, entry.id)} />
      </ToolbarShell>
    </div>
  )
}

export const TagRemoveButton: FC<{ sectionId: string; tagId: string }> = ({ sectionId, tagId }) => {
  const t = useTranslations('Editor.block')
  const removeTag = useCvEditorStore.use.removeTag()
  return (
    <button
      type='button'
      className='cv-tag-remove size-4.5 cursor-pointer rounded-full border-0 bg-red-500 p-0 text-[9px] text-white shadow'
      aria-label={t('removeItem')}
      title={t('removeItem')}
      onClick={() => removeTag(sectionId, tagId)}
    >
      {/* An SVG, not the "×" character: a glyph sits on its font's baseline and never centres. */}
      <CloseOutlined />
    </button>
  )
}

const AddItemButtonComponent: FC<{ sectionId: string; type: SectionType }> = ({ sectionId, type }) => {
  const t = useTranslations('Editor.block')
  const addEntry = useCvEditorStore.use.addEntry()
  const addTag = useCvEditorStore.use.addTag()
  const kind = SECTION_META[type].kind
  if (kind === 'text') return null

  return (
    <button
      type='button'
      className='cv-add-item mt-2 inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-current bg-transparent px-2.5 py-1 font-[inherit] text-xs'
      style={{ color: 'var(--cv-accent)', fontFamily: 'var(--font-ui), sans-serif' }}
      onClick={() => (kind === 'entries' ? addEntry(sectionId) : addTag(sectionId))}
    >
      <PlusOutlined /> {kind === 'entries' ? t('addEntry') : t('addTag')}
    </button>
  )
}

export const AddItemButton = memo(AddItemButtonComponent)
