'use client'

import { type FC, memo, useEffect, useRef, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BgColorsOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Input, type InputRef, Popconfirm, Popover } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import type { BlockStyle, CvContact, CvEntry } from '@store/cvs/single/types'
import { CONTACT_TYPES, MAX_CONTACTS } from '@constants/contacts'
import { DEFAULT_ENTRY_PLACEHOLDERS, ENTRY_PLACEHOLDERS, SECTION_META, type SectionType } from '@constants/sections'
import { contactHref, toLinkHref } from '@helpers/contactLink'
import { toWebsiteUrl } from '@helpers/url'
import { ToolbarShell, ToolButton } from './ToolButton'
import { BlockStyleForm } from '../controls/BlockStyleForm'

/**
 * The controls the editor injects into the CV through `CvEditApi` (see EditorCanvas). They
 * render inside the CV's DOM, positioned by `.cv-toolbar` / `.cv-item-toolbar` in cv.css,
 * which shows them on hover or while their block is selected.
 */

/** The style button: opening it selects the block, so its toolbar stays put while editing. */
const StyleButton: FC<{
  blockId: string
  title: string
  style: BlockStyle
  onChange: (style: Partial<BlockStyle>) => void
}> = ({ blockId, title, style, onChange }) => {
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

type SectionToolbarProps = {
  sectionId: string
  title: string
  style: BlockStyle
  hidden: boolean
  index: number
  count: number
}

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
        <ToolButton
          icon={<ArrowUpOutlined />}
          label={t('moveUp')}
          disabled={index === 0}
          onClick={() => moveSection(sectionId, -1)}
        />
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

type LinkField<K extends string> = {
  key: K
  /** `undefined` on an item from a draft saved before this link existed. */
  url: string | undefined
  /** Shown above the field when the form has more than one. */
  label?: string
  placeholder: string
}

type LinkFormProps<K extends string> = {
  title: string
  fields: LinkField<K>[]
  hint: string
  /** What a field may hold: a draft it turns into no link is refused. */
  toHref: (text: string) => string | undefined
  /** Every field's value, trimmed; '' removes that link. */
  onSave: (urls: Record<K, string>) => void
}

/**
 * Attaches URLs to an item or a contact: the text they belong to becomes a link in the preview
 * and the PDF. An entry has two (its title and its subtitle), a contact one.
 */
const LinkForm = <K extends string>({ title, fields, hint, toHref, onSave }: LinkFormProps<K>) => {
  const t = useTranslations('Editor.block')
  const [drafts, setDrafts] = useState(() => Object.fromEntries(fields.map((field) => [field.key, field.url ?? ''])) as Record<K, string>)
  const inputRef = useRef<InputRef>(null)
  // The popover opened on a click on the link button, so the first field taking focus is expected.
  useEffect(() => inputRef.current?.focus(), [])
  const isInvalid = (key: K): boolean => Boolean(drafts[key].trim()) && !toHref(drafts[key])
  const invalid = fields.some((field) => isInvalid(field.key))
  const hasLink = fields.some((field) => field.url)

  const trimmed = (values: Record<K, string>) =>
    Object.fromEntries(fields.map((field) => [field.key, values[field.key].trim()])) as Record<K, string>
  const save = () => {
    if (!invalid) onSave(trimmed(drafts))
  }
  const removeAll = () => onSave(Object.fromEntries(fields.map((field) => [field.key, ''])) as Record<K, string>)

  return (
    <div className='flex w-72 flex-col gap-2'>
      <span className='text-sm font-semibold'>{title}</span>
      {fields.map((field, index) => (
        <label key={field.key} className='flex flex-col gap-1'>
          {field.label && <span className='text-xs font-medium text-muted'>{field.label}</span>}
          <Input
            ref={index === 0 ? inputRef : undefined}
            value={drafts[field.key]}
            placeholder={field.placeholder}
            status={isInvalid(field.key) ? 'error' : undefined}
            prefix={<LinkOutlined className='text-muted' />}
            allowClear
            onChange={(event) => setDrafts((current) => ({ ...current, [field.key]: event.target.value }))}
            onPressEnter={save}
            aria-label={field.label ?? title}
          />
        </label>
      ))}
      {invalid ? (
        <span className='text-xs text-danger'>{t('linkInvalid')}</span>
      ) : (
        <span className='text-xs break-all text-muted'>{hint}</span>
      )}
      <div className='flex justify-end gap-2'>
        {hasLink && (
          <Button size='small' danger onClick={removeAll}>
            {fields.length > 1 ? t('linkRemoveAll') : t('linkRemove')}
          </Button>
        )}
        <Button size='small' type='primary' disabled={invalid} onClick={save}>
          {t('linkSave')}
        </Button>
      </div>
    </div>
  )
}

export const EntryToolbar: FC<{ sectionId: string; entry: CvEntry; index: number; count: number }> = ({
  sectionId,
  entry,
  index,
  count,
}) => {
  const t = useTranslations('Editor.block')
  const moveEntry = useCvEditorStore.use.moveEntry()
  const duplicateEntry = useCvEditorStore.use.duplicateEntry()
  const removeEntry = useCvEditorStore.use.removeEntry()
  const setEntryField = useCvEditorStore.use.setEntryField()
  const sectionType = useCvEditorStoreBase((state) => state.doc?.content.sections.find((section) => section.id === sectionId)?.type)
  const labels = (sectionType && ENTRY_PLACEHOLDERS[sectionType]) || DEFAULT_ENTRY_PLACEHOLDERS
  // Focus moves into the popover (a portal), so the toolbar's own :hover/:focus-within no
  // longer hold it open; this flag does (`data-open` in cv.css).
  const [linkOpen, setLinkOpen] = useState(false)
  const hasLink = Boolean(entry.url || entry.subtitleUrl)

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
            <LinkForm
              title={t('linkTitle')}
              fields={[
                { key: 'url', url: entry.url, label: labels.title, placeholder: 'https://' },
                { key: 'subtitleUrl', url: entry.subtitleUrl, label: labels.subtitle, placeholder: 'https://' },
              ]}
              hint={t('linkHint')}
              toHref={toWebsiteUrl}
              onSave={(urls) => {
                // Only what changed, so an untouched link adds no undo step.
                if (urls.url !== (entry.url ?? '')) setEntryField(sectionId, entry.id, 'url', urls.url)
                if (urls.subtitleUrl !== (entry.subtitleUrl ?? '')) setEntryField(sectionId, entry.id, 'subtitleUrl', urls.subtitleUrl)
                setLinkOpen(false)
              }}
            />
          }
        >
          <ToolButton
            icon={<LinkOutlined />}
            label={hasLink ? t('linkEdit') : t('linkAdd')}
            className={hasLink ? 'text-accent' : undefined}
          />
        </Popover>
        <ToolButton
          icon={<ArrowUpOutlined />}
          label={t('moveUp')}
          disabled={index === 0}
          onClick={() => moveEntry(sectionId, entry.id, -1)}
        />
        <ToolButton
          icon={<ArrowDownOutlined />}
          label={t('moveDown')}
          disabled={index === count - 1}
          onClick={() => moveEntry(sectionId, entry.id, 1)}
        />
        <ToolButton
          icon={<CopyOutlined />}
          label={t('duplicate')}
          onClick={() => duplicateEntry(sectionId, entry.id)}
        />
        <ToolButton
          icon={<DeleteOutlined />}
          label={t('removeItem')}
          tone='danger'
          onClick={() => removeEntry(sectionId, entry.id)}
        />
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
      className='cv-tag-remove size-4.5 cursor-pointer rounded-full border-0 bg-red-500 p-0 text-white shadow ring-2 ring-white'
      aria-label={t('removeItem')}
      title={t('removeItem')}
      onClick={() => removeTag(sectionId, tagId)}
    >
      {/* An SVG, not the "×" character: a glyph sits on its font's baseline and never centres.
          Drawn here rather than CloseOutlined, whose hairline strokes vanish at this size. */}
      <svg viewBox='0 0 12 12' className='size-2.5' aria-hidden='true'>
        <path d='M3 3l6 6M9 3l-6 6' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      </svg>
    </button>
  )
}

