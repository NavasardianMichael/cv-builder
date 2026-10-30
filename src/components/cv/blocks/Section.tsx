'use client'

import { type FC, memo } from 'react'
import type { CvDesign, CvEntry, CvLevelStyle, CvSection, CvTag } from '@store/cvs/single/types'
import { SECTION_META } from '@constants/sections'
import { cn } from '@helpers/cn'
import { blockStyleVars, sectionHasContent } from '@helpers/cvStyle'
import { toWebsiteUrl } from '@helpers/url'
import { Level } from './Level'
import { useCvEdit } from '../CvEditContext'
import { CvIcon } from '../CvIcons'
import { Editable } from '../Editable'

/**
 * `tags` decides how a tag list reads: `list` (one per line, level beside it), `pills`
 * (chips), or `inline` (comma-flowing text). Templates choose per column.
 */
export type TagVariant = 'list' | 'pills' | 'inline'

type SectionProps = { section: CvSection; design: CvDesign; tags?: TagVariant }

export const SectionList: FC<{ sections: CvSection[]; design: CvDesign; tags?: TagVariant; className?: string }> = ({
  sections,
  design,
  tags,
  className,
}) => {
  const edit = useCvEdit()
  // The editor shows hidden and empty sections (dimmed / with placeholders) so they can be
  // found and filled; a rendered CV — preview, thumbnail, PDF — never prints a bare heading.
  const shown = edit ? sections : sections.filter((section) => !section.hidden && sectionHasContent(section))
  if (!shown.length) return null
  return (
    <div className={cn('cv-sections', className)}>
      {shown.map((section, index) => (
        <SectionBlock key={section.id} section={section} design={design} tags={tags} index={index} count={shown.length} />
      ))}
    </div>
  )
}

/**
 * Every block below is `memo`: a keystroke replaces only the edited entry's object (and its
 * section's), so only that block re-renders, not the whole CV and its toolbars.
 */
const SectionBlockComponent: FC<SectionProps & { index: number; count: number }> = ({ section, design, tags = 'list', index, count }) => {
  const edit = useCvEdit()
  const kind = SECTION_META[section.type].kind

  return (
    <section
      className={cn(
        'cv-section',
        `cv-section-${kind}`,
        `cv-section-type-${section.type}`,
        section.style.background && 'cv-has-bg',
        edit && 'cv-block-editable',
        edit?.selectedBlock === section.id && 'is-selected',
        section.hidden && 'is-hidden'
      )}
      style={blockStyleVars(section.style)}
    >
      {edit?.sectionToolbar(section, index, count)}
      <Editable
        as='h2'
        className='cv-section-title'
        value={section.title}
        placeholder='Բաժնի անվանում'
        onChange={(value) => edit?.actions.setSectionField(section.id, 'title', value)}
      />
      <div className='cv-section-body'>
        {kind === 'text' && <TextBody section={section} />}
        {kind === 'entries' && <EntryList section={section} />}
        {kind === 'tags' && <TagList section={section} design={design} variant={tags} />}
        {edit?.addItemButton(section)}
      </div>
    </section>
  )
}

const SectionBlock = memo(SectionBlockComponent)

const TextBody: FC<{ section: CvSection }> = ({ section }) => {
  const edit = useCvEdit()
  return (
    <Editable
      as='p'
      multiline
      className='cv-text'
      linkify
      value={section.text}
      placeholder='Մի քանի նախադասություն Ձեր մասին․ ով եք, ինչում եք ուժեղ, ինչ եք փնտրում։'
      onChange={(value) => edit?.actions.setSectionField(section.id, 'text', value)}
    />
  )
}

const ENTRY_PLACEHOLDERS: Partial<Record<CvSection['type'], { title: string; subtitle: string }>> = {
  experience: { title: 'Պաշտոն', subtitle: 'Ընկերություն' },
  education: { title: 'Մասնագիտություն, աստիճան', subtitle: 'Ուսումնական հաստատություն' },
  projects: { title: 'Նախագծի անվանում', subtitle: 'Դեր կամ տեխնոլոգիաներ' },
  certificates: { title: 'Վկայական կամ դասընթաց', subtitle: 'Կազմակերպիչ' },
  awards: { title: 'Մրցանակ', subtitle: 'Շնորհող կազմակերպություն' },
  volunteering: { title: 'Դեր', subtitle: 'Կազմակերպություն' },
  references: { title: 'Անուն Ազգանուն', subtitle: 'Պաշտոն, կոնտակտ' },
}

