'use client'

import type { FC } from 'react'
import type { TemplateId } from '@constants/templates'
import { AcademicTemplate } from './templates/AcademicTemplate'
import { BoldTemplate } from './templates/BoldTemplate'
import { ClassicTemplate } from './templates/ClassicTemplate'
import { CompactTemplate } from './templates/CompactTemplate'
import { CreativeTemplate } from './templates/CreativeTemplate'
import { ElegantTemplate } from './templates/ElegantTemplate'
import { ExecutiveTemplate } from './templates/ExecutiveTemplate'
import { MinimalTemplate } from './templates/MinimalTemplate'
import { ModernTemplate } from './templates/ModernTemplate'
import { SoftTemplate } from './templates/SoftTemplate'
import { TechTemplate } from './templates/TechTemplate'
import { TimelineTemplate } from './templates/TimelineTemplate'
import type { TemplateProps } from './templates/types'
import './cv.css'

const TEMPLATE_COMPONENTS: Record<TemplateId, FC<TemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  creative: CreativeTemplate,
  elegant: ElegantTemplate,
  tech: TechTemplate,
  timeline: TimelineTemplate,
  compact: CompactTemplate,
  bold: BoldTemplate,
  academic: AcademicTemplate,
  soft: SoftTemplate,
}

/**
 * A CV, rendered by its template. The same component draws the editor's canvas (inside a
 * `CvEditProvider`), every preview and thumbnail, and the page Chrome prints to PDF — which
 * is what makes the download look exactly like the editor.
 *
 * Needs `/fonts/cv-fonts.css` on the page (`CvFontsLink`) for its typefaces.
 */
export const CvDocument: FC<TemplateProps> = ({ content, design }) => {
  const Template = TEMPLATE_COMPONENTS[design.templateId] ?? ModernTemplate
  return <Template content={content} design={design} />
}
