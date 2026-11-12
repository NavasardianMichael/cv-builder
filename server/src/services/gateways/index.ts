import type { PaymentGateway } from '@prisma/client'
import { ameriaGateway } from './ameria.js'
import { grantGateway } from './grant.js'
import { mockGateway } from './mock.js'
import type { PaymentGatewayClient } from './types.js'
import type { PaymentGatewayId } from '../../config.js'

/**
 * Every `Payment.gateway` value's client. Adding a gateway: a client file here, one entry, and
 * a value in the Prisma enum. `grant` is not one a buyer can use (`isGatewayId`).
 */
export const GATEWAYS: Record<PaymentGateway, PaymentGatewayClient> = {
  ameria: ameriaGateway,
  mock: mockGateway,
  grant: grantGateway,
}

/** A gateway a buyer pays through: `PAYMENT_GATEWAY`'s values, and the bank return routes. */
export const isGatewayId = (value: unknown): value is PaymentGatewayId => value === 'ameria' || value === 'mock'
