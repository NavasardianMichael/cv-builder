import type { BlockStyle, CvContent, CvDocument, CvEntry, CvSection, CvTag } from '@store/cvs/single/types'
import { SECTION_DEFAULT_TITLES, SECTION_META, type SectionType } from '@constants/sections'
import { templateDesign, type TemplateId } from '@constants/templates'

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
  ...fields,
})

export const newTag = (name = '', level: number | null = null): CvTag => ({ id: newId(), name, level })

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
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
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

/** A filled-in example: template previews, and "start from an example". */
export const sampleContent = (): CvContent => ({
  basics: {
    fullName: 'Անի Հովհաննիսյան',
    headline: 'Ավագ արտադրանքի դիզայներ',
    email: 'ani.hovhannisyan@mail.am',
    phone: '+374 91 123 456',
    location: 'Երևան, Հայաստան',
    website: 'anihovhannisyan.am',
    linkedin: 'linkedin.com/in/anihov',
    photo: null,
    style: emptyStyle(),
  },
  sections: [
    newSection('summary', {
      text: 'Արտադրանքի դիզայներ՝ 7 տարվա փորձով ֆինտեք և էլեկտրոնային առևտրի ոլորտներում։ Սիրում եմ բարդ գործընթացները դարձնել պարզ և հաճելի, աշխատել հետազոտության տվյալներով և թիմի հետ գտնել լուծումներ, որոնք օգնում են և՛ օգտատիրոջը, և՛ բիզնեսին։',
    }),
    newSection('experience', {
      entries: [
        newEntry({
          title: 'Ավագ արտադրանքի դիզայներ',
          subtitle: 'Արարատ Տեխ',
          period: '2021 – այժմ',
          location: 'Երևան',
          description:
            '• Ղեկավարել եմ բջջային բանկինգի հավելվածի վերանախագծումը՝ 1,2 մլն օգտատեր\n• Կրճատել եմ վճարման քայլերը 5-ից 2-ի, ինչը 18%-ով բարձրացրեց փոխարկումը\n• Ստեղծել և պահպանում եմ ընկերության դիզայն համակարգը',
        }),
        newEntry({
          title: 'UX/UI դիզայներ',
          subtitle: 'Սևան Դիջիթալ',
          period: '2018 – 2021',
          location: 'Երևան',
          description:
            '• Նախագծել եմ 20+ վեբ և բջջային ինտերֆեյս տեղական և միջազգային հաճախորդների համար\n• Անցկացրել եմ օգտատերերի հարցազրույցներ և օգտագործելիության թեստեր',
        }),
      ],
    }),
    newSection('education', {
      entries: [
        newEntry({
          title: 'Ինֆորմատիկայի մագիստրոս',
          subtitle: 'Երևանի պետական համալսարան',
          period: '2016 – 2018',
          location: 'Երևան',
        }),
        newEntry({
          title: 'Դիզայնի բակալավր',
          subtitle: 'Հայաստանի ամերիկյան համալսարան',
          period: '2012 – 2016',
          location: 'Երևան',
        }),
      ],
    }),
    newSection('skills', {
      tags: [newTag('Figma', 5), newTag('Օգտատերերի հետազոտություն', 4), newTag('Դիզայն համակարգեր', 5), newTag('Պրոտոտիպավորում', 4), newTag('HTML/CSS', 3)],
    }),
    newSection('languages', { tags: [newTag('Հայերեն', 5), newTag('Անգլերեն', 4), newTag('Ռուսերեն', 4)] }),
    newSection('certificates', {
      entries: [newEntry({ title: 'Google UX Design Certificate', subtitle: 'Coursera', period: '2020' })],
    }),
    newSection('interests', { tags: [newTag('Լեռնագնացություն'), newTag('Լուսանկարչություն'), newTag('Շախմատ')] }),
  ],
})

export const DEFAULT_CV_TITLE = 'Իմ ռեզյումեն'

export const newCvDocument = (templateId: TemplateId, { sample = false }: { sample?: boolean } = {}): CvDocument => ({
  title: DEFAULT_CV_TITLE,
  content: sample ? sampleContent() : blankContent(),
  design: templateDesign(templateId),
})
