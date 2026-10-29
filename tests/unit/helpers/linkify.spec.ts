import { describe, expect, it } from 'vitest'
import { linkify, linkTarget } from '@helpers/linkify'

const links = (text: string) => linkify(text).filter((part) => part.href)

describe('linkify', () => {
  it('keeps plain text as one part', () => {
    expect(linkify('Ղեկավարել եմ թիմը')).toEqual([{ text: 'Ղեկավարել եմ թիմը' }])
  })

  it('finds full URLs, www. and bare domains', () => {
    expect(links('Տես https://ani.am/work այստեղ')).toEqual([{ text: 'https://ani.am/work', href: 'https://ani.am/work' }])
    expect(links('www.example.com')).toEqual([{ text: 'www.example.com', href: 'https://www.example.com/' }])
    expect(links('Կոդը՝ github.com/anihov')).toEqual([{ text: 'github.com/anihov', href: 'https://github.com/anihov' }])
  })

  it('turns an email into a mailto link, not a domain link', () => {
    expect(links('Գրեք ani@mail.am')).toEqual([{ text: 'ani@mail.am', href: 'mailto:ani@mail.am' }])
  })

  it('leaves sentence punctuation outside the link', () => {
    const parts = linkify('Կայքս՝ ani.am։ Նաև (github.com/ani).')
    expect(parts.filter((part) => part.href).map((part) => part.text)).toEqual(['ani.am', 'github.com/ani'])
    expect(parts.map((part) => part.text).join('')).toBe('Կայքս՝ ani.am։ Նաև (github.com/ani).')
  })

  it('does not link numbers or tech names that merely contain a dot', () => {
    expect(links('1,2 մլն օգտատեր, 18.5%, Node.js, Vue.js, v2.0')).toEqual([])
  })

  it('preserves the text exactly when joined back', () => {
    const text = 'Նախագիծ՝ https://a.am, կապ՝ x@y.am\nերկրորդ տող'
    expect(linkify(text).map((part) => part.text).join('')).toBe(text)
  })
})

describe('linkTarget', () => {
  it('opens web links in a new tab and leaves mailto/tel alone', () => {
    expect(linkTarget('https://a.am')).toEqual({ target: '_blank', rel: 'noopener noreferrer' })
    expect(linkTarget('mailto:a@b.am')).toEqual({})
    expect(linkTarget('tel:+37491')).toEqual({})
  })
})
