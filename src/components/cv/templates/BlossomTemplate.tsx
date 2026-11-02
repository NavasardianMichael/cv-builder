'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** Apricot-blossom branches in two corners of every page; soft and centred on the name. */
export const BlossomTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main } = useColumns(content, design)
  return (
    <CvPage design={design} decor>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <PhotoBlock basics={content.basics} design={design} />
        <div className='cvx-header-text'>
          <NameBlock basics={content.basics} />
          <ContactList basics={content.basics} design={design} />
        </div>
      </BasicsFrame>
      <SectionList sections={main} design={design} />
    </CvPage>
  )
}
