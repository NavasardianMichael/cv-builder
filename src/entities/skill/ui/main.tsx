import { FC } from 'react'
import { Skill as SkillModel } from '../model/types'
import styles from './main.module.css'

export type Props = SkillModel

export const Skill: FC<Props> = ({ name }) => {
  return (
    <span className={styles.skill}>
      {name}
    </span>
  )
}