import { FC } from 'react'
import { Contact } from 'entities/contact'
import { HeadlinesSlice } from 'features/headlines/model/types'
import styles from './main.module.css'
import { combineClassNames } from 'shared/functions/commons'
import { useAppSelector } from 'shared/hooks/useAppSelector'
import { selectTemplates } from 'widgets/CV/model/selectors'

type Props = {
  data: HeadlinesSlice['contacts']
}

export const Contacts: FC<Props> = ({ data }) => {

  const { selectedTemplate } = useAppSelector(selectTemplates)

  return (
    <div className={combineClassNames(styles.contact, styles[selectedTemplate])}>
      {
        data.allIds.map(contactId => {
          const props = data.byId[contactId]
          
          return <Contact key={contactId} {...props} />
        })
      }
    </div>
  )
}