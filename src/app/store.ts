import { configureStore } from '@reduxjs/toolkit'
import { headlinesReducer } from 'features/headlines/model/slice'
import { experienceReducer } from 'features/experience-list/model/slice'
import { educationReducer } from 'features/education-list/model/slice'
import { skillsReducer } from 'features/skills-list/model/slice'

export const store = configureStore({
  reducer: {
    headlines: headlinesReducer,
    experience: experienceReducer,
    education: educationReducer,
    skills: skillsReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch