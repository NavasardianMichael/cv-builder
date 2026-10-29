'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** One column, centred header, hairline rules under section titles. */
export const ClassicTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <PhotoBlock basics={content.basics} design={design} />
        <NameBlock basics={content.basics} />
        <ContactList basics={content.basics} design={design} />
      </BasicsFrame>
      <SectionList sections={main} design={design} tags='inline' />
    </CvPage>
  )
}
