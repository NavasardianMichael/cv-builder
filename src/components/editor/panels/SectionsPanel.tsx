'use client'

import { type FC, memo } from 'react'
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Dropdown, Popconfirm, Segmented, Tooltip } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import type { SectionColumn } from '@store/cvs/single/types'
import { CV_LIMITS, SECTION_DEFAULT_TITLES, SECTION_META, SECTION_TYPES, type SectionType } from '@constants/sections'
import { cn } from '@helpers/cn'
import { hasColumns } from '@helpers/cvStyle'

type RowProps = {
  id: string
  /** Shown as written, or the type's default title while empty. */
  label: string
  title: string
  hidden: boolean
  column: SectionColumn
  isFirst: boolean
  isLast: boolean
  columns: boolean
}

/**
 * One section's controls. Plain props and `memo`: typing in the CV changes `sections` on every
 * keystroke, and only the row whose title changed should re-render its antd controls.
 */
const SectionRowComponent: FC<RowProps> = ({ id, label, title, hidden, column, isFirst, isLast, columns }) => {
  const t = useTranslations('Editor')
  const moveSection = useCvEditorStore.use.moveSection()
  const toggleSectionHidden = useCvEditorStore.use.toggleSectionHidden()
  const removeSection = useCvEditorStore.use.removeSection()
  const setSectionColumn = useCvEditorStore.use.setSectionColumn()

  return (
    <li className={cn('rounded-xl border border-line bg-surface p-2.5', hidden && 'opacity-60')}>
      <div className='flex items-center gap-1'>
        <span className='min-w-0 flex-1 truncate text-sm font-medium'>{label}</span>
        <Button size='small' type='text' icon={<ArrowUpOutlined />} aria-label={t('block.moveUp')} disabled={isFirst} onClick={() => moveSection(id, -1)} />
        <Button
          size='small'
          type='text'
          icon={<ArrowDownOutlined />}
          aria-label={t('block.moveDown')}
          disabled={isLast}
          onClick={() => moveSection(id, 1)}
        />
        <Tooltip title={hidden ? t('sections.show') : t('sections.hide')}>
          <Button
            size='small'
            type='text'
            icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            aria-label={hidden ? t('sections.show') : t('sections.hide')}
            onClick={() => toggleSectionHidden(id)}
          />
        </Tooltip>
        <Popconfirm
          title={t('block.deleteConfirm', { title: title || '…' })}
          okButtonProps={{ danger: true }}
          onConfirm={() => removeSection(id)}
        >
          <Button size='small' type='text' danger icon={<DeleteOutlined />} aria-label={t('block.delete')} />
        </Popconfirm>
      </div>
      {columns && (
        <Segmented<SectionColumn>
          className='mt-2'
          size='small'
          block
          value={column}
          onChange={(next) => setSectionColumn(id, next)}
          options={(['auto', 'main', 'side'] as const).map((value) => ({ value, label: t(`sections.columns.${value}`) }))}
        />
      )}
    </li>
  )
}

const SectionRow = memo(SectionRowComponent)

/** The add-section menu; `addable` is joined into a string so it compares by value. */
const AddSectionComponent: FC<{ addable: string; disabled: boolean }> = ({ addable, disabled }) => {
  const t = useTranslations('Editor')
  const addSection = useCvEditorStore.use.addSection()
  const types = addable ? (addable.split(',') as SectionType[]) : []

  return (
    <Dropdown
      disabled={disabled || !types.length}
      menu={{
        items: types.map((type) => ({ key: type, label: SECTION_DEFAULT_TITLES[type] })),
        onClick: ({ key }) => addSection(key as SectionType),
      }}
      trigger={['click']}
    >
      <Button className='mt-4' block type='dashed' icon={<PlusOutlined />}>
        {t('sections.add')}
      </Button>
    </Dropdown>
  )
}

const AddSection = memo(AddSectionComponent)

/** Order, visibility, column and the add-section menu. Content is edited on the CV itself. */
export const SectionsPanel: FC = () => {
  const t = useTranslations('Editor')
  const sections = useCvEditorStoreBase((state) => state.doc?.content.sections)
  const columns = useCvEditorStoreBase((state) => (state.doc ? hasColumns(state.doc.design) : false))
  if (!sections) return null

  const present = new Set(sections.map((section) => section.type))
  const addable = SECTION_TYPES.filter((type) => !SECTION_META[type].single || !present.has(type))

  return (
    <div>
      <p className='mb-4 text-xs leading-relaxed text-muted'>{t('sections.hint')}</p>
      <ul className='m-0 flex list-none flex-col gap-2 p-0'>
        {sections.map((section, index) => (
          <SectionRow
            key={section.id}
            id={section.id}
            label={section.title || SECTION_DEFAULT_TITLES[section.type]}
            title={section.title}
            hidden={section.hidden}
            column={section.column}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            columns={columns}
          />
        ))}
      </ul>
      <AddSection addable={addable.join(',')} disabled={sections.length >= CV_LIMITS.sections} />
    </div>
  )
}
