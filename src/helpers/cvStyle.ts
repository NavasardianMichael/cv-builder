import type { CSSProperties } from 'react'
import type { BlockStyle, CvDesign, CvSection, CvSpacing } from '@store/cvs/single/types'
import { cvFontStack } from '@constants/fonts'
import { SECTION_META } from '@constants/sections'
import { TEMPLATES } from '@constants/templates'

/**
 * A CV's design reaches its template only as CSS custom properties on the root
 * (`--cv-accent`, `--cv-font-heading`, …). The template CSS (`src/components/cv/cv.css`)
 * reads nothing else, so a per-block override is the same variables set again on that block.
 */
type CssVars = CSSProperties & Record<`--${string}`, string | number>

const SPACING: Record<CvSpacing, number> = { compact: 0.72, normal: 1, relaxed: 1.3 }

export const designVars = (design: CvDesign): CssVars => ({
  '--cv-accent': design.palette.accent,
  '--cv-bg': design.palette.background,
  '--cv-text': design.palette.text,
  '--cv-heading': design.palette.heading,
  '--cv-muted': design.palette.muted,
  '--cv-side-bg': design.palette.sidebarBackground,
  '--cv-side-text': design.palette.sidebarText,
  '--cv-font-heading': cvFontStack(design.headingFont),
  '--cv-font-body': cvFontStack(design.bodyFont),
  '--cv-scale': design.fontScale,
  '--cv-lh': design.lineHeight,
  '--cv-gap': SPACING[design.spacing],
})

/** A block's overrides, as the variables they replace. Empty when it inherits everything. */
export const blockStyleVars = (style: BlockStyle): CssVars => {
  const vars: CssVars = {}
  if (style.background) {
    vars['--cv-block-bg'] = style.background
    vars.background = style.background
  }
  if (style.text) {
    vars['--cv-text'] = style.text
    vars['--cv-muted'] = style.text
    vars['--cv-side-text'] = style.text
    vars.color = style.text
  }
  if (style.heading) {
    vars['--cv-heading'] = style.heading
    vars['--cv-accent'] = style.heading
  }
  if (style.font) {
    vars['--cv-font-heading'] = cvFontStack(style.font)
    vars['--cv-font-body'] = cvFontStack(style.font)
  }
  return vars
}

export const hasBlockStyle = (style: BlockStyle): boolean =>
  Boolean(style.background || style.text || style.heading || style.font)

/** Main and side columns for a template. A single-column template puts everything in main. */
export const splitSections = (
  design: CvDesign,
  sections: CvSection[],
  { includeHidden }: { includeHidden: boolean }
): { main: CvSection[]; side: CvSection[] } => {
  const visible = includeHidden ? sections : sections.filter((section) => !section.hidden)
  const layout = TEMPLATES[design.templateId].layout
  if (layout === 'single') return { main: visible, side: [] }

  const isSide = (section: CvSection): boolean => {
    if (section.column === 'main') return false
    if (section.column === 'side') return true
    if (layout === 'split') return visible.indexOf(section) % 2 === 1
    return SECTION_META[section.type].prefersSide
  }
  return { main: visible.filter((section) => !isSide(section)), side: visible.filter(isSide) }
}

/** Whether a template has a second column a section can be pinned to. */
export const hasColumns = (design: CvDesign): boolean => TEMPLATES[design.templateId].layout !== 'single'

/** Initials for an empty photo slot: "Անի Հովհաննիսյան" → "ԱՀ". */
export const initialsOf = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
