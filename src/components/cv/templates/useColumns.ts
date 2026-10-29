'use client'

import type { CvContent, CvDesign, CvSection } from '@store/cvs/single/types'
import { splitSections } from '@helpers/cvStyle'
import { useCvEdit } from '../CvEditContext'

/** A template's main and side sections; the editor keeps hidden ones (shown dimmed). */
export const useColumns = (content: CvContent, design: CvDesign): { main: CvSection[]; side: CvSection[] } => {
  const edit = useCvEdit()
  return splitSections(design, content.sections, { includeHidden: Boolean(edit) })
}
