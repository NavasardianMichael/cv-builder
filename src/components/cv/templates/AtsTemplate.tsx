'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** Harvard-style: one plain column, ruled uppercase headings, contacts on one line. */
export const AtsTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <NameBlock basics={content.basics} />
        <ContactList basics={content.basics} design={design} />
        <PhotoBlock basics={content.basics} design={design} />
      </BasicsFrame>
      <SectionList sections={main} design={design} />
    </CvPage>
  )
}
