import type { CvDocument } from '@store/cvs/single/types'
import { LEGACY_CONTACT_TYPES } from '@constants/contacts'
import { newContact, newId } from './cvFactory'
import { reportError } from './reportError'

/**
 * A guest's CVs, kept in this browser until they sign in — then the editor imports each one it
 * opens as a server CV and clears it. Any number of drafts, one storage key each, so starting
 * another template never touches the others and two tabs on two drafts never overwrite each
 * other. A draft's id (`draft-…`) is its editor URL: `/editor/draft-…`.
 *
 * Every access is wrapped: storage can be full, disabled, or throw in a private window, and
 * none of that may break the editor — the draft simply is not kept.
 */
const KEY_PREFIX = 'cv-builder:draft:v2:'
const DRAFT_ID_PREFIX = 'draft-'

/** The one draft a browser could hold before drafts had ids — its key, and its editor URL's id. */
const LEGACY_KEY = 'cv-builder:draft:v1'
export const LEGACY_DRAFT_ID = 'draft'

/** `edited` false: still the template as it was opened, so nothing of the guest's would be lost. */
type StoredDraft = { doc: CvDocument; savedAt: string; edited: boolean }

export type LocalDraft = StoredDraft & { id: string }

type LegacyBasics = Partial<Record<(typeof LEGACY_CONTACT_TYPES)[number], unknown>>

/** A guest's local CV rather than a server one (server ids are cuids). */
export const isDraftId = (id: string | null | undefined): id is string => !!id && id.startsWith(DRAFT_ID_PREFIX)

const keyOf = (id: string): string => `${KEY_PREFIX}${id}`

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

/** Null for anything that is not a draft this code can open. */
const parse = (raw: string | null): StoredDraft | null => {
  if (!raw) return null
  const parsed = JSON.parse(raw) as Partial<StoredDraft>
  const doc = parsed.doc
  if (!doc?.content?.basics || !Array.isArray(doc.content.sections) || !doc.design?.templateId) return null
  return {
    doc: withContacts(doc),
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    // A draft stored without the flag may hold the guest's work: keep it.
    edited: parsed.edited !== false,
  }
}

const draftKeys = (): string[] => {
  const keys: string[] = []
  for (let index = 0; index < window.localStorage.length; index++) {
    const key = window.localStorage.key(index)
    if (key?.startsWith(KEY_PREFIX)) keys.push(key)
  }
  return keys
}

/** The single draft of before becomes one of the many, under an id of its own. */
const migrateLegacy = (): void => {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (raw === null) return
    const draft = parse(raw)
    if (draft) window.localStorage.setItem(keyOf(`${DRAFT_ID_PREFIX}${newId()}`), JSON.stringify(draft))
    window.localStorage.removeItem(LEGACY_KEY)
  } catch (error) {
    reportError(error, 'localDraft:migrate')
  }
}

/** This browser's drafts, the last saved first. */
export const listLocalDrafts = (): LocalDraft[] => {
  migrateLegacy()
  try {
    return draftKeys()
      .flatMap((key) => {
        const draft = parse(window.localStorage.getItem(key))
        return draft ? [{ ...draft, id: key.slice(KEY_PREFIX.length) }] : []
      })
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  } catch (error) {
    reportError(error, 'localDraft:list')
    return []
  }
}

export const readLocalDraft = (id: string): CvDocument | null => {
  migrateLegacy()
  try {
    return parse(window.localStorage.getItem(keyOf(id)))?.doc ?? null
  } catch (error) {
    reportError(error, 'localDraft:read')
    return null
  }
}

/** Cheap enough to call on every render (no parsing): whether this browser holds a draft. */
export const hasLocalDrafts = (): boolean => {
  try {
    return window.localStorage.getItem(LEGACY_KEY) !== null || draftKeys().length > 0
  } catch {
    return false
  }
}

const store = (id: string, doc: CvDocument, edited: boolean): boolean => {
  try {
    const value: StoredDraft = { doc, savedAt: new Date().toISOString(), edited }
    window.localStorage.setItem(keyOf(id), JSON.stringify(value))
    return true
  } catch (error) {
    reportError(error, 'localDraft:write')
    return false
  }
}

/**
 * Keeps a new draft and returns its id; null when the browser refused (site data blocked, or
 * full). Drafts never edited go first: they are only templates as they were opened, and would
 * otherwise pile up on the dashboard, one per template the guest looked into.
 */
export const startLocalDraft = (doc: CvDocument): string | null => {
  for (const draft of listLocalDrafts()) {
    if (!draft.edited) clearLocalDraft(draft.id)
  }
  const id = `${DRAFT_ID_PREFIX}${newId()}`
  return store(id, doc, false) ? id : null
}

/** Autosave's write. False when the browser refused (quota, privacy mode); the editor shows it as unsaved. */
export const writeLocalDraft = (id: string, doc: CvDocument): boolean => store(id, doc, true)

export const clearLocalDraft = (id: string): void => {
  try {
    window.localStorage.removeItem(keyOf(id))
  } catch (error) {
    reportError(error, 'localDraft:clear')
  }
}
