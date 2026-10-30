import type { CvContent } from '@store/cvs/single/types'
import { emptyStyle } from './cvFactory'

/**
 * The content the free black-and-white PDF prints (with `BASIC_DESIGN`): every block
 * override and the photo dropped. Twin of `basicContent` in `server/src/services/basicCv.ts`.
 */
export const basicContent = (content: CvContent): CvContent => ({
  basics: { ...content.basics, photo: null, style: emptyStyle() },
  sections: content.sections.map((section) => ({ ...section, style: emptyStyle() })),
})
