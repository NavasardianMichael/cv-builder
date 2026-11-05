import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { appendSelectors } from '@store/appendSelectors'
import type { LeaveGuardActions, LeaveGuardState } from './types'

const initialState: LeaveGuardState = { guards: [], question: null, leaving: false }

/** Registered by `useLeaveGuard`, enforced by `LeaveGuard`. */
export const useLeaveGuardStoreBase = create<LeaveGuardState & LeaveGuardActions>()(
  immer(
    combine(initialState, (set, get) => ({
      setGuard: (id: string, active: boolean) => {
        const { question } = get()
        set((state) => {
          state.guards = state.guards.filter((guard) => guard !== id)
          if (active) state.guards.push(id)
          // Nothing is guarded any more (the work was saved, the page was left): start afresh.
          if (!state.guards.length) {
            state.leaving = false
            state.question = null
          }
        })
        // Asked while there was unsaved work; it has been saved since, so the question is moot.
        if (question && !get().question) question.resolve(false)
      },

      ask: () => {
        const { guards, leaving, question } = get()
        if (leaving || !guards.length) return Promise.resolve(true)
        // Asked again while the dialog is up (a second Back): the newest question wins.
        question?.resolve(false)
        return new Promise<boolean>((resolve) => {
          set((state) => {
            state.question = { resolve }
          })
        })
      },

      answer: (leave: boolean) => {
        const { question } = get()
        set((state) => {
          state.question = null
          if (leave) state.leaving = true
        })
        question?.resolve(leave)
      },
    }))
  )
)

export const useLeaveGuardStore = appendSelectors(useLeaveGuardStoreBase)
