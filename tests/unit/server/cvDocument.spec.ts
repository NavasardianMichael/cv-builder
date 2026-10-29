import { describe, expect, it } from 'vitest'
import { templateDesign } from '@constants/templates'
import { newCvDocument, sampleContent } from '@helpers/cvFactory'
import { coerceContent, coerceDesign, coerceTitle, CV_LIMITS } from '../../../server/src/services/cvDocument'

describe('coerceContent', () => {
  it('keeps a document the web builds exactly as it is', () => {
    const content = sampleContent()
    expect(coerceContent(content)).toEqual(content)
  })

  it('keeps a blank document', () => {
    const { content } = newCvDocument('modern')
    expect(coerceContent(content)).toEqual(content)
  })

  it('turns garbage into an empty, well-formed document', () => {
    const coerced = coerceContent('nope')
    expect(coerced.sections).toEqual([])
    expect(coerced.basics.fullName).toBe('')
    expect(coerced.basics.photo).toBeNull()
  })

  it('refuses a colour that is not six-digit hex (it reaches a style attribute)', () => {
    const content = sampleContent()
    content.sections[0].style.background = 'red;background:url(https://evil.example)' as string
    content.basics.style.text = '#abc'
    const coerced = coerceContent(content)
    expect(coerced.sections[0].style.background).toBeNull()
    expect(coerced.basics.style.text).toBeNull()
  })

  it('refuses a font outside the catalogue', () => {
    const content = sampleContent()
    ;(content.sections[0].style as { font: string | null }).font = 'Comic Sans'
    expect(coerceContent(content).sections[0].style.font).toBeNull()
  })

  it('accepts only small base64 image data URLs as the photo', () => {
    const content = sampleContent()
    content.basics.photo = 'data:image/jpeg;base64,AAAA'
    expect(coerceContent(content).basics.photo).toBe('data:image/jpeg;base64,AAAA')

    content.basics.photo = 'https://example.com/me.jpg'
    expect(coerceContent(content).basics.photo).toBeNull()

    content.basics.photo = 'data:image/svg+xml;base64,PHN2Zz4='
    expect(coerceContent(content).basics.photo).toBeNull()

    content.basics.photo = `data:image/png;base64,${'A'.repeat(CV_LIMITS.photo)}`
    expect(coerceContent(content).basics.photo).toBeNull()
  })

  it('caps lists and strings instead of rejecting the save', () => {
    const content = sampleContent()
    content.sections = Array.from({ length: CV_LIMITS.sections + 5 }, () => content.sections[0])
    content.basics.fullName = 'Ա'.repeat(CV_LIMITS.short + 50)
    const coerced = coerceContent(content)
    expect(coerced.sections).toHaveLength(CV_LIMITS.sections)
    expect(coerced.basics.fullName).toHaveLength(CV_LIMITS.short)
  })

  it('clamps a tag level to 0-5 and keeps "no level" as null', () => {
    const content = sampleContent()
    const skills = content.sections.find((section) => section.type === 'skills')!
    skills.tags[0].level = 99
    skills.tags[1].level = null
    const coerced = coerceContent(content).sections.find((section) => section.type === 'skills')!
    expect(coerced.tags[0].level).toBe(5)
    expect(coerced.tags[1].level).toBeNull()
  })
})

describe('coerceDesign', () => {
  it('keeps every template default as it is', () => {
    for (const id of ['classic', 'modern', 'soft'] as const) {
      expect(coerceDesign(templateDesign(id))).toEqual(templateDesign(id))
    }
  })

  it('falls back on an unknown template and clamps the sliders', () => {
    const design = coerceDesign({ templateId: 'nope', fontScale: 9, lineHeight: -1 })
    expect(design.templateId).toBe('classic')
    expect(design.fontScale).toBe(1.25)
    expect(design.lineHeight).toBe(1.1)
  })
})

describe('coerceTitle', () => {
  it('collapses whitespace and falls back when empty', () => {
    expect(coerceTitle('  Իմ   CV  ', 'x')).toBe('Իմ CV')
    expect(coerceTitle('   ', 'fallback')).toBe('fallback')
    expect(coerceTitle(42, 'fallback')).toBe('fallback')
  })
})
