'use client'

import { type FC, memo, useId } from 'react'
import { DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons'
import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Dropdown, Popconfirm, Segmented } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import type { CvSection, SectionColumn } from '@store/cvs/single/types'
import { CV_LIMITS, SECTION_DEFAULT_TITLES, SECTION_META, SECTION_TYPES, type SectionType } from '@constants/sections'
import { cn } from '@helpers/cn'
import { hasColumns } from '@helpers/cvStyle'
import { HintTooltip } from '@components/ui/HintTooltip'

type RowProps = {
  id: string
  /** Shown as written, or the type's default title while empty. */
  label: string
  title: string
  hidden: boolean
  column: SectionColumn
  columns: boolean
}

/**
 * One section's controls, dragged by its handle. Plain props and `memo`: typing in the CV
 * changes `sections` on every keystroke, and only the row whose title changed should
 * re-render its antd controls.
 */
const SectionRowComponent: FC<RowProps> = ({ id, label, title, hidden, column, columns }) => {
  const t = useTranslations('Editor')
  const toggleSectionHidden = useCvEditorStore.use.toggleSectionHidden()
  const removeSection = useCvEditorStore.use.removeSection()
  const setSectionColumn = useCvEditorStore.use.setSectionColumn()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative rounded-xl border border-line bg-surface p-2.5',
        hidden && !isDragging && 'opacity-60',
        isDragging && 'z-10 shadow-lg ring-2 ring-accent'
      )}
    >
      <div className='flex items-center gap-1'>
        <Button
          ref={setActivatorNodeRef}
          type='text'
          icon={<HolderOutlined />}
          aria-label={t('sections.drag', { title: label })}
          // The handle owns the gesture, so the bottom sheet still scrolls everywhere else.
          className={cn('shrink-0 touch-none', isDragging ? 'cursor-grabbing' : 'cursor-grab')}
          {...attributes}
          {...listeners}
        />
        <span className='min-w-0 flex-1 truncate text-sm font-medium'>{label}</span>
        <HintTooltip title={hidden ? t('sections.show') : t('sections.hide')}>
          <Button
            type='text'
            icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            aria-label={hidden ? t('sections.show') : t('sections.hide')}
            onClick={() => toggleSectionHidden(id)}
          />
        </HintTooltip>
        <Popconfirm
          title={t('block.deleteConfirm', { title: title || '…' })}
          okButtonProps={{ danger: true }}
          onConfirm={() => removeSection(id)}
        >
          <Button type='text' danger icon={<DeleteOutlined />} aria-label={t('block.delete')} />
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

export const AddSection = memo(AddSectionComponent)

const sectionLabel = (section: CvSection): string => section.title || SECTION_DEFAULT_TITLES[section.type]

/** Order (drag and drop, or the keyboard), visibility, column and the add-section menu. Content is edited on the CV itself. */
export const SectionsPanel: FC = () => {
  const t = useTranslations('Editor')
  const dndId = useId()
  const sections = useCvEditorStoreBase((state) => state.doc?.content.sections)
  const columns = useCvEditorStoreBase((state) => (state.doc ? hasColumns(state.doc.design) : false))
  const reorderSection = useCvEditorStore.use.reorderSection()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  if (!sections) return null

  const present = new Set(sections.map((section) => section.type))
  const addable = SECTION_TYPES.filter((type) => !SECTION_META[type].single || !present.has(type))

  const titleOf = (id: UniqueIdentifier): string => {
    const section = sections.find((item) => item.id === id)
    return section ? sectionLabel(section) : ''
  }
  const positionOf = (id: UniqueIdentifier | undefined): number => sections.findIndex((item) => item.id === id) + 1
  const accessibility = {
    screenReaderInstructions: { draggable: t('sections.dragInstructions') },
    announcements: {
      onDragStart: ({ active }) => t('sections.dragStart', { title: titleOf(active.id) }),
      onDragOver: ({ active, over }) =>
        over ? t('sections.dragOver', { title: titleOf(active.id), position: positionOf(over.id) }) : undefined,
      onDragEnd: ({ active, over }) =>
        over ? t('sections.dragEnd', { title: titleOf(active.id), position: positionOf(over.id) }) : t('sections.dragCancel'),
      onDragCancel: () => t('sections.dragCancel'),
    } satisfies Announcements,
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) reorderSection(String(active.id), String(over.id))
  }

  return (
    <div>
      <p className='mb-4 text-xs leading-relaxed text-muted'>{t('sections.hint')}</p>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        accessibility={accessibility}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <ul className='m-0 flex list-none flex-col gap-2 p-0'>
            {sections.map((section) => (
              <SectionRow
                key={section.id}
                id={section.id}
                label={sectionLabel(section)}
                title={section.title}
                hidden={section.hidden}
                column={section.column}
                columns={columns}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <AddSection addable={addable.join(',')} disabled={sections.length >= CV_LIMITS.sections} />
    </div>
  )
}
