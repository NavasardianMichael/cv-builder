import { FC } from 'react'
import { ExperienceItem } from 'entities/experience-item/model/types'
import styles from './main.module.css'

type Props = Pick<ExperienceItem, 'dates'>

export const Dates: FC<Props> = ({ dates }) => {
  return (
    <div className={styles.dates}>
      <span>{dates.start}</span>
      &ndash;
      <span>{dates.end}</span>
    </div>
  )
}