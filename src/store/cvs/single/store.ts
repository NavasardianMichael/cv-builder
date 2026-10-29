import { type Draft, original } from 'immer'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import { templateDesign } from '@constants/templates'
import { emptyStyle, newEntry, newId, newSection, newTag } from '@helpers/cvFactory'
import type { CvDocument, CvEditorActions, CvEditorState, CvSection, MoveDirection } from './types'

/**
 * The CV open in the editor, with undo/redo.
 *
 * Every content or design change goes through `edit`, which records the document as it was
 * before. Typing fires an edit per keystroke, so edits with the same `key` (one field) less
 * than `COALESCE_MS` apart share one undo step — undo removes a word, not a letter.
 * Saving is not this store's job: `useAutosave` watches `doc` and reports back through
 * `setSaveStatus`.
 */
const HISTORY_LIMIT = 100
const COALESCE_MS = 1000

const initialState: CvEditorState = {
  cvId: null,
  doc: null,
  paidAt: null,
  saveStatus: 'saved',
  past: [],
  future: [],
  lastEditKey: null,
  lastEditAt: 0,
  selectedBlock: null,
  isPending: false,
  error: null,
}

type EditorDraft = Draft<CvEditorState>

const edit = (state: EditorDraft, key: string | null, mutate: (doc: Draft<CvDocument>) => void): void => {
  if (!state.doc) return
  const now = Date.now()
  const coalesce = key !== null && key === state.lastEditKey && now - state.lastEditAt < COALESCE_MS
  if (!coalesce) {
    const before = original(state.doc)
    if (before) state.past.push(before)
    if (state.past.length > HISTORY_LIMIT) state.past.shift()
  }
  state.future = []
  state.lastEditKey = key
  state.lastEditAt = now
  mutate(state.doc)
  state.saveStatus = 'dirty'
}

const findSection = (doc: Draft<CvDocument>, sectionId: string): Draft<CvSection> | undefined =>
  doc.content.sections.find((section) => section.id === sectionId)

const move = <T>(items: T[], index: number, direction: MoveDirection): void => {
  const target = index + direction
  if (index < 0 || target < 0 || target >= items.length) return
  const [item] = items.splice(index, 1)
  items.splice(target, 0, item)
}

