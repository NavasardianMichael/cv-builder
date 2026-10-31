'use client'

import type { FC } from 'react'
import { splitSections } from '@helpers/cvStyle'
import type { TemplateProps } from './types'
import { BasicsFrame, ContactList, NameBlock, PhotoBlock } from '../blocks/Basics'
import { SectionList } from '../blocks/Section'
import { useCvEdit } from '../CvEditContext'
import { CvPage } from '../CvPage'

/**
 * A newspaper page: a masthead, the summary as a full-width lead with a drop cap, then the
 * other sections in two ruled columns.
 */
export const GazetteTemplate: FC<TemplateProps> = ({ content, design }) => {
  const edit = useCvEdit()
  const sections = edit ? content.sections : content.sections.filter((section) => !section.hidden)
  const lead = sections.filter((section) => section.type === 'summary')
  const rest = sections.filter((section) => section.type !== 'summary')
  const { main, side } = splitSections(design, rest, { includeHidden: true })
  return (
    <CvPage design={design}>
      <BasicsFrame basics={content.basics} className='cvx-masthead'>
        <PhotoBlock basics={content.basics} design={design} />
        <NameBlock basics={content.basics} />
        <ContactList basics={content.basics} design={design} />
      </BasicsFrame>
      <SectionList sections={lead} design={design} className='cvx-lead' />
      <div className='cvx-columns'>
        <div className='cvx-column'>
          <SectionList sections={main} design={design} />
        </div>
        <div className='cvx-column'>
          <SectionList sections={side} design={design} />
        </div>
      </div>
    </CvPage>
  )
}
