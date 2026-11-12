import type { InternalMailPayload } from '../lib/mail.js'
import { type ClientInfoKey, describeUserAgent, type RequestInfo } from '../lib/request-info.js'

/**
 * The two internal mails about a purchase, built from plain facts so they are testable
 * without a database; `paymentNotifications.ts` loads the facts and sends.
 *
 * **Visitor text goes only into `body` and `details`.** The engine sanitises those two but
 * inserts `subject` and the sender name into its HTML as they are, and turns `senderEmail`
 * into Reply-To — so the subject and sender are fixed strings with numbers, and the buyer's
 * name, email and CV title travel in `details`.
 */

/** `duplicate`: a CV already paid was paid again, and that second payment was handled (`settlePayment`). */
export type PaymentMailEvent = 'started' | 'succeeded' | 'duplicate'

/** How a payment got settled: the bank's redirect, or reconcile-on-read (`reconcileCvPayments`). */
export type SettleSource = 'return' | 'cv-open' | 'pdf-download' | 'checkout'

/**
 * `Payment.failureReason` of a payment made for a CV that was already paid. The rest of the
 * text says what became of the money; the result page and these mails read the prefixes.
 */
export const DUPLICATE_REASON = {
  prefix: 'duplicate',
  reversed: 'duplicate: reversed automatically, the CV was already paid',
  released: 'duplicate: hold released automatically, the CV was already paid',
  inProgress: 'duplicate: being reversed',
  manual: 'duplicate: NOT reversed, return it by hand',
} as const

export const isDuplicateReason = (reason: string | null): boolean => reason?.startsWith(DUPLICATE_REASON.prefix) ?? false

export type BuyerFacts =
  | {
      kind: 'account'
      id: string
      email: string
      fullName: string
      emailVerified: boolean
      signIn: string
      createdAt: Date
      cvCount: number
      /** Settled payments of this account other than this one. */
      paidBefore: number
    }
  | { kind: 'guest'; guestCvCount: number }

export type PaymentFacts = {
  payment: {
    id: string
    orderNumber: number
    amount: number
    currency: string
    gateway: string
    gatewayTestMode: boolean
    gatewayPaymentId: string | null
    status: string
    failureReason: string | null
    createdAt: Date
    paidAt: Date | null
    /** 1 for the first checkout of this CV. */
    attempt: number
  }
  buyer: BuyerFacts
  /** Null once the CV was deleted (the payment outlives it). */
  cv: {
    id: string
    title: string
    templateId: string
    createdAt: Date
    updatedAt: Date
    /** From the CV's own text: who the CV is about, and how to reach them. */
    personName: string
    personEmail: string | null
    personPhone: string | null
  } | null
}

const SOURCE_LABEL: Record<SettleSource, string> = {
  return: 'the bank redirected the buyer back to the site',
  'cv-open': 'reconciled when the buyer opened the CV (no bank redirect seen)',
  'pdf-download': 'reconciled when the buyer downloaded the PDF (no bank redirect seen)',
  checkout: 'reconciled when the buyer started another checkout (no bank redirect seen)',
}

const CLIENT_LABEL: Record<ClientInfoKey, string> = {
  timezone: 'Timezone',
  languages: 'Browser languages',
  platform: 'Platform',
  mobile: 'Mobile (browser says)',
  screen: 'Screen',
  viewport: 'Window',
  pixelRatio: 'Pixel ratio',
  touchPoints: 'Touch points',
  cores: 'CPU cores',
  memoryGb: 'Memory (GB, approx.)',
  connection: 'Connection',
  colorScheme: 'Colour scheme',
  standalone: 'Installed as app',
}

const YEREVAN = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Yerevan',
  dateStyle: 'medium',
  timeStyle: 'medium',
})

export const formatYerevan = (date: Date): string => `${YEREVAN.format(date)} (Yerevan)`