/** A contact's toolbar: its link (worked out from the text unless one is set here) and remove. */
export const ContactToolbar: FC<{ contact: CvContact }> = ({ contact }) => {
  const t = useTranslations('Editor.contacts')
  const tBlock = useTranslations('Editor.block')
  const setContactField = useCvEditorStore.use.setContactField()
  const removeContact = useCvEditorStore.use.removeContact()
  const [linkOpen, setLinkOpen] = useState(false)
  const autoHref = contactHref({ ...contact, url: '' })

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
            <LinkForm
              title={t('linkTitle')}
              fields={[{ key: 'url', url: contact.url, placeholder: t('linkPlaceholder') }]}
              hint={autoHref ? t('linkAuto', { href: autoHref }) : t('linkHint')}
              toHref={toLinkHref}
              onSave={({ url }) => {
                setContactField(contact.id, 'url', url)
                setLinkOpen(false)
              }}
            />
          }
        >
          <ToolButton
            icon={<LinkOutlined />}
            label={contact.url ? tBlock('linkEdit') : tBlock('linkAdd')}
            className={contact.url ? 'text-accent' : undefined}
          />
        </Popover>
        <ToolButton
          icon={<DeleteOutlined />}
          label={tBlock('removeItem')}
          tone='danger'
          onClick={() => removeContact(contact.id)}
        />
      </ToolbarShell>
    </div>
  )
}

/** Ends the contacts row in the editor: a menu of contact types to add one of. */
export const AddContactButton: FC<{ count: number }> = ({ count }) => {
  const t = useTranslations('Editor.contacts')
  const addContact = useCvEditorStore.use.addContact()
  if (count >= MAX_CONTACTS) return null

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: CONTACT_TYPES.map((type) => ({ key: type, label: t(`types.${type}`), onClick: () => addContact(type) })),
      }}
    >
      <button
        type='button'
        className='cv-add-item inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-current bg-(--cv-bg) px-2.5 py-1 text-xs whitespace-nowrap'
        style={{ color: 'var(--cv-accent)', fontFamily: 'var(--font-ui), sans-serif' }}
      >
        <PlusOutlined /> {t('add')}
      </button>
    </Dropdown>
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
      className='cv-add-item inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-current bg-(--cv-bg) px-2.5 py-1 text-xs whitespace-nowrap'
      style={{ color: 'var(--cv-accent)', fontFamily: 'var(--font-ui), sans-serif' }}
      onClick={() => (kind === 'entries' ? addEntry(sectionId) : addTag(sectionId))}
    >
      <PlusOutlined /> {kind === 'entries' ? t('addEntry') : t('addTag')}
    </button>
  )
}

export const AddItemButton = memo(AddItemButtonComponent)
