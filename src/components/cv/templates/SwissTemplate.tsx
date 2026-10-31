'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** International Typographic Style: a huge name, ruled and numbered sections, one red. */
export const SwissTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <NameBlock basics={content.basics} />
        <div className='cvx-header-aside'>
          <PhotoBlock basics={content.basics} design={design} />
          <ContactList basics={content.basics} design={design} layout='column' />
        </div>
      </BasicsFrame>
      <SectionList sections={main} design={design} />
    </CvPage>
  )
}
