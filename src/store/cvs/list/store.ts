import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { deleteCvAPI, duplicateCvAPI, getCvsAPI } from '@api/cvs/main'
import { appendSelectors } from '@store/appendSelectors'
import { processError } from '@helpers/error'
import type { CvsListActions, CvsListState } from './types'

const initialState: CvsListState = {
  list: { byId: {}, allIds: [] },
  isLoaded: false,
  isPending: false,
  error: null,
}

/** The dashboard's list. Rejections are rethrown to the caller that shows them. */
export const useCvsListStoreBase = create<CvsListState & CvsListActions>()(
  immer(
    combine(
      initialState,
      (set): CvsListActions => ({
        getCvs: async () => {
          set({ isPending: true, error: null })
          try {
            const cvs = await getCvsAPI()
            set((state) => {
              state.list = {
                byId: Object.fromEntries(cvs.map((cv) => [cv.id, cv])),
                allIds: cvs.map((cv) => cv.id),
              }
              state.isLoaded = true
            })
          } catch (error) {
            set({ error: processError(error) })
            throw error
          } finally {
            set({ isPending: false })
          }
        },
        duplicateCv: async (id) => {
          const copy = await duplicateCvAPI({ id })
          set((state) => {
            state.list.byId[copy.id] = copy
            state.list.allIds.unshift(copy.id)
          })
          return copy
        },
        deleteCv: async (id) => {
          await deleteCvAPI({ id })
          set((state) => {
            delete state.list.byId[id]
            state.list.allIds = state.list.allIds.filter((existing) => existing !== id)
          })
        },
      })
    )
  )
)

export const useCvsListStore = appendSelectors(useCvsListStoreBase)
