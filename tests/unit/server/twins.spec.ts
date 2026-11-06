import { describe, expect, it } from 'vitest'
import { GUEST_COOKIE, RESET_TOKEN_QUERY, VERIFY_TOKEN_QUERY } from '@constants/auth'
import { CONTACT_TYPES, MAX_CONTACTS } from '@constants/contacts'
import { ERROR_CODES } from '@constants/errors'
import { FONT_SLUGS } from '@constants/fonts'
import { CV_PRICE_AMD } from '@constants/pricing'
import { RETURN_TO_QUERY, ROUTES } from '@constants/routes'
import { SECTION_TYPES } from '@constants/sections'
import { BASIC_DESIGN, TEMPLATE_IDS } from '@constants/templates'
import { basicContent } from '@helpers/basicCv'
import type { ClientInfo } from '@helpers/clientInfo'
import { DEFAULT_CV_TITLE, sampleContent } from '@helpers/cvFactory'
import * as serverCatalogue from '../../../server/src/lib/cv-catalogue'
import { ERROR_CODE } from '../../../server/src/lib/error-codes'
import * as guest from '../../../server/src/lib/guest'
import { asClientInfo } from '../../../server/src/lib/request-info'
import * as returnPath from '../../../server/src/lib/return-path'
import * as serverBasic from '../../../server/src/services/basicCv'
import { CV_LIMITS as SERVER_CV_LIMITS, DEFAULT_CV_TITLE as SERVER_DEFAULT_TITLE } from '../../../server/src/services/cvDocument'
import { CV_PRICE_AMD as SERVER_PRICE } from '../../../server/src/services/pricing'

/**
 * Strings and numbers that live twice, once per package, with no import path between them.
 * A mismatch typechecks on both sides and fails only at runtime: a font the API drops, a
 * price the page misquotes, an emailed link the page cannot read.
 */
describe('server/web twins', () => {
  it('agree on the template catalogue', () => {
    expect([...serverCatalogue.TEMPLATE_IDS]).toEqual([...TEMPLATE_IDS])
  })

  it('agree on the fonts', () => {
    expect([...serverCatalogue.FONT_SLUGS]).toEqual([...FONT_SLUGS])
  })

  it('agree on the section types', () => {
    expect([...serverCatalogue.SECTION_TYPES]).toEqual([...SECTION_TYPES])
  })

  it('agree on the contact types and their limit', () => {
    expect([...serverCatalogue.CONTACT_TYPES]).toEqual([...CONTACT_TYPES])
    expect(SERVER_CV_LIMITS.contacts).toBe(MAX_CONTACTS)
  })

  it('charge what the pages print', () => {
    expect(SERVER_PRICE).toBe(CV_PRICE_AMD)
  })

  it('print the free PDF the way the download dialog previews it', () => {
    expect(serverBasic.BASIC_DESIGN).toEqual(BASIC_DESIGN)
    const content = sampleContent()
    content.basics.photo = 'data:image/jpeg;base64,AAAA'
    content.basics.style = { background: '#ff0000', text: '#00ff00', heading: null, font: 'amar' }
    content.sections = content.sections.map((section) => ({
      ...section,
      style: { background: '#0000ff', text: null, heading: '#ffff00', font: 'nasa-font' },
    }))
    expect(serverBasic.basicContent(content)).toEqual(basicContent(content))
    expect(basicContent(content).basics.photo).toBeNull()
  })

  it('name the guest cookie the proxy looks for', () => {
    expect(guest.GUEST_COOKIE).toBe(GUEST_COOKIE)
  })

  it('title an untitled CV the same way', () => {
    expect(SERVER_DEFAULT_TITLE).toBe(DEFAULT_CV_TITLE)
  })

  it('agree on every error code', () => {
    expect(ERROR_CODE).toEqual(ERROR_CODES)
  })

  it('build links the pages read', () => {
    expect(returnPath.PASSWORD_RESET_PATH).toBe(ROUTES.resetPassword)
    expect(returnPath.PASSWORD_RESET_QUERY).toBe(RESET_TOKEN_QUERY)
    expect(returnPath.FORGOT_PASSWORD_PATH).toBe(ROUTES.forgotPassword)
    expect(returnPath.EMAIL_VERIFY_PATH).toBe(ROUTES.verifyEmail)
    expect(returnPath.EMAIL_VERIFY_QUERY).toBe(VERIFY_TOKEN_QUERY)
    expect(returnPath.RETURN_TO_QUERY).toBe(RETURN_TO_QUERY)
    expect(returnPath.PAYMENT_RESULT_PATH).toBe(ROUTES.paymentResult)
    expect(returnPath.SIGN_IN_PATH).toBe(ROUTES.signIn)
    expect(returnPath.DASHBOARD_PATH).toBe(ROUTES.dashboard)
  })

  it('keep every device fact the checkout sends', () => {
    // `Required` makes a new web key fail to compile here until it is added.
    const everything: Required<ClientInfo> = {
      timezone: 'Asia/Yerevan',
      languages: 'hy-AM, en',
      platform: 'Android',
      mobile: true,
      screen: '412×915',
      viewport: '412×800',
      pixelRatio: 2.625,
      touchPoints: 5,
      cores: 8,
      memoryGb: 8,
      connection: '4g, ~10 Mbps',
      colorScheme: 'dark',
      standalone: false,
    }
    expect(Object.keys(asClientInfo(everything)).sort()).toEqual(Object.keys(everything).sort())
  })
})
