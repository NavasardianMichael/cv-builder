import { FC } from 'react'
import { getAnchorRef } from '../helpers/link'
import styles from './main.module.css'
import { Contact } from '../model/types'

type Props = Contact

export const ContactItem: FC<Props> = ({ name, link }) => {
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