export const useCvEditorStoreBase = create<CvEditorState & CvEditorActions>()(
  immer(
    combine(
      initialState,
      (set): CvEditorActions => ({
        loadDocument: ({ cvId, doc, paidAt }) => {
          set((state) => ({ ...state, ...initialState, cvId, doc, paidAt }))
        },
        reset: () => {
          set((state) => ({ ...state, ...initialState }))
        },
        setSaveStatus: (saveStatus) => {
          set({ saveStatus })
        },
        setPaidAt: (paidAt) => {
          set({ paidAt })
        },
        setCvId: (cvId) => {
          set({ cvId })
        },
        undo: () => {
          set((state) => {
            const previous = state.past.pop()
            if (!previous || !state.doc) return
            const current = original(state.doc)
            if (current) state.future.push(current)
            state.doc = previous
            state.lastEditKey = null
            state.saveStatus = 'dirty'
          })
        },
        redo: () => {
          set((state) => {
            const next = state.future.pop()
            if (!next || !state.doc) return
            const current = original(state.doc)
            if (current) state.past.push(current)
            state.doc = next
            state.lastEditKey = null
            state.saveStatus = 'dirty'
          })
        },
        setTitle: (title) => {
          set((state) => edit(state, 'title', (doc) => void (doc.title = title)))
        },
        setBasicsField: (field, value) => {
          set((state) => edit(state, `basics.${field}`, (doc) => void (doc.content.basics[field] = value)))
        },
        setPhoto: (photo) => {
          set((state) => edit(state, null, (doc) => void (doc.content.basics.photo = photo)))
        },
        setBasicsStyle: (style) => {
          set((state) =>
            edit(state, 'basics.style', (doc) => {
              doc.content.basics.style = { ...doc.content.basics.style, ...style }
            })
          )
        },
        setSectionField: (sectionId, field, value) => {
          set((state) =>
            edit(state, `${sectionId}.${field}`, (doc) => {
              const section = findSection(doc, sectionId)
              if (section) section[field] = value
            })
          )
        },
        setSectionStyle: (sectionId, style) => {
          set((state) =>
            edit(state, `${sectionId}.style`, (doc) => {
              const section = findSection(doc, sectionId)
              if (section) section.style = { ...section.style, ...style }
            })
          )
        },
        setSectionColumn: (sectionId, column) => {
          set((state) =>
            edit(state, null, (doc) => {
              const section = findSection(doc, sectionId)
              if (section) section.column = column
            })
          )
        },
        toggleSectionHidden: (sectionId) => {
          set((state) =>
            edit(state, null, (doc) => {
              const section = findSection(doc, sectionId)
              if (section) section.hidden = !section.hidden
            })
          )
        },
        moveSection: (sectionId, direction) => {
          set((state) =>
            edit(state, null, (doc) => {
              move(doc.content.sections, doc.content.sections.findIndex((section) => section.id === sectionId), direction)
            })
          )
        },
        removeSection: (sectionId) => {
          set((state) => {
            edit(state, null, (doc) => {
              doc.content.sections = doc.content.sections.filter((section) => section.id !== sectionId)
            })
            if (state.selectedBlock === sectionId) state.selectedBlock = null
          })
        },
        addSection: (type) => {
          set((state) => {
            const section = newSection(type)
            edit(state, null, (doc) => void doc.content.sections.push(section))
            state.selectedBlock = section.id
          })
        },
        addEntry: (sectionId) => {
          set((state) =>
            edit(state, null, (doc) => {
              findSection(doc, sectionId)?.entries.push(newEntry())
            })
          )
        },
        setEntryField: (sectionId, entryId, field, value) => {
          set((state) =>
            edit(state, `${entryId}.${field}`, (doc) => {
              const entry = findSection(doc, sectionId)?.entries.find((item) => item.id === entryId)
              if (entry) entry[field] = value
            })
          )
        },
        moveEntry: (sectionId, entryId, direction) => {
          set((state) =>
            edit(state, null, (doc) => {
              const entries = findSection(doc, sectionId)?.entries
              if (entries) move(entries, entries.findIndex((item) => item.id === entryId), direction)
            })
          )
        },
        duplicateEntry: (sectionId, entryId) => {
          set((state) =>
            edit(state, null, (doc) => {
              const entries = findSection(doc, sectionId)?.entries
              const index = entries?.findIndex((item) => item.id === entryId) ?? -1
              if (entries && index >= 0) entries.splice(index + 1, 0, { ...entries[index], id: newId() })
            })
          )
        },
        removeEntry: (sectionId, entryId) => {
          set((state) =>
            edit(state, null, (doc) => {
              const section = findSection(doc, sectionId)
              if (section) section.entries = section.entries.filter((item) => item.id !== entryId)
            })
          )
        },
        addTag: (sectionId) => {
          set((state) =>
            edit(state, null, (doc) => {
              const section = findSection(doc, sectionId)
              const level = section?.tags.length ? section.tags[section.tags.length - 1].level : 3
              section?.tags.push(newTag('', level))
            })
          )
        },
        setTagName: (sectionId, tagId, name) => {
          set((state) =>
            edit(state, `${tagId}.name`, (doc) => {
              const tag = findSection(doc, sectionId)?.tags.find((item) => item.id === tagId)
              if (tag) tag.name = name
            })
          )
        },
        setTagLevel: (sectionId, tagId, level) => {
          set((state) =>
            edit(state, null, (doc) => {
              const tag = findSection(doc, sectionId)?.tags.find((item) => item.id === tagId)
              if (tag) tag.level = level
            })
          )
        },
        removeTag: (sectionId, tagId) => {
          set((state) =>
            edit(state, null, (doc) => {
              const section = findSection(doc, sectionId)
              if (section) section.tags = section.tags.filter((item) => item.id !== tagId)
            })
          )
        },
        setDesign: (design) => {
          set((state) =>
            edit(state, `design.${Object.keys(design).join(',')}`, (doc) => {
              doc.design = { ...doc.design, ...design }
            })
          )
        },
        setPalette: (palette) => {
          set((state) =>
            edit(state, `palette.${Object.keys(palette).join(',')}`, (doc) => {
              doc.design.palette = { ...doc.design.palette, ...palette }
            })
          )
        },
        /** The template's colours and fonts replace the current ones; content is untouched. */
        applyTemplate: (templateId) => {
          set((state) =>
            edit(state, null, (doc) => {
              doc.design = templateDesign(templateId)
            })
          )
        },
        resetBlockStyles: () => {
          set((state) =>
            edit(state, null, (doc) => {
              doc.content.basics.style = emptyStyle()
              for (const section of doc.content.sections) section.style = emptyStyle()
            })
          )
        },
        selectBlock: (blockId) => {
          set({ selectedBlock: blockId })
        },
      })
    )
  )
)

export const useCvEditorStore = appendSelectors(useCvEditorStoreBase)