const DEFAULT_ENTRY_PLACEHOLDERS = { title: 'Վերնագիր', subtitle: 'Ենթավերնագիր' }

const EntryList: FC<{ section: CvSection }> = ({ section }) => {
  const edit = useCvEdit()
  const placeholders = ENTRY_PLACEHOLDERS[section.type] ?? DEFAULT_ENTRY_PLACEHOLDERS
  const entries = edit
    ? section.entries
    : section.entries.filter((entry) => entry.title || entry.subtitle || entry.description || entry.period)
  if (!entries.length) return null

  return (
    <ul className='cv-entries'>
      {entries.map((entry, index) => (
        <EntryItem key={entry.id} sectionId={section.id} entry={entry} index={index} count={entries.length} placeholders={placeholders} />
      ))}
    </ul>
  )
}

type EntryItemProps = { sectionId: string; entry: CvEntry; index: number; count: number; placeholders: { title: string; subtitle: string } }

const EntryItemComponent: FC<EntryItemProps> = ({ sectionId, entry, index, count, placeholders }) => {
  const edit = useCvEdit()
  const set = (field: 'title' | 'subtitle' | 'period' | 'location' | 'description') => (value: string) =>
    edit?.actions.setEntryField(sectionId, entry.id, field, value)
  return (
    <li className={cn('cv-entry', edit && 'cv-item-editable')}>
      {edit?.entryToolbar(sectionId, entry, index, count)}
      <div className='cv-entry-head'>
        <div className='cv-entry-title-row'>
          <Editable
            as='h3'
            className='cv-entry-title'
            value={entry.title}
            href={toWebsiteUrl(entry.url)}
            placeholder={placeholders.title}
            onChange={set('title')}
          />
          {toWebsiteUrl(entry.url) && <CvIcon name='link' />}
        </div>
        <Editable className='cv-entry-period' value={entry.period} placeholder='2020 – այժմ' onChange={set('period')} />
      </div>
      <div className='cv-entry-sub'>
        <Editable className='cv-entry-subtitle' linkify value={entry.subtitle} placeholder={placeholders.subtitle} onChange={set('subtitle')} />
        <Editable className='cv-entry-location' value={entry.location} placeholder='Քաղաք' onChange={set('location')} />
      </div>
      <Editable
        as='p'
        multiline
        className='cv-entry-description'
        linkify
        value={entry.description}
        placeholder='Նկարագրություն․ ձեռքբերումներ, պարտականություններ (• նոր տողից)'
        onChange={set('description')}
      />
    </li>
  )
}

const EntryItem = memo(EntryItemComponent)

const TagList: FC<{ section: CvSection; design: CvDesign; variant: TagVariant }> = ({ section, design, variant }) => {
  const edit = useCvEdit()
  const tags = edit ? section.tags : section.tags.filter((tag) => tag.name.trim())
  if (!tags.length) return null

  return (
    <ul className={cn('cv-tags', `cv-tags-${variant}`)}>
      {tags.map((tag) => (
        <TagItem key={tag.id} sectionId={section.id} type={section.type} tag={tag} levelStyle={design.levelStyle} variant={variant} />
      ))}
    </ul>
  )
}

type TagItemProps = { sectionId: string; type: CvSection['type']; tag: CvTag; levelStyle: CvLevelStyle; variant: TagVariant }

const TagItemComponent: FC<TagItemProps> = ({ sectionId, type, tag, levelStyle, variant }) => {
  const edit = useCvEdit()
  return (
    <li className={cn('cv-tag', edit && 'cv-item-editable')}>
      <Editable
        className='cv-tag-name'
        linkify
        value={tag.name}
        placeholder='Անվանում'
        onChange={(value) => edit?.actions.setTagName(sectionId, tag.id, value)}
      />
      {SECTION_META[type].levels && tag.level !== null && variant !== 'inline' && (
        <Level
          level={tag.level}
          style={levelStyle}
          sectionType={type}
          onChange={edit ? (level) => edit.actions.setTagLevel(sectionId, tag.id, level) : undefined}
        />
      )}
      {edit?.tagRemove(sectionId, tag.id)}
    </li>
  )
}

const TagItem = memo(TagItemComponent)
