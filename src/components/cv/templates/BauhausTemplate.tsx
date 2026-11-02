'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** Circle, half-disc and square in three colours beside the name, then two columns. */
export const BauhausTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main, side } = useColumns(content, design)
  return (
    <CvPage design={design} decor>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <div className='cvx-header-text'>
          <NameBlock basics={content.basics} />
          <ContactList basics={content.basics} design={design} />
        </div>
        <PhotoBlock basics={content.basics} design={design} />
        <div className='cvx-shapes' aria-hidden='true'>
          <span />
          <span />
          <span />
        </div>
      </BasicsFrame>
      <div className='cvx-columns'>
        <SectionList sections={main} design={design} />
        <SectionList sections={side} design={design} />
      </div>
    </CvPage>
  )
}
