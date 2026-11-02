import type { CvContent, CvDesign } from '@store/cvs/single/types'
import { BASIC_DESIGN } from '@constants/templates'
import { emptyStyle } from './cvFactory'

/**
 * The content the free black-and-white PDF prints (with `BASIC_DESIGN`): every block
 * override and the photo dropped. Twin of `basicContent` in `server/src/services/basicCv.ts`.
 */
export const basicContent = (content: CvContent): CvContent => ({
  basics: { ...content.basics, photo: null, style: emptyStyle() },
  sections: content.sections.map((section) => ({ ...section, style: emptyStyle() })),
})

/**
 * Whether a CV still looks like the free PDF: its layout, fonts and colours. Spacing, sizes
 * and the like do not count — they change nothing about which design it is.
 */
export const isBasicDesign = (design: CvDesign): boolean =>
  design.templateId === BASIC_DESIGN.templateId &&
  design.headingFont === BASIC_DESIGN.headingFont &&
  design.bodyFont === BASIC_DESIGN.bodyFont &&
  (Object.keys(BASIC_DESIGN.palette) as (keyof CvDesign['palette'])[]).every((key) => design.palette[key] === BASIC_DESIGN.palette[key])
