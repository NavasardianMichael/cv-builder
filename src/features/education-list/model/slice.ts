import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Actions, EducationListSlice } from './types'

const initialState: EducationListSlice = {
  byId: {},
  allIds: []
}

export const educationSlice = createSlice({
  name: 'education',
  initialState,
  reducers: {
    setEducationList: (_, action: PayloadAction<Actions['setEducationList']>) => {
      return action.payload
    },
  },
})

export const { setEducationList } = educationSlice.actions

export const educationReducer = educationSlice.reducer