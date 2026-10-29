'use client'

import type { FC, ReactNode } from 'react'
import type { BasicsTextField, CvBasics, CvDesign } from '@store/cvs/single/types'
import { cn } from '@helpers/cn'
import { blockStyleVars, initialsOf } from '@helpers/cvStyle'
import { toWebsiteUrl } from '@helpers/url'
import { useCvEdit } from '../CvEditContext'
import { CvIcon, type CvIconName } from '../CvIcons'
import { Editable } from '../Editable'

type BasicsProps = { basics: CvBasics }

/**
 * The header block: whatever a template puts around the name and contacts. Carries the
 * basics' own style overrides and, in the editor, their toolbar.
 */
export const BasicsFrame: FC<BasicsProps & { className?: string; children: ReactNode }> = ({ basics, className, children }) => {
  const edit = useCvEdit()
  return (
    <header
      className={cn('cv-basics', edit && 'cv-block-editable', edit?.selectedBlock === 'basics' && 'is-selected', className)}
      style={blockStyleVars(basics.style)}
    >
      {edit?.basicsToolbar()}
      {children}
    </header>
  )
}

export const NameBlock: FC<BasicsProps & { className?: string }> = ({ basics, className }) => {
  const edit = useCvEdit()
  return (
    <div className={cn('cv-name-block', className)}>
      <Editable
        as='h1'
        className='cv-name'
        value={basics.fullName}
        placeholder='Անուն Ազգանուն'
        onChange={(value) => edit?.actions.setBasicsField('fullName', value)}
      />
      <Editable
        as='p'
        className='cv-headline'
        value={basics.headline}
        placeholder='Մասնագիտություն կամ պաշտոն'
        onChange={(value) => edit?.actions.setBasicsField('headline', value)}
      />
    </div>
  )
}

type ContactSpec = { field: BasicsTextField; icon: CvIconName; placeholder: string; href: (value: string) => string | undefined }

const CONTACTS: ContactSpec[] = [
  { field: 'email', icon: 'email', placeholder: 'էլ. փոստ', href: (value) => `mailto:${value.trim()}` },
  { field: 'phone', icon: 'phone', placeholder: 'հեռախոս', href: (value) => `tel:${value.replace(/[^\d+]/g, '')}` },
  { field: 'location', icon: 'location', placeholder: 'քաղաք, երկիր', href: () => undefined },
  { field: 'website', icon: 'website', placeholder: 'կայք', href: (value) => toWebsiteUrl(value) },
  { field: 'linkedin', icon: 'linkedin', placeholder: 'LinkedIn', href: (value) => toWebsiteUrl(value) },
]

/** `row` wraps inline (headers), `column` stacks (sidebars). */
export const ContactList: FC<BasicsProps & { design: CvDesign; layout?: 'row' | 'column'; className?: string }> = ({
  basics,
  design,
  layout = 'row',
  className,
}) => {
  const edit = useCvEdit()
  const items = edit ? CONTACTS : CONTACTS.filter((contact) => basics[contact.field].trim())
  if (!items.length) return null

  return (
    <ul className={cn('cv-contacts', `cv-contacts-${layout}`, className)}>
      {items.map((contact) => (
        <li key={contact.field} className='cv-contact'>
          {design.showIcons && <CvIcon name={contact.icon} />}
          <Editable
            value={basics[contact.field]}
            placeholder={contact.placeholder}
            href={contact.href(basics[contact.field])}
            onChange={(value) => edit?.actions.setBasicsField(contact.field, value)}
          />
        </li>
      ))}
    </ul>
  )
}

/** The photo, its slot in the editor, or nothing. */
export const PhotoBlock: FC<BasicsProps & { design: CvDesign; className?: string }> = ({ basics, design, className }) => {
  const edit = useCvEdit()
  if (!design.showPhoto) return null

  const classes = cn('cv-photo', `cv-photo-${design.photoShape}`, className)
  if (edit) return <div className={classes}>{edit.photoEditor(basics.photo, initialsOf(basics.fullName))}</div>
  if (!basics.photo) return null
  return (
    <div className={classes}>
      <img src={basics.photo} alt={basics.fullName || 'Լուսանկար'} />
    </div>
  )
}
