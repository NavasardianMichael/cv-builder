'use client'

import type { FC } from 'react'
import type { TemplateId } from '@constants/templates'
import { AcademicTemplate } from './templates/AcademicTemplate'
import { AtsTemplate } from './templates/AtsTemplate'
import { AuroraTemplate } from './templates/AuroraTemplate'
import { BauhausTemplate } from './templates/BauhausTemplate'
import { BentoTemplate } from './templates/BentoTemplate'
import { BlossomTemplate } from './templates/BlossomTemplate'
import { BlueprintTemplate } from './templates/BlueprintTemplate'
import { BoldTemplate } from './templates/BoldTemplate'
import { BotanicTemplate } from './templates/BotanicTemplate'
import { CandyTemplate } from './templates/CandyTemplate'
import { ClassicTemplate } from './templates/ClassicTemplate'
import { CompactTemplate } from './templates/CompactTemplate'
import { CorporateTemplate } from './templates/CorporateTemplate'
import { CosmosTemplate } from './templates/CosmosTemplate'
import { CreativeTemplate } from './templates/CreativeTemplate'
import { DiagonalTemplate } from './templates/DiagonalTemplate'
import { ElegantTemplate } from './templates/ElegantTemplate'
import { EuroTemplate } from './templates/EuroTemplate'
import { ExecutiveTemplate } from './templates/ExecutiveTemplate'
import { GazetteTemplate } from './templates/GazetteTemplate'
import { ManuscriptTemplate } from './templates/ManuscriptTemplate'
import { MasisTemplate } from './templates/MasisTemplate'
import { MemphisTemplate } from './templates/MemphisTemplate'
import { MidnightTemplate } from './templates/MidnightTemplate'
import { MinimalTemplate } from './templates/MinimalTemplate'
import { ModernTemplate } from './templates/ModernTemplate'
import { NeonTemplate } from './templates/NeonTemplate'
import { OceanTemplate } from './templates/OceanTemplate'
import { OrnamentTemplate } from './templates/OrnamentTemplate'
import { PopartTemplate } from './templates/PopartTemplate'
import { PortraitTemplate } from './templates/PortraitTemplate'
import { PrismTemplate } from './templates/PrismTemplate'
import { RibbonTemplate } from './templates/RibbonTemplate'
import { SoftTemplate } from './templates/SoftTemplate'
import { SpectrumTemplate } from './templates/SpectrumTemplate'
import { SunsetTemplate } from './templates/SunsetTemplate'
import { SwissTemplate } from './templates/SwissTemplate'
import { TechTemplate } from './templates/TechTemplate'
import { TerrazzoTemplate } from './templates/TerrazzoTemplate'
import { TimelineTemplate } from './templates/TimelineTemplate'
import { TopoTemplate } from './templates/TopoTemplate'
import type { TemplateProps } from './templates/types'
import { WavesTemplate } from './templates/WavesTemplate'
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
  aurora: AuroraTemplate,
  sunset: SunsetTemplate,
  neon: NeonTemplate,
  prism: PrismTemplate,
  masis: MasisTemplate,
  waves: WavesTemplate,
  blossom: BlossomTemplate,
  memphis: MemphisTemplate,
  ornament: OrnamentTemplate,
  blueprint: BlueprintTemplate,
  terrazzo: TerrazzoTemplate,
  popart: PopartTemplate,
  topo: TopoTemplate,
  botanic: BotanicTemplate,
  cosmos: CosmosTemplate,
  bauhaus: BauhausTemplate,
  candy: CandyTemplate,
  diagonal: DiagonalTemplate,
  spectrum: SpectrumTemplate,
  ocean: OceanTemplate,
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
