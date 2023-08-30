import { FC } from 'react'
import { CV_TEMPLATES } from './constants/templates'
import { SECTIONS } from './constants/sections'
import { Section } from 'shared/ui/Section/main'
import { SECTION } from './types/sections'
import styles from './main.module.css'

type Props = {

}

export const CV: FC<Props> = ({  }) => {
  const { id, name, sections } = CV_TEMPLATES.byId.variant1
  return (
    <div className={styles.cv}>
      <h2>{name}</h2>
      {
        SECTIONS.allIds.map(sectionId => {
          const { id, component: Component } = SECTIONS.byId[sectionId]

          return (
            <Section key={id} title={sectionId} templateStyles={sections[sectionId].styles}>
              <Component templateStyles={sections[sectionId].styles} />
            </Section>
          )
        })
      }
    </div>
  )
}