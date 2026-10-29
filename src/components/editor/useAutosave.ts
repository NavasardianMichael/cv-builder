'use client'

import { useEffect } from 'react'
import { updateCvAPI } from '@api/cvs/main'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { writeLocalDraft } from '@helpers/localDraft'
import { reportError } from '@helpers/reportError'

const DEBOUNCE_MS = 900
const RETRY_MS = 5000

/** Saves run one at a time, so a slow save can never land after (and undo) a newer one. */
let inFlight: Promise<void> = Promise.resolve()

const saveCurrent = (): Promise<void> => {
  inFlight = inFlight.then(async () => {
    const { cvId, doc, saveStatus, setSaveStatus, setPaidAt } = useCvEditorStoreBase.getState()
    if (!cvId || !doc || saveStatus === 'saved') return

    if (cvId === DRAFT_ID) {
      setSaveStatus(writeLocalDraft(doc) ? 'saved' : 'error')
      return
    }

    setSaveStatus('saving')
    try {
      const result = await updateCvAPI({ id: cvId, title: doc.title, content: doc.content, design: doc.design })
      setPaidAt(result.paidAt)
      // An edit made while the request was out leaves the document newer than what was sent.
      setSaveStatus(useCvEditorStoreBase.getState().doc === doc ? 'saved' : 'dirty')
    } catch (error) {
      reportError(error, 'editor:autosave')
      setSaveStatus('error')
    }
  })
  return inFlight
}

/** Saves now, if anything is unsaved — before a checkout or a download. */
export const flushSave = async (): Promise<boolean> => {
  await saveCurrent()
  return useCvEditorStoreBase.getState().saveStatus === 'saved'
}

/**
 * Debounced autosave of the open document: to the API for a saved CV, to localStorage for a
 * guest's draft. A failed save retries on its own; leaving with unsaved work asks first.
 */
export const useAutosave = (): void => {
  const doc = useCvEditorStore.use.doc()
  const saveStatus = useCvEditorStore.use.saveStatus()
  const setSaveStatus = useCvEditorStore.use.setSaveStatus()

  useEffect(() => {
    if (saveStatus !== 'dirty') return
    const timer = setTimeout(() => void saveCurrent(), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [doc, saveStatus])

  useEffect(() => {
    if (saveStatus !== 'error') return
    const timer = setTimeout(() => setSaveStatus('dirty'), RETRY_MS)
    return () => clearTimeout(timer)
  }, [saveStatus, setSaveStatus])

  useEffect(() => {
    if (saveStatus === 'saved') return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [saveStatus])
}
