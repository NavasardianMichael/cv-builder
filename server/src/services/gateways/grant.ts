import { GatewayError, type PaymentGatewayClient } from './types.js'

/**
 * Not a bank: the `grant` payments the release wrote (amount 0, no gateway record) — the 21
 * days given to those who had paid per CV before the access pass. They count as passes like
 * any succeeded payment; nothing can be bought, checked, confirmed or reversed through them.
 * They never reach these methods in practice: every caller first needs a `gatewayPaymentId`,
 * which a grant does not have.
 */
const refuse = (what: string): never => {
  throw new GatewayError(`A grant has no gateway: cannot ${what}`)
}

export const grantGateway: PaymentGatewayClient = {
  init: async () => refuse('start a payment'),
  pageUrl: () => refuse('open a payment page'),
  check: async () => ({ status: 'failed', reason: 'a grant has no gateway record' }),
  confirm: async () => refuse('confirm'),
  refund: async () => refuse('refund'),
  cancel: async () => refuse('cancel'),
  isReversed: async () => false,
}
