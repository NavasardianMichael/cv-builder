import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Actions, HeadlinesSlice } from './types'
import { mock } from './mock'

// const initialState: HeadlinesSlice = {
//   fullName: '',
//   bio: '',
//   contacts: {
//     byId: {},
//     allIds: []
//   }
// }

const initialState = mock

export const headlinesSlice = createSlice({
  name: 'headlines',
  initialState,
  reducers: {
    setHeadlines: (state, action: PayloadAction<Actions['setHeadlines']>) => {
      return {
        ...state,
        ...action.payload
      }
    },
  },
})

export const { setHeadlines } = headlinesSlice.actions

export const headlinesReducer = headlinesSlice.reducer