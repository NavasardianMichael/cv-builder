import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Actions, SkillsListSlice } from './types'

const initialState: SkillsListSlice = {
  byId: {},
  allIds: []
}

export const SkillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    setSkillsList: (_, action: PayloadAction<Actions['setSkillsList']>) => {
      return action.payload
    },
  },
})

export const { setSkillsList } = SkillsSlice.actions

export const skillsReducer = SkillsSlice.reducer