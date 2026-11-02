'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** Centred inside an ornamental frame with eight-pointed stars, repeated on every page. */
export const OrnamentTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main } = useColumns(content, design)
  return (
    <CvPage design={design} decor>
      <BasicsFrame basics={content.basics} className='cvx-header'>
        <PhotoBlock basics={content.basics} design={design} />
        <NameBlock basics={content.basics} />
        <div className='cvx-star' aria-hidden='true' />
        <ContactList basics={content.basics} design={design} />
      </BasicsFrame>
      <SectionList sections={main} design={design} tags='inline' />
    </CvPage>
  )
}
