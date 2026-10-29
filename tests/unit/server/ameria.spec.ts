import { describe, expect, it } from 'vitest'
import {
  AMERIA_BASE_URL,
  buildInitPaymentBody,
  interpretDetails,
  paymentPageUrl,
  readInitResponse,
} from '../../../server/src/services/gateways/ameria-wire'

const credentials = { clientId: 'client', username: 'user', password: 'secret' }

describe('Ameria InitPayment', () => {
  it('sends drams in AMD (ISO 4217 numeric 051) with our order number and return URL', () => {
    const body = buildInitPaymentBody(credentials, {
      orderId: 2350301,
      amount: 2000,
      description: 'CV',
      backUrl: 'https://api.example/payments/return/ameria',
      opaque: 'payment-id',
    })
    expect(body).toMatchObject({
      ClientID: 'client',
      Username: 'user',
      Password: 'secret',
      Currency: '051',
      OrderID: 2350301,
      Amount: 2000,
      BackURL: 'https://api.example/payments/return/ameria',
      Opaque: 'payment-id',
    })
  })

  it('reads ResponseCode 1 as success, anything else as failure', () => {
    expect(readInitResponse({ ResponseCode: 1, PaymentID: 'abc' })).toEqual({ ok: true, paymentId: 'abc' })
    expect(readInitResponse({ ResponseCode: '1', PaymentID: 'abc' })).toEqual({ ok: true, paymentId: 'abc' })
    expect(readInitResponse({ ResponseCode: 1, PaymentID: '' }).ok).toBe(false)
    expect(readInitResponse({ ResponseCode: 20, ResponseMessage: 'auth' }).ok).toBe(false)
  })

  it('builds the Armenian payment page URL', () => {
    expect(paymentPageUrl(AMERIA_BASE_URL.test, 'a b')).toBe('https://servicestest.ameriabank.am/VPOS/Payments/Pay?id=a%20b&lang=am')
  })
})

describe('Ameria GetPaymentDetails → verdict', () => {
  const expected = { orderId: 2350301, amount: 2000 }
  const deposited = { ResponseCode: '00', OrderStatus: '2', PaymentState: 'payment_deposited', OrderID: '2350301', Amount: 2000 }

  it('is paid only when deposited, for our order, for at least our amount', () => {
    expect(interpretDetails(deposited, expected)).toEqual({ status: 'succeeded' })
  })

  it('refuses a deposited payment for another order (a replayed paymentID)', () => {
    expect(interpretDetails({ ...deposited, OrderID: '999' }, expected)).toEqual({ status: 'failed', reason: 'order mismatch' })
  })

  it('refuses a smaller charge', () => {
    expect(interpretDetails({ ...deposited, Amount: 10 }, expected)).toEqual({ status: 'failed', reason: 'amount mismatch' })
  })

  it('treats declined, void and refunded as failed', () => {
    expect(interpretDetails({ ResponseCode: '00', OrderStatus: 6 }, expected).status).toBe('failed')
    expect(interpretDetails({ ResponseCode: '00', PaymentState: 'payment_void' }, expected).status).toBe('failed')
    expect(interpretDetails({ ResponseCode: '00', OrderStatus: '4' }, expected).status).toBe('failed')
  })

  it('keeps a started or merely approved payment pending', () => {
    expect(interpretDetails({ ResponseCode: '00', OrderStatus: 0 }, expected)).toEqual({ status: 'pending' })
    expect(interpretDetails({ ResponseCode: '00', OrderStatus: 1 }, expected)).toEqual({ status: 'pending' })
    expect(interpretDetails({ ...deposited, ResponseCode: '01' }, expected)).toEqual({ status: 'pending' })
  })
})
