'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** A header strip, then two equal dense columns. */
export const CompactTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main, side } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <PhotoBlock basics={content.basics} design={design} />
        <NameBlock basics={content.basics} />
        <ContactList basics={content.basics} design={design} />
      </BasicsFrame>
      <div className='cvx-columns'>
        <SectionList sections={main} design={design} />
        <SectionList sections={side} design={design} />
      </div>
    </CvPage>
  )
}
