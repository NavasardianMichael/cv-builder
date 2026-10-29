'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** White rounded cards on a pastel page; the sidebar is a stack of cards too. */
export const SoftTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main, side } = useColumns(content, design)
  return (
    <CvPage design={design}>
      <aside className='cvx-side'>
        <div className='cvx-card cvx-profile'>
          <PhotoBlock basics={content.basics} design={design} />
          <ContactList basics={content.basics} design={design} layout='column' />
        </div>
        <SectionList sections={side} design={design} tags='pills' />
      </aside>
      <div className='cvx-main'>
        <BasicsFrame basics={content.basics} className='cvx-card cvx-header'>
          <NameBlock basics={content.basics} />
        </BasicsFrame>
        <SectionList sections={main} design={design} />
      </div>
    </CvPage>
  )
}
