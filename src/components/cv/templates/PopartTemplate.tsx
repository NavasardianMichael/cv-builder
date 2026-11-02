'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** A comic-book page: a halftone band for the name, section titles in inked panels. */
export const PopartTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-band'>
        <PhotoBlock basics={content.basics} design={design} />
        <div className='cvx-header-text'>
          <NameBlock basics={content.basics} />
          <ContactList basics={content.basics} design={design} />
        </div>
      </BasicsFrame>
      <SectionList sections={main} design={design} tags='pills' />
    </CvPage>
  )
}
