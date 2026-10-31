import type { CvDocument } from '@store/cvs/single/types'
import { LEGACY_CONTACT_TYPES } from '@constants/contacts'
import { newContact } from './cvFactory'
import { reportError } from './reportError'

/**
 * A guest's CV, kept in this browser until they sign in — then the editor imports it as a
 * server CV and clears it. One draft per browser: a guest who starts another template is
 * asked before the old one is replaced (`/editor/new`).
 *
 * Every access is wrapped: storage can be full, disabled, or throw in a private window, and
 * none of that may break the editor — the draft simply is not kept.
 */
const KEY = 'rezyume:draft:v1'

type StoredDraft = { doc: CvDocument; savedAt: string }

type LegacyBasics = Partial<Record<(typeof LEGACY_CONTACT_TYPES)[number], unknown>>

/**
 * A draft saved before contacts became a list has the five fixed fields instead; they become
 * five contacts, as the API does for saved CVs (`coerceContent`).
 */
const withContacts = (doc: CvDocument): CvDocument => {
  const basics = doc.content.basics as CvDocument['content']['basics'] & LegacyBasics
  if (Array.isArray(basics.contacts)) return doc
  const contacts = LEGACY_CONTACT_TYPES.map((type) => {
    const value = basics[type]
    return newContact(type, typeof value === 'string' ? value : '')
  })
  const { fullName, headline, photo, style } = basics
  return { ...doc, content: { ...doc.content, basics: { fullName, headline, contacts, photo, style } } }
}

export const readLocalDraft = (): CvDocument | null => {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredDraft>
    const doc = parsed.doc
    if (!doc?.content?.basics || !Array.isArray(doc.content.sections) || !doc.design?.templateId) return null
    return withContacts(doc)
  } catch (error) {
    reportError(error, 'localDraft:read')
    return null
  }
}

/** False when the browser refused (quota, privacy mode); the editor shows it as unsaved. */
export const writeLocalDraft = (doc: CvDocument): boolean => {
  try {
    const value: StoredDraft = { doc, savedAt: new Date().toISOString() }
    window.localStorage.setItem(KEY, JSON.stringify(value))
    return true
  } catch (error) {
    reportError(error, 'localDraft:write')
    return false
  }
}

export const clearLocalDraft = (): void => {
  try {
    window.localStorage.removeItem(KEY)
  } catch (error) {
    reportError(error, 'localDraft:clear')
  }
}
