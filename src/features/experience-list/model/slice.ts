import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { Actions, ExperienceListSlice } from './types'

const initialState: ExperienceListSlice = {
  byId: {},
  allIds: []
}

export const experienceSlice = createSlice({
  name: 'experience',
  initialState,
  reducers: {
    setExperienceList: (_, action: PayloadAction<Actions['setExperienceList']>) => {
      return action.payload
    },
  },
})

export const { setExperienceList } = experienceSlice.actions

export const experienceReducer = experienceSlice.reducer