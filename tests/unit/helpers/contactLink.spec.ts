import { describe, expect, it } from 'vitest'
import type { CvContact } from '@store/cvs/single/types'
import { contactHref, parsePhone, toLinkHref } from '@helpers/contactLink'

const contact = (type: CvContact['type'], value: string, url = ''): CvContact => ({ id: 'c1', type, value, url })

describe('parsePhone', () => {
  it.each([
    ['+374 91 123 456', '+37491123456'],
    ['+37491123456', '+37491123456'],
    ['091 123 456', '+37491123456'],
    ['091123456', '+37491123456'],
    ['091-12-34-56', '+37491123456'],
    ['(091) 12 34 56', '+37491123456'],
    ['91 12 34 56', '+37491123456'],
    ['374 91 123456', '+37491123456'],
    ['00374 91 123456', '+37491123456'],
    ['+374 (091) 123-456', '+37491123456'],
    ['010 54 32 10', '+37410543210'],
    ['0322 2 12 34', '+37432221234'],
    ['+1 (555) 123-4567', '+15551234567'],
    ['+7 926 123 45 67', '+79261234567'],
  ])('%s → %s', (input, expected) => {
    expect(parsePhone(input)).toBe(expected)
  })

  it('finds the number inside other text', () => {
    expect(parsePhone('Հեռ.՝ 091 123456 (WhatsApp)')).toBe('+37491123456')
    expect(parsePhone('բջջ. 093-65-43-21, աշխ. 010 123456')).toBe('+37493654321')
    expect(parsePhone('091 123 456 093 654 321')).toBe('+37491123456')
    expect(parsePhone('091123456 / 093654321')).toBe('+37491123456')
  })

  it('refuses what is not a whole number', () => {
    expect(parsePhone('')).toBeNull()
    expect(parsePhone('հեռախոս')).toBeNull()
    expect(parsePhone('12 34 56')).toBeNull()
    expect(parsePhone('+374 91 123')).toBeNull()
    expect(parsePhone('+12 345')).toBeNull()
  })
})

describe('contactHref', () => {
  it('works the link out from the type and the text', () => {
    expect(contactHref(contact('phone', '091 12 34 56'))).toBe('tel:+37491123456')
    expect(contactHref(contact('email', 'Էլ.՝ ani@mail.am'))).toBe('mailto:ani@mail.am')
    expect(contactHref(contact('website', 'anihov.am'))).toBe('https://anihov.am/')
    expect(contactHref(contact('linkedin', 'anihov'))).toBe('https://www.linkedin.com/in/anihov')
    expect(contactHref(contact('linkedin', 'linkedin.com/in/anihov'))).toBe('https://linkedin.com/in/anihov')
    expect(contactHref(contact('github', '@anihov'))).toBe('https://github.com/anihov')
    expect(contactHref(contact('telegram', '@ani_hov'))).toBe('https://t.me/ani_hov')
    expect(contactHref(contact('location', 'Երևան'))).toBeUndefined()
    expect(contactHref(contact('other', 'Վարորդական իրավունք B'))).toBeUndefined()
  })

  it('prefers the link the user attached, on any type', () => {
    expect(contactHref(contact('location', 'Երևան', 'maps.google.com/?q=Yerevan'))).toBe(
      'https://maps.google.com/?q=Yerevan'
    )
    expect(contactHref(contact('phone', '091 123456', 'tel:093 654321'))).toBe('tel:+37493654321')
    expect(contactHref(contact('other', 'Պորտֆոլիո', 'behance.net/ani'))).toBe('https://behance.net/ani')
  })
})

describe('toLinkHref', () => {
  it('accepts web addresses, emails and phone numbers', () => {
    expect(toLinkHref('https://anihov.am')).toBe('https://anihov.am/')
    expect(toLinkHref('ani@mail.am')).toBe('mailto:ani@mail.am')
    expect(toLinkHref('mailto:ani@mail.am')).toBe('mailto:ani@mail.am')
    expect(toLinkHref('tel:+374 91 123456')).toBe('tel:+37491123456')
  })

  it('rejects anything else', () => {
    expect(toLinkHref('javascript:alert(1)')).toBeUndefined()
    expect(toLinkHref('just words')).toBeUndefined()
    expect(toLinkHref('tel:123')).toBeUndefined()
  })
})
