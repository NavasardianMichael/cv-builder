import { FC } from 'react'
import { Heading } from '../heading/main'
import { Dates } from '../dates/main'
import { Description } from '../description/main'
import { ExperienceItem as ExperienceItemTypes } from 'entities/experience-item/model/types'
import styles from './main.module.css'

export type Props = ExperienceItemTypes

export const ExperienceItem: FC<Props> = (props) => {
  return (
    <div className={styles.experienceItem}>
      <Heading company={props.company} position={props.position} />
      <Dates dates={props.dates}  />
      <Description description={props.description} />
    </div>
  )
}