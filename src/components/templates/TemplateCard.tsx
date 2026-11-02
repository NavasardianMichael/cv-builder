import type { FC } from 'react'
import { templatePath } from '@constants/routes'
import type { TemplateMeta } from '@constants/templates'
import { templateDesign } from '@constants/templates'
import { cn } from '@helpers/cn'
import { sampleContent } from '@helpers/cvFactory'
import { CvPreview } from '@components/cv/CvPreview'
import { TemplateCardLink, TemplateCardPending } from './TemplateCardLink'

type Props = { template: TemplateMeta; className?: string; headingLevel?: 'h2' | 'h3' }

/** A template's live preview (rendered from the sample CV) linking to its own page. */
export const TemplateCard: FC<Props> = ({ template, className, headingLevel: Heading = 'h3' }) => (
  <TemplateCardLink
    href={templatePath(template.id)}
    className={cn('group block rounded-2xl text-inherit no-underline focus-visible:outline-offset-4', className)}
  >
    <div className='relative overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_-12px_rgba(20,24,45,0.25)] ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_50px_-16px_rgba(20,24,45,0.35)]'>
      <CvPreview content={sampleContent()} design={templateDesign(template.id)} />
      <TemplateCardPending />
    </div>
    <div className='mt-4 px-1'>
      <Heading className='m-0 font-display text-lg font-bold text-ink'>{template.name}</Heading>
      <p className='m-0 mt-1 text-sm text-muted'>{template.tagline}</p>
    </div>
  </TemplateCardLink>
)
