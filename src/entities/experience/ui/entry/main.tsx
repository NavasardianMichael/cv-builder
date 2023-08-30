import { FC } from 'react'
import { Heading } from '../heading/main'
import { Dates } from '../dates/main'
import { Description } from '../description/main'
import { Experience as ExperienceModel } from 'entities/experience/model/types'
import styles from './main.module.css'

export type Props = ExperienceModel

export const Experience: FC<Props> = (props) => {
  return (
    <div className={styles.experience}>
      <Heading company={props.company} position={props.position} />
      <Dates dates={props.dates}  />
      <Description description={props.description} />
    </div>
  )
}