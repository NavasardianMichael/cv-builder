'use client'

import type { FC } from 'react'
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Dropdown, Popconfirm, Segmented, Tooltip } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore } from '@store/cvs/single/store'
import type { SectionColumn } from '@store/cvs/single/types'
import { CV_LIMITS, SECTION_DEFAULT_TITLES, SECTION_META, SECTION_TYPES } from '@constants/sections'
import { cn } from '@helpers/cn'
import { hasColumns } from '@helpers/cvStyle'

/** Order, visibility, column and the add-section menu. Content is edited on the CV itself. */
export const SectionsPanel: FC = () => {
  const t = useTranslations('Editor')
  const doc = useCvEditorStore.use.doc()
  const moveSection = useCvEditorStore.use.moveSection()
  const toggleSectionHidden = useCvEditorStore.use.toggleSectionHidden()
  const removeSection = useCvEditorStore.use.removeSection()
  const setSectionColumn = useCvEditorStore.use.setSectionColumn()
  const addSection = useCvEditorStore.use.addSection()
  if (!doc) return null

  const sections = doc.content.sections
  const present = new Set(sections.map((section) => section.type))
  const addable = SECTION_TYPES.filter((type) => !SECTION_META[type].single || !present.has(type))
  const columns = hasColumns(doc.design)

  return (
    <div>
      <p className='mb-4 text-xs leading-relaxed text-muted'>{t('sections.hint')}</p>
      <ul className='m-0 flex list-none flex-col gap-2 p-0'>
        {sections.map((section, index) => (
          <li key={section.id} className={cn('rounded-xl border border-line bg-surface p-2.5', section.hidden && 'opacity-60')}>
            <div className='flex items-center gap-1'>
              <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                {section.title || SECTION_DEFAULT_TITLES[section.type]}
              </span>
              <Button size='small' type='text' icon={<ArrowUpOutlined />} aria-label={t('block.moveUp')} disabled={index === 0} onClick={() => moveSection(section.id, -1)} />
              <Button
                size='small'
                type='text'
                icon={<ArrowDownOutlined />}
                aria-label={t('block.moveDown')}
                disabled={index === sections.length - 1}
                onClick={() => moveSection(section.id, 1)}
              />
              <Tooltip title={section.hidden ? t('sections.show') : t('sections.hide')}>
                <Button
                  size='small'
                  type='text'
                  icon={section.hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  aria-label={section.hidden ? t('sections.show') : t('sections.hide')}
                  onClick={() => toggleSectionHidden(section.id)}
                />
              </Tooltip>
              <Popconfirm
                title={t('block.deleteConfirm', { title: section.title || '…' })}
                okButtonProps={{ danger: true }}
                onConfirm={() => removeSection(section.id)}
              >
                <Button size='small' type='text' danger icon={<DeleteOutlined />} aria-label={t('block.delete')} />
              </Popconfirm>
            </div>
            {columns && (
              <Segmented<SectionColumn>
                className='mt-2'
                size='small'
                block
                value={section.column}
                onChange={(column) => setSectionColumn(section.id, column)}
                options={(['auto', 'main', 'side'] as const).map((value) => ({ value, label: t(`sections.columns.${value}`) }))}
              />
            )}
          </li>
        ))}
      </ul>
      <Dropdown
        disabled={sections.length >= CV_LIMITS.sections || !addable.length}
        menu={{
          items: addable.map((type) => ({ key: type, label: SECTION_DEFAULT_TITLES[type] })),
          onClick: ({ key }) => addSection(key as (typeof SECTION_TYPES)[number]),
        }}
        trigger={['click']}
      >
        <Button className='mt-4' block type='dashed' icon={<PlusOutlined />}>
          {t('sections.add')}
        </Button>
      </Dropdown>
    </div>
  )
}
