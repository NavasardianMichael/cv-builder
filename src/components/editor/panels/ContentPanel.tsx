'use client'

import { type FC, memo, type ReactNode, useEffect, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Button, Collapse, Dropdown, Input, Select } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import type { CvBasics, CvEntry, CvSection, CvTag } from '@store/cvs/single/types'
import { CONTACT_PLACEHOLDERS, CONTACT_TYPES, MAX_CONTACTS } from '@constants/contacts'
import {
  CV_LIMITS,
  DEFAULT_ENTRY_PLACEHOLDERS,
  ENTRY_FIELD_PLACEHOLDERS,
  ENTRY_PLACEHOLDERS,
  LEVEL_LABELS,
  MAX_LEVEL,
  SECTION_DEFAULT_TITLES,
  SECTION_META,
  SECTION_TYPES,
  type SectionType,
} from '@constants/sections'
import { cn } from '@helpers/cn'
import { sectionHasContent } from '@helpers/cvStyle'
import { toWebsiteUrl } from '@helpers/url'
import { AddSection } from './SectionsPanel'
import { PhotoEditor } from '../canvas/PhotoEditor'

/**
 * The CV's text as a form: the phone's way to write a CV, where the sheet is too small to type
 * on. Every field calls the same store action as its twin on the canvas, so undo, autosave and
 * the live sheet behind the panel follow along. Order, visibility and styles stay with the
 * Sections panel and the canvas toolbars.
 */

const Field: FC<{ label: string; hint?: ReactNode; children: ReactNode; className?: string }> = ({ label, hint, children, className }) => (
  <label className={cn('block', className)}>
    <span className='mb-1 block text-xs font-medium text-muted'>{label}</span>
    {children}
    {hint && <span className='mt-1 block text-xs text-muted'>{hint}</span>}
  </label>
)

const AddButton: FC<{ label: string; onClick?: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => (
  <Button type='dashed' block icon={<PlusOutlined />} onClick={onClick} disabled={disabled}>
    {label}
  </Button>
)

const BasicsFormComponent: FC<{ basics: CvBasics; showPhoto: boolean }> = ({ basics, showPhoto }) => {
  const t = useTranslations('Editor')
  const setBasicsField = useCvEditorStore.use.setBasicsField()
  const setContactField = useCvEditorStore.use.setContactField()
  const removeContact = useCvEditorStore.use.removeContact()
  const addContact = useCvEditorStore.use.addContact()

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-end gap-3'>
        {showPhoto && (
          // The slot draws in currentColor, ink here; only the image is round, so the remove
          // button on its corner is not clipped.
          <div className='size-16 shrink-0 text-ink [&_.ant-upload>button]:rounded-full'>
            <PhotoEditor photo={basics.photo} initials='' />
          </div>
        )}
        <Field label={t('content.fullName')} className='min-w-0 flex-1'>
          <Input value={basics.fullName} onChange={(event) => setBasicsField('fullName', event.target.value)} />
        </Field>
      </div>
      <Field label={t('content.headline')}>
        <Input value={basics.headline} onChange={(event) => setBasicsField('headline', event.target.value)} />
      </Field>

      <span className='-mb-1 text-xs font-medium text-muted'>{t('content.contacts')}</span>
      {basics.contacts.map((contact) => (
        <div key={contact.id} className='flex items-center gap-1'>
          <Input
            value={contact.value}
            placeholder={CONTACT_PLACEHOLDERS[contact.type]}
            aria-label={t(`contacts.types.${contact.type}`)}
            prefix={<span className='w-18 shrink-0 truncate text-xs text-muted'>{t(`contacts.types.${contact.type}`)}</span>}
            onChange={(event) => setContactField(contact.id, 'value', event.target.value)}
          />
          <Button type='text' danger icon={<DeleteOutlined />} aria-label={t('block.removeItem')} onClick={() => removeContact(contact.id)} />
        </div>
      ))}
      {basics.contacts.length < MAX_CONTACTS && (
        <Dropdown
          trigger={['click']}
          menu={{ items: CONTACT_TYPES.map((type) => ({ key: type, label: t(`contacts.types.${type}`), onClick: () => addContact(type) })) }}
        >
          <Button type='dashed' block icon={<PlusOutlined />}>
            {t('contacts.add')}
          </Button>
        </Dropdown>
      )}
    </div>
  )
}

const BasicsForm = memo(BasicsFormComponent)

type EntryCardProps = { sectionId: string; type: SectionType; entry: CvEntry; index: number; count: number }

