import { describe, expect, it } from 'vitest'
import { templateDesign } from '@constants/templates'
import { emptyStyle, newSection, sampleContent } from '@helpers/cvFactory'
import { blockStyleVars, hasBlockStyle, initialsOf, splitSections } from '@helpers/cvStyle'

describe('splitSections', () => {
  const sections = sampleContent().sections

  it('puts everything in main for a one-column template', () => {
    const { main, side } = splitSections(templateDesign('classic'), sections, { includeHidden: false })
    expect(main).toHaveLength(sections.length)
    expect(side).toHaveLength(0)
  })

  it('sends skills and languages to a sidebar by default', () => {
    const { side } = splitSections(templateDesign('modern'), sections, { includeHidden: false })
    expect(side.map((section) => section.type)).toEqual(expect.arrayContaining(['skills', 'languages']))
    expect(side.map((section) => section.type)).not.toContain('experience')
  })

  it('honours a section pinned to a column', () => {
    const pinned = sections.map((section) => (section.type === 'skills' ? { ...section, column: 'main' as const } : section))
    const { main } = splitSections(templateDesign('modern'), pinned, { includeHidden: false })
    expect(main.map((section) => section.type)).toContain('skills')
  })

  it('drops hidden sections unless the editor asks for them', () => {
    const withHidden = [...sections, { ...newSection('awards'), hidden: true }]
    expect(splitSections(templateDesign('classic'), withHidden, { includeHidden: false }).main).toHaveLength(sections.length)
    expect(splitSections(templateDesign('classic'), withHidden, { includeHidden: true }).main).toHaveLength(sections.length + 1)
  })
})

describe('block styles', () => {
  it('an empty style sets no variables', () => {
    expect(blockStyleVars(emptyStyle())).toEqual({})
    expect(hasBlockStyle(emptyStyle())).toBe(false)
  })

  it('a font override retypes both headings and body', () => {
    const vars = blockStyleVars({ ...emptyStyle(), font: 'ghea-grapalat' })
    expect(vars['--cv-font-heading']).toContain("'cv-ghea-grapalat'")
    expect(vars['--cv-font-body']).toContain("'cv-ghea-grapalat'")
  })
})

describe('initialsOf', () => {
  it('takes the first letters of the first two names', () => {
    expect(initialsOf('Անի Հովհաննիսյան')).toBe('ԱՀ')
    expect(initialsOf('  ')).toBe('')
  })
})
