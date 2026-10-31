'use client'

import type { FC } from 'react'
import type { TemplateId } from '@constants/templates'
import { AcademicTemplate } from './templates/AcademicTemplate'
import { AtsTemplate } from './templates/AtsTemplate'
import { BentoTemplate } from './templates/BentoTemplate'
import { BoldTemplate } from './templates/BoldTemplate'
import { ClassicTemplate } from './templates/ClassicTemplate'
import { CompactTemplate } from './templates/CompactTemplate'
import { CorporateTemplate } from './templates/CorporateTemplate'
import { CreativeTemplate } from './templates/CreativeTemplate'
import { ElegantTemplate } from './templates/ElegantTemplate'
import { EuroTemplate } from './templates/EuroTemplate'
import { ExecutiveTemplate } from './templates/ExecutiveTemplate'
import { GazetteTemplate } from './templates/GazetteTemplate'
import { ManuscriptTemplate } from './templates/ManuscriptTemplate'
import { MidnightTemplate } from './templates/MidnightTemplate'
import { MinimalTemplate } from './templates/MinimalTemplate'
import { ModernTemplate } from './templates/ModernTemplate'
import { PortraitTemplate } from './templates/PortraitTemplate'
import { RibbonTemplate } from './templates/RibbonTemplate'
import { SoftTemplate } from './templates/SoftTemplate'
import { SwissTemplate } from './templates/SwissTemplate'
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
  corporate: CorporateTemplate,
  ats: AtsTemplate,
  portrait: PortraitTemplate,
  euro: EuroTemplate,
  ribbon: RibbonTemplate,
  bento: BentoTemplate,
  midnight: MidnightTemplate,
  swiss: SwissTemplate,
  manuscript: ManuscriptTemplate,
  gazette: GazetteTemplate,
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