const EntryCardComponent: FC<EntryCardProps> = ({ sectionId, type, entry, index, count }) => {
  const t = useTranslations('Editor')
  const setEntryField = useCvEditorStore.use.setEntryField()
  const moveEntry = useCvEditorStore.use.moveEntry()
  const duplicateEntry = useCvEditorStore.use.duplicateEntry()
  const removeEntry = useCvEditorStore.use.removeEntry()
  const labels = ENTRY_PLACEHOLDERS[type] ?? DEFAULT_ENTRY_PLACEHOLDERS
  const links = [
    { field: 'url', label: labels.title },
    { field: 'subtitleUrl', label: labels.subtitle },
  ] as const

  return (
    <li className='rounded-xl border border-line bg-canvas/50 p-3'>
      <div className='mb-2 flex items-center gap-0.5'>
        <span className='min-w-0 flex-1 truncate text-sm font-semibold'>{entry.title || t('content.entry', { number: index + 1 })}</span>
        <Button type='text' icon={<ArrowUpOutlined />} aria-label={t('block.moveUp')} disabled={index === 0} onClick={() => moveEntry(sectionId, entry.id, -1)} />
        <Button
          type='text'
          icon={<ArrowDownOutlined />}
          aria-label={t('block.moveDown')}
          disabled={index === count - 1}
          onClick={() => moveEntry(sectionId, entry.id, 1)}
        />
        <Button type='text' icon={<CopyOutlined />} aria-label={t('block.duplicate')} onClick={() => duplicateEntry(sectionId, entry.id)} />
        <Button type='text' danger icon={<DeleteOutlined />} aria-label={t('block.removeItem')} onClick={() => removeEntry(sectionId, entry.id)} />
      </div>
      <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
        <Field label={labels.title} className='sm:col-span-2'>
          <Input value={entry.title} onChange={(event) => setEntryField(sectionId, entry.id, 'title', event.target.value)} />
        </Field>
        <Field label={labels.subtitle} className='sm:col-span-2'>
          <Input value={entry.subtitle} onChange={(event) => setEntryField(sectionId, entry.id, 'subtitle', event.target.value)} />
        </Field>
        <Field label={t('content.period')}>
          <Input
            value={entry.period}
            placeholder={ENTRY_FIELD_PLACEHOLDERS.period}
            onChange={(event) => setEntryField(sectionId, entry.id, 'period', event.target.value)}
          />
        </Field>
        <Field label={t('content.location')}>
          <Input
            value={entry.location}
            placeholder={ENTRY_FIELD_PLACEHOLDERS.location}
            onChange={(event) => setEntryField(sectionId, entry.id, 'location', event.target.value)}
          />
        </Field>
        <Field label={t('content.description')} className='sm:col-span-2'>
          <Input.TextArea
            value={entry.description}
            placeholder={ENTRY_FIELD_PLACEHOLDERS.description}
            autoSize={{ minRows: 3, maxRows: 14 }}
            onChange={(event) => setEntryField(sectionId, entry.id, 'description', event.target.value)}
          />
        </Field>
        {links.map(({ field, label }) => {
          // `?? ''`: an entry from a draft saved before its links existed has no such field yet.
          const value = entry[field] ?? ''
          const invalid = Boolean(value.trim()) && !toWebsiteUrl(value)
          return (
            <Field
              key={field}
              label={t('content.url', { field: label })}
              className='sm:col-span-2'
              hint={invalid ? <span className='text-danger'>{t('block.linkInvalid')}</span> : t('content.urlHint', { field: label })}
            >
              <Input
                value={value}
                placeholder='https://'
                inputMode='url'
                autoCapitalize='off'
                status={invalid ? 'warning' : undefined}
                prefix={<LinkOutlined className='text-muted' />}
                onChange={(event) => setEntryField(sectionId, entry.id, field, event.target.value)}
              />
            </Field>
          )
        })}
      </div>
    </li>
  )
}

const EntryCard = memo(EntryCardComponent)

const TagRowComponent: FC<{ sectionId: string; type: SectionType; tag: CvTag }> = ({ sectionId, type, tag }) => {
  const t = useTranslations('Editor')
  const setTagName = useCvEditorStore.use.setTagName()
  const setTagLevel = useCvEditorStore.use.setTagLevel()
  const removeTag = useCvEditorStore.use.removeTag()
  const words = type === 'languages' ? LEVEL_LABELS.languages : LEVEL_LABELS.default

  return (
    <li className='flex items-center gap-1'>
      <Input
        value={tag.name}
        placeholder={ENTRY_FIELD_PLACEHOLDERS.tag}
        aria-label={ENTRY_FIELD_PLACEHOLDERS.tag}
        onChange={(event) => setTagName(sectionId, tag.id, event.target.value)}
      />
      {SECTION_META[type].levels && tag.level !== null && (
        <Select<number>
          className='w-32 shrink-0'
          value={tag.level}
          aria-label={t('content.level')}
          popupMatchSelectWidth={false}
          onChange={(level) => setTagLevel(sectionId, tag.id, level)}
          options={Array.from({ length: MAX_LEVEL + 1 }, (_, level) => ({
            value: level,
            label: level ? words[level] : t('content.levelNone'),
          }))}
        />
      )}
      <Button type='text' danger icon={<DeleteOutlined />} aria-label={t('block.removeItem')} onClick={() => removeTag(sectionId, tag.id)} />
    </li>
  )
}

const TagRow = memo(TagRowComponent)

