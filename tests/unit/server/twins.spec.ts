import { describe, expect, it } from 'vitest'
import { RESET_TOKEN_QUERY } from '@constants/auth'
import { ERROR_CODES } from '@constants/errors'
import { FONT_SLUGS } from '@constants/fonts'
import { CV_PRICE_AMD } from '@constants/pricing'
import { ROUTES } from '@constants/routes'
import { SECTION_TYPES } from '@constants/sections'
import { TEMPLATE_IDS } from '@constants/templates'
import * as serverCatalogue from '../../../server/src/lib/cv-catalogue'
import { ERROR_CODE } from '../../../server/src/lib/error-codes'
import * as returnPath from '../../../server/src/lib/return-path'
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

  it('charge what the pages print', () => {
    expect(SERVER_PRICE).toBe(CV_PRICE_AMD)
  })

  it('agree on every error code', () => {
    expect(ERROR_CODE).toEqual(ERROR_CODES)
  })

  it('build links the pages read', () => {
    expect(returnPath.PASSWORD_RESET_PATH).toBe(ROUTES.resetPassword)
    expect(returnPath.PASSWORD_RESET_QUERY).toBe(RESET_TOKEN_QUERY)
    expect(returnPath.PAYMENT_RESULT_PATH).toBe(ROUTES.paymentResult)
    expect(returnPath.SIGN_IN_PATH).toBe(ROUTES.signIn)
    expect(returnPath.DASHBOARD_PATH).toBe(ROUTES.dashboard)
  })
})
