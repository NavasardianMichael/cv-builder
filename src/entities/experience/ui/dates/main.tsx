import { FC } from 'react'
import styles from './main.module.css'
import { Experience } from 'entities/experience/model/types'

type Props = Pick<Experience, 'dates'>

export const Dates: FC<Props> = ({ dates }) => {
  return (
    <div className={styles.dates}>
      <span>{dates.start}</span>
      &ndash;
      <span>{dates.end}</span>
    </div>
  )
}