export const formatDuration = (ms: number): string => {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

const formatAmount = (amount: number, currency: string): string => `${amount.toLocaleString('en-US')} ${currency}`

type Details = Record<string, string>

const paymentDetails = ({ payment }: PaymentFacts, event: PaymentMailEvent, source?: SettleSource): Details => {
  const details: Details = {
    'Order #': String(payment.orderNumber),
    Amount: formatAmount(payment.amount, payment.currency),
    Gateway: payment.gatewayTestMode ? `${payment.gateway} (test mode)` : payment.gateway,
    'Gateway payment id': payment.gatewayPaymentId ?? '— (none)',
    'Payment id': payment.id,
    'Attempt for this CV': payment.attempt === 1 ? '1st' : `#${payment.attempt}`,
    'Checkout started': formatYerevan(payment.createdAt),
  }
  if (event === 'started') {
    details['Gateway answer'] =
      payment.status === 'failed'
        ? `FAILED — the bank page did not open: ${payment.failureReason ?? 'no reason given'}`
        : 'payment page opened; buyer sent to the bank'
  }
  if (event === 'succeeded' && payment.paidAt) {
    details['Paid at'] = formatYerevan(payment.paidAt)
    details['Time to pay'] = formatDuration(payment.paidAt.getTime() - payment.createdAt.getTime())
    if (source) details['Confirmed'] = SOURCE_LABEL[source]
  }
  if (event === 'duplicate') {
    details['What happened'] = payment.failureReason ?? '— (no reason recorded)'
    details['Payment status now'] = payment.status
    if (source) details['Noticed'] = SOURCE_LABEL[source]
  }
  return details
}

const buyerDetails = ({ buyer }: PaymentFacts): Details =>
  buyer.kind === 'guest'
    ? { Buyer: 'guest — no account', 'Guest CVs in this browser': String(buyer.guestCvCount) }
    : {
        Buyer: buyer.fullName,
        'Buyer email': buyer.email,
        'Email verified': buyer.emailVerified ? 'yes' : 'no',
        'Signs in with': buyer.signIn,
        'Account id': buyer.id,
        'Account since': formatYerevan(buyer.createdAt),
        'CVs in account': String(buyer.cvCount),
        'Paid before': buyer.paidBefore ? `${buyer.paidBefore} payment(s)` : 'never — first purchase',
      }

const cvDetails = ({ cv }: PaymentFacts): Details => {
  if (!cv) return { CV: 'deleted since' }
  const details: Details = {
    'CV title': cv.title,
    'CV id': cv.id,
    Template: cv.templateId,
    'Name on the CV': cv.personName || '— (empty)',
  }
  if (cv.personEmail) details['Email on the CV'] = cv.personEmail
  if (cv.personPhone) details['Phone on the CV'] = cv.personPhone
  details['CV created'] = formatYerevan(cv.createdAt)
  details['CV last edited'] = formatYerevan(cv.updatedAt)
  return details
}

const deviceDetails = (request: RequestInfo): Details => {
  const details: Details = {
    Device: describeUserAgent(request.userAgent),
    IP: request.ip ?? 'unknown',
  }
  if (request.ip) details['IP lookup'] = `https://ipinfo.io/${request.ip}`
  if (request.clientHints) details['Client hints'] = request.clientHints
  if (request.acceptLanguage) details['Accept-Language'] = request.acceptLanguage
  for (const [key, label] of Object.entries(CLIENT_LABEL) as [ClientInfoKey, string][]) {
    const value = request.client[key]
    if (value) details[label] = value
  }
  if (request.referer) details.Referer = request.referer
  details['User agent'] = request.userAgent ?? 'none'
  return details
}

const who = ({ buyer }: PaymentFacts): string =>
  buyer.kind === 'guest' ? 'A guest (no account)' : `${buyer.fullName} <${buyer.email}>`

const cvName = ({ cv }: PaymentFacts): string => (cv ? `the CV «${cv.title}»` : 'a since-deleted CV')

/**
 * One mail per event. `request` is the request that caused it: the click on "pay" for
 * `started`; for `succeeded`, the browser that came back from the bank or opened the CV.
 */
export const buildPaymentMail = (
  event: PaymentMailEvent,
  facts: PaymentFacts,
  request: RequestInfo | null,
  source?: SettleSource
): InternalMailPayload => {
  const { payment } = facts
  const amount = formatAmount(payment.amount, payment.currency)
  const failed = event === 'started' && payment.status === 'failed'
  const byHand = event === 'duplicate' && payment.failureReason === DUPLICATE_REASON.manual

  const subject =
    event === 'duplicate'
      ? byHand
        ? `DUPLICATE payment — return it by hand · order #${payment.orderNumber} · ${amount}`
        : `Duplicate payment reversed · order #${payment.orderNumber} · ${amount}`
      : event === 'succeeded'
        ? `Payment succeeded · order #${payment.orderNumber} · ${amount}`
        : failed
          ? `Checkout FAILED to start · order #${payment.orderNumber}`
          : `Checkout started · order #${payment.orderNumber} · ${amount}`

  const body =
    event === 'duplicate'
      ? byHand
        ? `${who(facts)} paid ${amount} again for ${cvName(facts)}, which was already paid, and it was not returned automatically (the reason is in the API log). Return this payment by hand: Cancel (within 72 hours) or Refund order #${payment.orderNumber} in the bank's merchant panel. The buyer was told to contact us if they were charged twice.`
        : `${who(facts)} paid ${amount} again for ${cvName(facts)}, which was already paid. This second payment was reversed automatically. Nothing to do; the buyer was told to contact us if they were charged twice.`
      : event === 'succeeded'
        ? `${who(facts)} paid ${amount} for ${cvName(facts)}. The CV is unlocked: its designed PDF can be downloaded.`
        : failed
          ? `${who(facts)} clicked "Վճարել" (${amount}) for ${cvName(facts)}, but the gateway refused to open its payment page. Nothing was charged.`
          : `${who(facts)} clicked "Վճարել" (${amount}) for ${cvName(facts)} and was sent to the bank's payment page. A "Payment succeeded" mail with the same order # follows if they pay.`

  const deviceHeading = event === 'started' ? '— Device —' : '— Device (confirming request) —'
  const details: Details = {
    '— Payment —': '',
    ...paymentDetails(facts, event, source),
    '— Buyer —': '',
    ...buyerDetails(facts),
    '— CV —': '',
    ...cvDetails(facts),
    ...(request ? { [deviceHeading]: '', ...deviceDetails(request) } : {}),
  }

  return {
    subject,
    body,
    firstName: event === 'started' ? 'Checkout' : 'Payment',
    details,
  }
}
