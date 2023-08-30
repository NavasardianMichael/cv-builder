import { FC } from 'react'
import { HeadlinesSlice } from 'features/headlines/model/types'
import styles from './main.module.css'

type Props = Pick<HeadlinesSlice, 'bio'>

export const Bio: FC<Props> = ({ bio }) => {
  return (
    <p className={styles.bio}>
      {bio}
    </p>
  )
}