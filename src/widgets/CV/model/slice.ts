import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Actions, TemplatesSlice } from './types'
import { CV_TEMPLATE_TYPES } from '../constants/templates'

const initialState: TemplatesSlice = {
  selectedTemplate: CV_TEMPLATE_TYPES.variant1
}

export const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setTemplates: (_, action: PayloadAction<Actions['setTemplates']>) => {
      return action.payload
    },
  },
})

export const { setTemplates } = templatesSlice.actions

export const templatesReducer = templatesSlice.reducer