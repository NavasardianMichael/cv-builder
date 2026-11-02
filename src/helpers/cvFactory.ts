import type { BlockStyle, CvContact, CvContent, CvDocument, CvEntry, CvSection, CvTag } from '@store/cvs/single/types'
import { type ContactType, LEGACY_CONTACT_TYPES } from '@constants/contacts'
import { DEFAULT_SAMPLE, SAMPLE_CVS, TEMPLATE_SAMPLES } from '@constants/sampleCvs'
import { SECTION_DEFAULT_TITLES, SECTION_META, type SectionType } from '@constants/sections'
import { BASIC_DESIGN, templateDesign, type TemplateId } from '@constants/templates'

/** Building blocks for new documents, sections and items. Pure. */

/** Short, URL-safe and good enough to be unique inside one document (the API checks the shape). */
export const newId = (): string => {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Math.random()}`
  return random.replace(/[^a-z0-9]/gi, '').slice(0, 12)
}

export const emptyStyle = (): BlockStyle => ({ background: null, text: null, heading: null, font: null })

export const newEntry = (fields: Partial<Omit<CvEntry, 'id'>> = {}): CvEntry => ({
  id: newId(),
  title: '',
  subtitle: '',
  period: '',
  location: '',
  description: '',
  url: '',
  ...fields,
})

export const newTag = (name = '', level: number | null = null): CvTag => ({ id: newId(), name, level })

export const newContact = (type: ContactType, value = ''): CvContact => ({ id: newId(), type, value, url: '' })

export const newSection = (type: SectionType, fill: Partial<Pick<CvSection, 'text' | 'entries' | 'tags'>> = {}): CvSection => {
  const meta = SECTION_META[type]
  return {
    id: newId(),
    type,
    title: SECTION_DEFAULT_TITLES[type],
    hidden: false,
    column: 'auto',
    text: fill.text ?? '',
    entries: fill.entries ?? (meta.kind === 'entries' ? [newEntry()] : []),
    tags: fill.tags ?? (meta.kind === 'tags' ? [newTag('', meta.levels ? 3 : null)] : []),
    style: emptyStyle(),
  }
}

/** A blank CV: the usual sections, each with one empty item to type into. */
export const blankContent = (): CvContent => ({
  basics: {
    fullName: '',
    headline: '',
    contacts: LEGACY_CONTACT_TYPES.map((type) => newContact(type)),
    photo: null,
    style: emptyStyle(),
  },
  sections: [
    newSection('summary'),
    newSection('experience'),
    newSection('education'),
    newSection('skills', { tags: [newTag('', 4), newTag('', 3), newTag('', 3)] }),
    // Almost every Armenian CV lists these three.
    newSection('languages', { tags: [newTag('Հայերեն', 5), newTag('Ռուսերեն', 4), newTag('Անգլերեն', 3)] }),
  ],
})

/**
 * A filled-in example: template previews, and "start from an example". Each template has its
 * own person (`TEMPLATE_SAMPLES`); without one, the designer.
 */
export const sampleContent = (templateId?: TemplateId): CvContent => {
  const sample = SAMPLE_CVS[templateId ? TEMPLATE_SAMPLES[templateId] : DEFAULT_SAMPLE]
  return {
    basics: {
      fullName: sample.fullName,
      headline: sample.headline,
      contacts: sample.contacts.map(([type, value]) => newContact(type, value)),
      photo: null,
      style: emptyStyle(),
    },
    sections: sample.sections.map(({ type, title, text, entries, tags }) => {
      const section = newSection(type, {
        text,
        entries: entries?.map((entry) => newEntry(entry)),
        tags: tags?.map(([name, level]) => newTag(name, level)),
      })
      return title ? { ...section, title } : section
    }),
  }
}

export const DEFAULT_CV_TITLE = 'Իմ ինքնակենսագրականը'

/** `free` starts in the free PDF's black-and-white design instead of the template's own. */
export const newCvDocument = (
  templateId: TemplateId,
  { sample = false, free = false }: { sample?: boolean; free?: boolean } = {},
): CvDocument => ({
  title: DEFAULT_CV_TITLE,
  content: sample ? sampleContent(templateId) : blankContent(),
  design: free ? { ...BASIC_DESIGN, palette: { ...BASIC_DESIGN.palette } } : templateDesign(templateId),
})
