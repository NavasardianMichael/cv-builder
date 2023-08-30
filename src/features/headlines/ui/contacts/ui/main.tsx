import { FC } from 'react'
import { contactsMock } from '../model/mock'
import styles from './main.module.css'
import { ContactItem } from 'entities/contact-item'

type Props = {}

export const Contacts: FC<Props> = ({  }) => {
  return (
    <div className={styles.contact}>
      {
        contactsMock.allIds.map(contactId => {
          const props = contactsMock.byId[contactId] 
          
          return (
            <ContactItem key={contactId} {...props} />
          )
        })
      }
    </div>
  )
}