import { FC } from 'react'
import { ExperienceItem } from 'entities/experience-item/model/types'
import styles from './main.module.css'

type Props = Pick<ExperienceItem, 'description'>

export const Description: FC<Props> = ({ description }) => {

  if(!description) return null;

  return (
    <span className={styles.description}>
      {description}
    </span>
  )
}