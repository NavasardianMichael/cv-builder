'use client'

import { type FC, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BgColorsOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Popconfirm, Popover } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore } from '@store/cvs/single/store'
import type { BlockStyle, CvEntry, CvSection, CvTag } from '@store/cvs/single/types'
import { SECTION_META } from '@constants/sections'
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

export const SectionToolbar: FC<{ section: CvSection; index: number; count: number }> = ({ section, index, count }) => {
  const t = useTranslations('Editor.block')
  const moveSection = useCvEditorStore.use.moveSection()
  const toggleSectionHidden = useCvEditorStore.use.toggleSectionHidden()
  const removeSection = useCvEditorStore.use.removeSection()
  const setSectionStyle = useCvEditorStore.use.setSectionStyle()

  return (
    <div className='cv-toolbar'>
      <ToolbarShell>
        <ToolButton icon={<ArrowUpOutlined />} label={t('moveUp')} disabled={index === 0} onClick={() => moveSection(section.id, -1)} />
        <ToolButton
          icon={<ArrowDownOutlined />}
          label={t('moveDown')}
          disabled={index === count - 1}
          onClick={() => moveSection(section.id, 1)}
        />
        <StyleButton
          blockId={section.id}
          title={t('styleTitle')}
          style={section.style}
          onChange={(style) => setSectionStyle(section.id, style)}
        />
        <ToolButton
          icon={section.hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          label={section.hidden ? t('show') : t('hide')}
          onClick={() => toggleSectionHidden(section.id)}
        />
        <Popconfirm
          title={t('deleteConfirm', { title: section.title || '…' })}
          okButtonProps={{ danger: true }}
          onConfirm={() => removeSection(section.id)}
        >
          <ToolButton icon={<DeleteOutlined />} label={t('delete')} tone='danger' />
        </Popconfirm>
      </ToolbarShell>
    </div>
  )
}

export const BasicsToolbar: FC = () => {
  const t = useTranslations('Editor.block')
  const style = useCvEditorStore.use.doc()?.content.basics.style
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

export const EntryToolbar: FC<{ section: CvSection; entry: CvEntry; index: number }> = ({ section, entry, index }) => {
  const t = useTranslations('Editor.block')
  const moveEntry = useCvEditorStore.use.moveEntry()
  const duplicateEntry = useCvEditorStore.use.duplicateEntry()
  const removeEntry = useCvEditorStore.use.removeEntry()

  return (
    <div className='cv-item-toolbar'>
      <ToolbarShell className='p-0.5'>
        <ToolButton icon={<ArrowUpOutlined />} label={t('moveUp')} disabled={index === 0} onClick={() => moveEntry(section.id, entry.id, -1)} />
        <ToolButton
          icon={<ArrowDownOutlined />}
          label={t('moveDown')}
          disabled={index === section.entries.length - 1}
          onClick={() => moveEntry(section.id, entry.id, 1)}
        />
        <ToolButton icon={<CopyOutlined />} label={t('duplicate')} onClick={() => duplicateEntry(section.id, entry.id)} />
        <ToolButton icon={<DeleteOutlined />} label={t('removeItem')} tone='danger' onClick={() => removeEntry(section.id, entry.id)} />
      </ToolbarShell>
    </div>
  )
}

export const TagRemoveButton: FC<{ section: CvSection; tag: CvTag }> = ({ section, tag }) => {
  const t = useTranslations('Editor.block')
  const removeTag = useCvEditorStore.use.removeTag()
  return (
    <button
      type='button'
      className='cv-tag-remove ml-1 size-4 cursor-pointer place-items-center rounded-full border-0 bg-red-500 p-0 text-[10px] leading-none text-white'
      aria-label={t('removeItem')}
      title={t('removeItem')}
      onClick={() => removeTag(section.id, tag.id)}
    >
      ×
    </button>
  )
}

export const AddItemButton: FC<{ section: CvSection }> = ({ section }) => {
  const t = useTranslations('Editor.block')
  const addEntry = useCvEditorStore.use.addEntry()
  const addTag = useCvEditorStore.use.addTag()
  const kind = SECTION_META[section.type].kind
  if (kind === 'text') return null

  return (
    <button
      type='button'
      className='cv-add-item mt-2 inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-current bg-transparent px-2.5 py-1 font-[inherit] text-xs'
      style={{ color: 'var(--cv-accent)', fontFamily: 'var(--font-ui), sans-serif' }}
      onClick={() => (kind === 'entries' ? addEntry(section.id) : addTag(section.id))}
    >
      <PlusOutlined /> {kind === 'entries' ? t('addEntry') : t('addTag')}
    </button>
  )
}
