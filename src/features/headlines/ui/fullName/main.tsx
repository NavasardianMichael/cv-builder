import { FC } from 'react'
import styles from './main.module.css'

type Props = {
}

export const FullName: FC<Props> = ({  }) => {
  return (
    <h3 className={styles.title}>
      Full Name
    </h3>
  )
}