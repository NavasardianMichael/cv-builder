import { FC } from 'react'
import { SkillsListSlice } from '../model/types'
import { Skill } from 'entities/skill'
import styles from './main.module.css'

type Props = {
  data: SkillsListSlice
}

export const Skills: FC<Props> = ({ data }) => {
  return (
    <div className={styles.skills}>
      {
        data.allIds.map(skillId => {
          const props = data.byId[skillId]

          return (
            <Skill key={skillId} {...props} />
          )
        })
      }
    </div>
  )
}