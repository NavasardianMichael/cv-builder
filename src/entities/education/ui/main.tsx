import { FC } from 'react'
import { Education as EducationModel } from '../model/types'
import styles from './main.module.css'

export type Props = EducationModel

export const Education: FC<Props> = ({ institution: { name } }) => {
  return (
    <span className={styles.education}>
      {name}
    </span>
  )
}