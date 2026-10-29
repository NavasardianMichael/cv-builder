'use client'

import { type FC, memo, useMemo } from 'react'
import { CheckCircleFilled } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useCvEditorStore } from '@store/cvs/single/store'
import { TEMPLATE_LIST, templateDesign, type TemplateId } from '@constants/templates'
import { cn } from '@helpers/cn'
import { sampleContent } from '@helpers/cvFactory'
import { CvPreview } from '@components/cv/CvPreview'

/**
 * Previews use the sample CV, not the user's: twelve live copies of the open document would
 * re-render on every keystroke, and a blank CV previews as twelve empty sheets.
 */
const TemplateThumb = memo<{ templateId: TemplateId }>(({ templateId }) => {
  const content = useMemo(() => sampleContent(), [])
  const design = useMemo(() => templateDesign(templateId), [templateId])
  return <CvPreview content={content} design={design} />
})
TemplateThumb.displayName = 'TemplateThumb'

export const TemplatesPanel: FC = () => {
  const t = useTranslations('Editor')
  const current = useCvEditorStore.use.doc()?.design.templateId
  const applyTemplate = useCvEditorStore.use.applyTemplate()

  return (
    <div>
      <p className='mb-4 text-xs leading-relaxed text-muted'>{t('templateApplyHint')}</p>
      <ul className='m-0 grid list-none grid-cols-2 gap-3 p-0'>
        {TEMPLATE_LIST.map((template) => {
          const active = template.id === current
          return (
            <li key={template.id}>
              <button
                type='button'
                aria-pressed={active}
                onClick={() => !active && applyTemplate(template.id)}
                className={cn(
                  'group w-full cursor-pointer rounded-xl border-2 border-transparent bg-transparent p-1 text-left transition',
                  active ? 'border-accent' : 'hover:border-line'
                )}
              >
                <div className='relative overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5'>
                  <TemplateThumb templateId={template.id} />
                  {active && <CheckCircleFilled className='absolute top-2 right-2 text-xl text-accent' />}
                </div>
                <span className='mt-1.5 block truncate px-0.5 text-[13px] font-semibold'>{template.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
