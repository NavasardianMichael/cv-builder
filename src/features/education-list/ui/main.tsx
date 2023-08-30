import { FC } from 'react'
import { SectionComponentProps } from 'shared/types/sections'
import styles from './main.module.css'

type Props = SectionComponentProps<'education'>

export const Education: FC<Props> = ({  }) => {
  return (
    <div className={styles.education}>
      <div>
        Education
      </div>
    </div>
  )
}