'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** Section titles as ribbons running in from the page edge; friendly, still one column. */
export const RibbonTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <div className='cvx-header-text'>
          <NameBlock basics={content.basics} />
          <ContactList basics={content.basics} design={design} />
        </div>
        <PhotoBlock basics={content.basics} design={design} />
      </BasicsFrame>
      <SectionList sections={main} design={design} tags='pills' />
    </CvPage>
  )
}
