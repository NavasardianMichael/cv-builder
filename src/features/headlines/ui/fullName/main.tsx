import { FC } from 'react'
import styles from './main.module.css'
import { HeadlinesSlice } from 'features/headlines/model/types'

type Props = Pick<HeadlinesSlice, 'fullName'>

export const FullName: FC<Props> = ({ fullName }) => {
  return (
    <h3 className={styles.title}>
      {fullName}
    </h3>
  )
}