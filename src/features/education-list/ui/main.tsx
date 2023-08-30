import { FC } from 'react'
import { EducationListSlice } from '../model/types'
import { Education } from 'entities/education'
import styles from './main.module.css'

type Props = {
  data: EducationListSlice
}

export const EducationList: FC<Props> = ({ data }) => {
  return (
    <div className={styles.educationList}>
      {
        data.allIds.map(educationId => {
          const props = data.byId[educationId] 
          
          return <Education key={educationId} {...props} />
        })
      }      
    </div>
  )
}