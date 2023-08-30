import { FC } from 'react'
import { PropsWithOptionalChildren } from 'shared/types/commons'
import styles from './main.module.css'

type Props = {
  title: string
}

export const Section: FC<PropsWithOptionalChildren<Props>> = ({ title, children }) => {
  return (
    <div className={styles.section}>
        <h3 className={styles.title}>
          {title}
        </h3>
        <div className={styles.content}>
          {children}
        </div>
    </div>
  )
}