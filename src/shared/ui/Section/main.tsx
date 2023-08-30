import { FC } from 'react'
import styles from './main.module.css'
import { PropsWithOptionalChildren } from 'shared/types/commons'
import { SECTION } from 'widgets/CV/types/sections'

type Props = {
  title: string
  templateStyles: SECTION['styles']
}

export const Section: FC<PropsWithOptionalChildren<Props>> = ({ title, templateStyles, children }) => {
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