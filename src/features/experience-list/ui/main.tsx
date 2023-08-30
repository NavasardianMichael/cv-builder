import { FC } from 'react'
import { ExperienceListSlice } from '../model/types'
import { Experience } from 'entities/experience'
import styles from './main.module.css'

type Props = {
  data: ExperienceListSlice
}

export const ExperienceList: FC<Props> = ({ data }) => {
  return (
    <div className={styles.experience}>
      {
        data.allIds.map(experienceId => {
          const props = data.byId[experienceId] 
          
          return (
            <Experience key={experienceId} {...props} />
          )
        })
      }
    </div>
  )
}