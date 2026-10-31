'use client'

import { type FC, memo, type ReactNode } from 'react'
import type { CvBasics, CvDesign } from '@store/cvs/single/types'
import { CONTACT_PLACEHOLDERS, type ContactType } from '@constants/contacts'
import { cn } from '@helpers/cn'
import { contactHref } from '@helpers/contactLink'
import { blockStyleVars, initialsOf } from '@helpers/cvStyle'
import { useCvEdit } from '../CvEditContext'
import { CvIcon, type CvIconName } from '../CvIcons'
import { Editable } from '../Editable'

type BasicsProps = { basics: CvBasics }

/**
 * The header block: whatever a template puts around the name and contacts. Carries the
 * basics' own style overrides and, in the editor, their toolbar.
 */
export const BasicsFrame: FC<BasicsProps & { className?: string; children: ReactNode }> = ({
  basics,
  className,
  children,
}) => {
  const edit = useCvEdit()
  return (
    <header
      className={cn(
        'cv-basics',
        edit && 'cv-block-editable',
        edit?.selectedBlock === 'basics' && 'is-selected',
        className
      )}
      style={blockStyleVars(basics.style)}
    >
      {edit?.basicsToolbar()}
      {children}
    </header>
  )
}

/**
 * The blocks below are `memo`: `basics` keeps its identity while the user types in a section,
 * so the header does not re-render with every keystroke elsewhere.
 */
const NameBlockComponent: FC<BasicsProps & { className?: string }> = ({ basics, className }) => {
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

export const NameBlock = memo(NameBlockComponent)

/** Each contact type's icon. Its link comes from `helpers/contactLink`. */
const CONTACT_ICONS: Record<ContactType, CvIconName> = {
  email: 'email',
  phone: 'phone',
  location: 'location',
  website: 'website',
  linkedin: 'linkedin',
  github: 'github',
  telegram: 'telegram',
  other: 'info',
}

/**
 * `row` wraps inline (headers), `column` stacks (sidebars). The editor shows every contact,
 * empty ones as placeholders, each with a toolbar (link, remove) and an add button at the end; the
 * preview and the PDF show only the filled ones.
 */
const ContactListComponent: FC<BasicsProps & { design: CvDesign; layout?: 'row' | 'column'; className?: string }> = ({
  basics,
  design,
  layout = 'row',
  className,
}) => {
  const edit = useCvEdit()
  const items = edit ? basics.contacts : basics.contacts.filter((contact) => contact.value.trim())
  if (!items.length && !edit) return null

  return (
    <ul className={cn('cv-contacts', `cv-contacts-${layout}`, className)}>
      {items.map((contact) => (
        <li key={contact.id} className={cn('cv-contact', edit && 'cv-item-editable')}>
          {design.showIcons && <CvIcon name={CONTACT_ICONS[contact.type]} />}
          <Editable
            value={contact.value}
            placeholder={CONTACT_PLACEHOLDERS[contact.type]}
            href={contactHref(contact)}
            onChange={(value) => edit?.actions.setContactField(contact.id, 'value', value)}
          />
          {edit?.contactToolbar(contact)}
        </li>
      ))}
      {edit && <li className='cv-contact cv-contact-add'>{edit.addContactButton(basics.contacts.length)}</li>}
    </ul>
  )
}

export const ContactList = memo(ContactListComponent)

/** The photo, its slot in the editor, or nothing. */
const PhotoBlockComponent: FC<BasicsProps & { design: CvDesign; className?: string }> = ({
  basics,
  design,
  className,
}) => {
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

export const PhotoBlock = memo(PhotoBlockComponent)
