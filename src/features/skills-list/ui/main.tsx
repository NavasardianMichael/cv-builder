import { FC } from 'react'
import { SectionComponentProps } from 'shared/types/sections'
import styles from './main.module.css'

type Props = SectionComponentProps<'skills'>

export const Skills: FC<Props> = ({  }) => {
  return (
    <div className={styles.skills}>
      <div>
        Skills
      </div>
    </div>
  )
}