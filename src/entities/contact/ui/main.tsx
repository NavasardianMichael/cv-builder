import { FC } from 'react'
import { getAnchorRef } from '../helpers/link'
import { Contact as ContactModel } from '../model/types'
import styles from './main.module.css'

type Props = ContactModel

export const Contact: FC<Props> = ({ name, link }) => {
  return (
    <a 
      href={getAnchorRef(link)} 
      target='_blank' 
      className={styles.contactItem}
      title={name}
    >
      {name}
    </a>
  )
}