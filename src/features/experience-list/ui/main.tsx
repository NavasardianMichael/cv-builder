import { FC } from 'react'
import { ExperienceItem } from 'entities/experience-item'
import { experienceMock } from '../model/mock'
import { SectionComponentProps } from 'shared/types/sections'
import styles from './main.module.css'

type Props = SectionComponentProps<'experience'>

export const Experience: FC<Props> = ({  }) => {
  return (
    <div className={styles.experience}>
      {
        experienceMock.allIds.map(experienceId => {
          const props = experienceMock.byId[experienceId] 
          
          return (
            <ExperienceItem key={experienceId} {...props} />
          )
        })
      }
    </div>
  )
}