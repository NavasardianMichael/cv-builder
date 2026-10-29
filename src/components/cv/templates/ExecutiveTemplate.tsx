'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** A dark full-bleed band for the name, gold accents, a narrow right column. */
export const ExecutiveTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main, side } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-band'>
        <PhotoBlock basics={content.basics} design={design} />
        <div className='cvx-band-text'>
          <NameBlock basics={content.basics} />
          <ContactList basics={content.basics} design={design} />
        </div>
      </BasicsFrame>
      <div className='cvx-columns'>
        <SectionList sections={main} design={design} className='cvx-main' />
        <SectionList sections={side} design={design} className='cvx-side' />
      </div>
    </CvPage>
  )
}
