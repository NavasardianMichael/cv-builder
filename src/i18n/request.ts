import { getRequestConfig } from 'next-intl/server'
import { LOCALE, TIME_ZONE } from '@constants/app'

/**
 * One language. next-intl is here to keep copy out of components (`messages/hy.json`),
 * not for routing: there is no locale segment and no negotiation.
 */
export default getRequestConfig(async () => ({
  locale: LOCALE,
  messages: (await import('../messages/hy.json')).default,
  timeZone: TIME_ZONE,
}))
