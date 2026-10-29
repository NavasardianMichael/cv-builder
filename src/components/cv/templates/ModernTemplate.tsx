'use client'

import type { FC } from 'react'
import type { TemplateProps } from './types'
import { useColumns } from './useColumns'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { CvPage } from '../CvPage'

/** Dark left sidebar with photo, contacts and the short sections; the story on the right. */
export const ModernTemplate: FC<TemplateProps> = ({ content, design }) => {
  const { main, side } = useColumns(content, design)
  return (
    <CvPage design={design} sidebar='left'>
      <aside className='cvx-side'>
        <PhotoBlock basics={content.basics} design={design} />
        <ContactList basics={content.basics} design={design} layout='column' />
        <SectionList sections={side} design={design} />
      </aside>
      <div className='cvx-main'>
        <BasicsFrame basics={content.basics} className='cvx-header'>
          <NameBlock basics={content.basics} />
        </BasicsFrame>
        <SectionList sections={main} design={design} />
      </div>
    </CvPage>
  )
}
