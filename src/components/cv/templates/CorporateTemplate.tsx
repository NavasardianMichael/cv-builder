'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** A dark full-width band with photo, name and contacts over a light left sidebar. */
export const CorporateTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main, side } = useColumns(content, design)
  return (
    <CvPage design={design} sidebar='left'>
      <BasicsFrame basics={content.basics} className='cvx-band'>
        <PhotoBlock basics={content.basics} design={design} />
        <div className='cvx-band-text'>
          <NameBlock basics={content.basics} />
          <ContactList basics={content.basics} design={design} />
        </div>
      </BasicsFrame>
      <aside className='cvx-side'>
        <SectionList sections={side} design={design} />
      </aside>
      <div className='cvx-main'>
        <SectionList sections={main} design={design} tags='pills' />
      </div>
    </CvPage>
  )
}
