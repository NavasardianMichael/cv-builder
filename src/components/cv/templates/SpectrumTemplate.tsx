'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/**
 * A spectrum bar across the top of every page, two columns split by a gradient rule, and each
 * section title a step further along the spectrum from the accent to the second colour.
 */
export const SpectrumTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main, side } = useColumns(content, design)
  return (
    <CvPage design={design} decor>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <PhotoBlock basics={content.basics} design={design} />
        <div className='cvx-header-text'>
          <NameBlock basics={content.basics} />
          <ContactList basics={content.basics} design={design} />
        </div>
      </BasicsFrame>
      <div className='cvx-columns'>
        <SectionList sections={main} design={design} />
        <SectionList sections={side} design={design} />
      </div>
    </CvPage>
  )
}
