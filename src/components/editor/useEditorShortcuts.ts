'use client'

import { useEffect } from 'react'
import { useCvEditorStoreBase } from '@store/cvs/single/store'

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'))

/**
 * Ctrl/Cmd+Z and Ctrl/Cmd+Y (or Shift+Z) for the document's undo history. Inside a text
 * field the browser's own undo runs instead — it fires input events, so the store follows.
 */
export const useEditorShortcuts = (): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || isTyping(event.target)) return
      const key = event.key.toLowerCase()
      const { undo, redo } = useCvEditorStoreBase.getState()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