/** One section's fields. `memo` on the section: typing elsewhere leaves its object, and it, alone. */
const SectionFormComponent: FC<{ section: CvSection }> = ({ section }) => {
  const t = useTranslations('Editor')
  const setSectionField = useCvEditorStore.use.setSectionField()
  const addEntry = useCvEditorStore.use.addEntry()
  const addTag = useCvEditorStore.use.addTag()
  const kind = SECTION_META[section.type].kind

  return (
    <div className='flex flex-col gap-3'>
      <Field label={t('content.sectionTitle')}>
        <Input
          value={section.title}
          placeholder={SECTION_DEFAULT_TITLES[section.type]}
          onChange={(event) => setSectionField(section.id, 'title', event.target.value)}
        />
      </Field>

      {kind === 'text' && (
        <Field label={t('content.text')}>
          <Input.TextArea
            value={section.text}
            autoSize={{ minRows: 4, maxRows: 16 }}
            onChange={(event) => setSectionField(section.id, 'text', event.target.value)}
          />
        </Field>
      )}

      {kind === 'entries' && (
        <>
          <ul className='m-0 flex list-none flex-col gap-3 p-0'>
            {section.entries.map((entry, index) => (
              <EntryCard key={entry.id} sectionId={section.id} type={section.type} entry={entry} index={index} count={section.entries.length} />
            ))}
          </ul>
          <AddButton label={t('block.addEntry')} disabled={section.entries.length >= CV_LIMITS.entries} onClick={() => addEntry(section.id)} />
        </>
      )}

      {kind === 'tags' && (
        <>
          <ul className='m-0 flex list-none flex-col gap-2 p-0'>
            {section.tags.map((tag) => (
              <TagRow key={tag.id} sectionId={section.id} type={section.type} tag={tag} />
            ))}
          </ul>
          <AddButton label={t('block.addTag')} disabled={section.tags.length >= CV_LIMITS.tags} onClick={() => addTag(section.id)} />
        </>
      )}
    </div>
  )
}

const SectionForm = memo(SectionFormComponent)

const itemCount = (section: CvSection): number | null => {
  const kind = SECTION_META[section.type].kind
  return kind === 'entries' ? section.entries.length : kind === 'tags' ? section.tags.length : null
}

type Props = {
  /** The block to open and scroll to — `basics` or a section id, as tapped on the sheet. */
  focusBlock?: string | null
}

export const ContentPanel: FC<Props> = ({ focusBlock }) => {
  const t = useTranslations('Editor')
  const basics = useCvEditorStoreBase((state) => state.doc?.content.basics)
  const sections = useCvEditorStoreBase((state) => state.doc?.content.sections)
  const showPhoto = useCvEditorStoreBase((state) => state.doc?.design.showPhoto ?? false)
  const [open, setOpen] = useState<string[]>(() => [focusBlock ?? 'basics'])
  // A section just added is selected by the store; open it like a tapped one.
  const selectedBlock = useCvEditorStore.use.selectedBlock()
  const target = focusBlock ?? selectedBlock
  const [prevTarget, setPrevTarget] = useState(target)

  // A new tap on the sheet, or a new section: open that block too (during render, not in an
  // effect, so it never paints closed first).
  if (target !== prevTarget) {
    setPrevTarget(target)
    if (target && !open.includes(target)) setOpen([...open, target])
  }

  useEffect(() => {
    if (!focusBlock) return
    // After the panel's slide-in, or the opened block would scroll to where it was mid-way.
    const timer = window.setTimeout(() => {
      document.querySelector(`[data-content-block="${CSS.escape(focusBlock)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 320)
    return () => window.clearTimeout(timer)
  }, [focusBlock])

  if (!basics || !sections) return null

  const present = new Set(sections.map((section) => section.type))
  const addable = SECTION_TYPES.filter((type) => !SECTION_META[type].single || !present.has(type))

  return (
    <div>
      <p className='mb-4 text-xs leading-relaxed text-muted'>{t('content.hint')}</p>
      <Collapse
        activeKey={open}
        onChange={(keys) => setOpen(Array.isArray(keys) ? keys : [keys])}
        expandIconPlacement='end'
        className='bg-surface'
        items={[
          {
            key: 'basics',
            label: (
              <span data-content-block='basics' className='scroll-mt-4 font-semibold'>
                {t('content.basics')}
              </span>
            ),
            children: <BasicsForm basics={basics} showPhoto={showPhoto} />,
          },
          ...sections.map((section) => {
            const count = itemCount(section)
            return {
              key: section.id,
              label: (
                <span data-content-block={section.id} className={cn('flex scroll-mt-4 items-center gap-2', section.hidden && 'opacity-60')}>
                  <span className='min-w-0 truncate font-semibold'>{section.title || SECTION_DEFAULT_TITLES[section.type]}</span>
                  {section.hidden && <EyeInvisibleOutlined className='text-muted' aria-label={t('content.hidden')} />}
                  <span className='ml-auto shrink-0 text-xs font-normal text-muted'>
                    {!sectionHasContent(section) ? t('content.empty') : count !== null ? t('content.items', { count }) : null}
                  </span>
                </span>
              ),
              children: <SectionForm section={section} />,
            }
          }),
        ]}
      />
      <AddSection addable={addable.join(',')} disabled={sections.length >= CV_LIMITS.sections} />
    </div>
  )
}
