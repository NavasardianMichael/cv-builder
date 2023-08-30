import { FC } from 'react'
import styles from './main.module.css'
import { ExperienceItem } from 'entities/experience-item/model/types'

type Props = Pick<ExperienceItem, 'company' | 'position'>

export const Heading: FC<Props> = ({ company, position }) => {
  return (
    <div className={styles.heading}>
      {
        company.link ?
        <a className={styles.company} href={company.link} target='_blank' title={company.name}>
          {company.name}
        </a> :
        <p className={styles.company}>
          {company.name}
        </p>
      }
      &#8226;
      <span className={styles.position}>
        {position}
      </span>
    </div>
  )
}