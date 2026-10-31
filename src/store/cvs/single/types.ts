import type { StateCommonProps } from '@interfaces/store'
import type { ContactType } from '@constants/contacts'
import type { FontSlug } from '@constants/fonts'
import type { SectionType } from '@constants/sections'
import type { TemplateId } from '@constants/templates'

/**
 * The CV document. Twin of `server/src/services/cvDocument.ts`, which coerces every write to
 * exactly this shape — a field added here is dropped by the API until it is added there.
 */

/** A per-block override of the design, set from the block's toolbar. Null = inherit. */
export type BlockStyle = {
  background: string | null
  text: string | null
  heading: string | null
  font: FontSlug | null
}

export type CvEntry = {
  id: string
  title: string
  subtitle: string
  /** Free text ("2019 – այժմ"): Armenian CVs write dates every which way, and that is fine. */
  period: string
  location: string
  description: string
  /** Makes the title a link (a project, a certificate, a company). '' for none. */
  url: string
}

export type CvTag = {
  id: string
  name: string
  /** 0-5, or null for a tag without a level (interests). */
  level: number | null
}

/** `auto` follows the template's own placement; `main`/`side` pin it in two-column templates. */
export type SectionColumn = 'auto' | 'main' | 'side'

/** Every section carries all three bodies; its type's `kind` decides which one renders. */
export type CvSection = {
  id: string
  type: SectionType
  title: string
  hidden: boolean
  column: SectionColumn
  text: string
  entries: CvEntry[]
  tags: CvTag[]
  style: BlockStyle
}

/** One line of the contacts row; its type picks the icon and, unless `url` is set, the link. */
export type CvContact = {
  id: string
  type: ContactType
  /** Shown as typed: "091 12 34 56" stays so, its link is `tel:+37491123456` (`helpers/contactLink`). */
  value: string
  /** A link attached by hand, which beats the one worked out from the type. '' for none. */
  url: string
}

export type CvBasics = {
  fullName: string
  headline: string
  /** In the user's order; empty ones show only in the editor. */
  contacts: CvContact[]
  /** A small base64 JPEG data URL, or null. */
  photo: string | null
  style: BlockStyle
}

export type CvContent = {
  basics: CvBasics
  sections: CvSection[]
}

export type CvPalette = {
  accent: string
  background: string
  text: string
  heading: string
  muted: string
  sidebarBackground: string
  sidebarText: string
}

export type CvSpacing = 'compact' | 'normal' | 'relaxed'
export type CvPhotoShape = 'circle' | 'rounded' | 'square'
export type CvLevelStyle = 'dots' | 'bars' | 'text' | 'none'

export type CvDesign = {
  templateId: TemplateId
  palette: CvPalette
  headingFont: FontSlug
  bodyFont: FontSlug
  fontScale: number
  lineHeight: number
  spacing: CvSpacing
  photoShape: CvPhotoShape
  showPhoto: boolean
  showIcons: boolean
  levelStyle: CvLevelStyle
}

/** What is edited and saved. */
export type CvDocument = {
  title: string
  content: CvContent
  design: CvDesign
}

/** A saved CV as the API returns it. */
export type Cv = CvDocument & {
  id: string
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

/** `draft` is a guest's CV, kept in localStorage until they sign in. */
export const DRAFT_ID = 'draft'

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error'

export type CvEditorState = {
  /** A server id, or `DRAFT_ID`. Null until a document is loaded. */
  cvId: string | null
  doc: CvDocument | null
  paidAt: string | null
  saveStatus: SaveStatus
  /** Undo/redo stacks of whole documents — cheap, since immer shares unchanged subtrees. */
  past: CvDocument[]
  future: CvDocument[]
  /** Consecutive edits to the same field within a second become one undo step. */
  lastEditKey: string | null
  lastEditAt: number
  /** The block whose style toolbar is open: `basics`, a section id, or null. */
  selectedBlock: string | null
} & StateCommonProps

export type EntryField = keyof Omit<CvEntry, 'id'>
export type BasicsTextField = 'fullName' | 'headline'
export type MoveDirection = -1 | 1

export type CvEditorActions = {
  loadDocument: (payload: { cvId: string; doc: CvDocument; paidAt: string | null }) => void
  reset: () => void
  setSaveStatus: (status: SaveStatus) => void
  setPaidAt: (paidAt: string | null) => void
  setCvId: (cvId: string) => void
  undo: () => void
  redo: () => void
  setTitle: (title: string) => void
  setBasicsField: (field: BasicsTextField, value: string) => void
  setPhoto: (photo: string | null) => void
  setBasicsStyle: (style: Partial<BlockStyle>) => void
  addContact: (type: ContactType) => void
  setContactField: (contactId: string, field: 'value' | 'url', value: string) => void
  removeContact: (contactId: string) => void
  setSectionField: (sectionId: string, field: 'title' | 'text', value: string) => void
  setSectionStyle: (sectionId: string, style: Partial<BlockStyle>) => void
  setSectionColumn: (sectionId: string, column: SectionColumn) => void
  toggleSectionHidden: (sectionId: string) => void
  moveSection: (sectionId: string, direction: MoveDirection) => void
  removeSection: (sectionId: string) => void
  addSection: (type: SectionType) => void
  addEntry: (sectionId: string) => void
  setEntryField: (sectionId: string, entryId: string, field: EntryField, value: string) => void
  moveEntry: (sectionId: string, entryId: string, direction: MoveDirection) => void
  duplicateEntry: (sectionId: string, entryId: string) => void
  removeEntry: (sectionId: string, entryId: string) => void
  addTag: (sectionId: string) => void
  setTagName: (sectionId: string, tagId: string, name: string) => void
  setTagLevel: (sectionId: string, tagId: string, level: number | null) => void
  removeTag: (sectionId: string, tagId: string) => void
  setDesign: (design: Partial<Omit<CvDesign, 'palette'>>) => void
  setPalette: (palette: Partial<CvPalette>) => void
  applyTemplate: (templateId: TemplateId) => void
  resetBlockStyles: () => void
  selectBlock: (blockId: string | null) => void
}
