import { FC } from 'react'
import styles from './main.module.css'

type Props = {

}

export const Bio: FC<Props> = ({  }) => {
  return (
    <p className={styles.bio}>
      I am a Project Manager, currently working at Geeglo. I help companies build products from zero to one. This is a brief description about you. Write some details about yourself, and make it meaningful. Maximum 3 lines of text.
    </p>
  )
}