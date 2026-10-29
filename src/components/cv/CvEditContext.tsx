'use client'

import { createContext, type ReactNode, useContext } from 'react'
import type { CvEditorActions, CvEntry, CvSection, CvTag } from '@store/cvs/single/types'

/**
 * What turns a rendered CV into an editable one. Absent (null) everywhere a CV is only shown
 * — template previews, thumbnails, the PDF render — so those never carry an editor.
 *
 * The CV components own the markup; the editor owns every control around it. The slots below
 * are how the editor puts its toolbars into the CV without the CV importing the editor.
 */
export type CvEditApi = {
  actions: CvEditorActions
  selectedBlock: string | null
  sectionToolbar: (section: CvSection, index: number, count: number) => ReactNode
  basicsToolbar: () => ReactNode
  entryToolbar: (section: CvSection, entry: CvEntry, index: number) => ReactNode
  tagRemove: (section: CvSection, tag: CvTag) => ReactNode
  addItemButton: (section: CvSection) => ReactNode
  photoEditor: (photo: string | null, initials: string) => ReactNode
}

const CvEditContext = createContext<CvEditApi | null>(null)

export const CvEditProvider = CvEditContext.Provider

export const useCvEdit = (): CvEditApi | null => useContext(CvEditContext)
