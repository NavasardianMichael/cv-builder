'use client'

import { type FC, type ReactNode, useMemo, useState } from 'react'
import { CheckOutlined, DownloadOutlined, LockOutlined } from '@ant-design/icons'
import { Alert, Button, Modal } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createCvAPI } from '@api/cvs/main'
import type { PdfVariant } from '@api/cvs/types'
import { useAuthStore } from '@store/auth/store'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { usePurchasesStore } from '@store/purchases/store'
import { useAccessUntil, useNow } from '@hooks/useAccess'
import { useCapabilities } from '@hooks/useCapabilities'
import { useCheckout } from '@hooks/useCheckout'
import { ERROR_CODES } from '@constants/errors'
import { formatAmd, isAccessActive, PASS_DAYS, PASS_PRICE_AMD } from '@constants/pricing'
import { editorPath, ROUTES } from '@constants/routes'
import { BASIC_DESIGN } from '@constants/templates'
import { basicContent } from '@helpers/basicCv'
import { formatDateTime } from '@helpers/date'
import { classifyError } from '@helpers/error'
import { markGuestCvs } from '@helpers/guestCvs'
import { clearLocalDraft, isDraftId } from '@helpers/localDraft'
import { CvPreview } from '@components/cv/CvPreview'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { flushSave } from '../useAutosave'

type Props = {
  open: boolean
  onClose: () => void
  /** An earlier payment turned out to have gone through (its redirect was lost): access runs now. */
  onEarlierPayment: () => void
  /** Download the free black-and-white PDF. */
  onDownloadBasic: () => void
  /** A guest chose to sign in rather than buy without an account. */
  onSignIn: () => void
  isDownloading: boolean
}

type OptionProps = {
  variant: PdfVariant
  name: string
  price: string
  items: string[]
  children: ReactNode
  featured?: boolean
}

/**
 * The CV as that download prints it. It reads the document itself, so the modal around it
 * does not re-render on every keystroke while closed (its content is only mounted when open).
 */
const OptionPreview: FC<{ variant: PdfVariant }> = ({ variant }) => {
  const doc = useCvEditorStore.use.doc()
  const content = useMemo(() => (doc && variant === 'basic' ? basicContent(doc.content) : doc?.content), [doc, variant])
  if (!doc || !content) return null
  return <CvPreview content={content} design={variant === 'basic' ? BASIC_DESIGN : doc.design} />
}

/** One way to download: what it looks like, what it costs, what it gives. */
const DownloadOption: FC<OptionProps> = ({ variant, name, price, items, children, featured }) => (
  <section className={`flex flex-col rounded-2xl p-5 ${featured ? 'ring-2 ring-ink' : 'ring-1 ring-line'}`}>
    <div className='flex gap-4'>
      <div className='w-24 shrink-0 overflow-hidden rounded-md shadow-md ring-1 ring-black/5'>
        <OptionPreview variant={variant} />
      </div>
      <div className='min-w-0'>
        <h3 className='m-0 text-base font-bold text-ink'>{name}</h3>
        <p className='mt-2 mb-0 font-display text-3xl font-extrabold text-ink'>{price}</p>
      </div>
    </div>
    <ul className='m-0 my-5 flex list-none flex-col gap-2 p-0'>
      {items.map((item) => (
        <li key={item} className='flex gap-2 text-sm'>
          <CheckOutlined className='mt-0.5 text-success' />
          {item}
        </li>
      ))}
    </ul>
    <div className='mt-auto'>{children}</div>
  </section>
)

/**
 * A guest's draft lives only in this browser, so buying it first makes it a server CV, owned
 * by this browser's guest key (the API mints it). The editor carries on with that CV in place:
 * same document, new id, and the URL follows without a reload.
 */
export const moveDraftToServer = async (setCvId: (id: string) => void): Promise<string> => {
  const { cvId, doc } = useCvEditorStoreBase.getState()
  if (!doc || !isDraftId(cvId)) throw new Error('No draft to buy')
  const created = await createCvAPI(doc)
  clearLocalDraft(cvId)
  markGuestCvs()
  setCvId(created.id)
  window.history.replaceState(null, '', editorPath(created.id))
  return created.id
}

/** What buying without an account means, said before the bank page — not after. */
const GuestWarning: FC<{ redirecting: boolean; onContinue: () => void; onSignIn: () => void }> = ({
  redirecting,
  onContinue,
  onSignIn,
}) => {
  const t = useTranslations('Editor.download')
  return (
    <div className='flex flex-col gap-2'>
      <Alert type='warning' showIcon className='mb-2' title={t('guestWarningTitle')} description={t('guestWarningText')} />
      <Button type='primary' size='large' block loading={redirecting} onClick={onContinue}>
        {redirecting ? t('redirecting') : t('guestContinue')}
      </Button>
      <Button size='large' block disabled={redirecting} onClick={onSignIn}>
        {t('guestSignIn')}
      </Button>
    </div>
  )
}

/**
 * When the days start and end — or, while access runs, the date a new payment extends it to —
 * and what stays once they are over. Said before the bank page, not after (docs/PAYMENTS.md).
 * The dates are this device's estimate; the server counts from the moment it settles.
 */
const PassTerms: FC = () => {
  const t = useTranslations('Editor.download')
  const until = useAccessUntil()
  const now = useNow()
  if (now === 0) return null
  const active = until !== undefined && isAccessActive(until, now)
  const end = (active ? until! : now) + PASS_DAYS * DAY_MS
  return (
    <p className='m-0 mt-3 text-xs leading-relaxed text-muted'>
      {active
        ? t('extendNote', { until: formatDateTime(until!), days: PASS_DAYS, date: formatDateTime(end) })
        : t('startsNow', { days: PASS_DAYS, date: formatDateTime(end) })}
    </p>
  )
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The two downloads: the free black-and-white PDF, and full access — every template's designed
 * PDF of every CV for `PASS_DAYS` days — with the button that sends the buyer to the bank. The
 * document is saved first either way, so what is printed is what is on screen. Neither needs an
 * account; buying without one is warned about once, on the way to the bank. While access runs
 * (opened from the days-left chip) the paid side extends it: the new days go on top.
 */
export const CheckoutModal: FC<Props> = ({ open, onClose, onEarlierPayment, onDownloadBasic, onSignIn, isDownloading }) => {
  const t = useTranslations('Editor.download')
  const cvId = useCvEditorStore.use.cvId()
  const setCvId = useCvEditorStore.use.setCvId()
  const refreshAccess = usePurchasesStore.use.refresh()
  const isGuest = !useAuthStore.use.user()
  const capabilities = useCapabilities()
  const checkout = useCheckout()
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [confirmingGuest, setConfirmingGuest] = useState(false)

  const close = () => {
    setConfirmingGuest(false)
    onClose()
  }

  const pay = async () => {
    if (!cvId) return
    setError(null)
    setRedirecting(true)
    try {
      await flushSave()
      const id = isDraftId(cvId) ? await moveDraftToServer(setCvId) : cvId
      // False: an earlier payment may still be open, and the buyer chose not to start another.
      if (!(await checkout(id))) setRedirecting(false)
    } catch (failure) {
      setRedirecting(false)
      if (classifyError(failure).code === ERROR_CODES.earlierPaymentSucceeded) {
        await refreshAccess()
        onEarlierPayment()
        return
      }
      setError(failure)
    }
  }

  const unavailable = capabilities !== null && !capabilities.payments

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      width={760}
      title={t('payTitle')}
      destroyOnHidden
      // Taller than a short screen (a phone sideways, a laptop at zoom): the modal keeps 30px
      // above and below and its body scrolls, the title stays, and the page behind never moves.
      centered
      classNames={{ body: 'scrollbar-thin' }}
      styles={{
        container: { display: 'flex', flexDirection: 'column', maxHeight: 'calc(100dvh - 60px)' },
        header: { flexShrink: 0 },
        body: { minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' },
      }}
    >
      <div className='grid gap-4 md:grid-cols-2'>
        <DownloadOption
          variant='basic'
          name={t('basicName')}
          price={t('basicPrice')}
          items={t.raw('basicIncludes') as string[]}
        >
          <Button size='large' block icon={<DownloadOutlined />} loading={isDownloading} onClick={onDownloadBasic}>
            {t('basicDownload')}
          </Button>
        </DownloadOption>

        <DownloadOption
          variant='designed'
          name={t('payName', { days: PASS_DAYS })}
          price={formatAmd(PASS_PRICE_AMD)}
          items={(t.raw('payIncludes') as string[]).map((item) => item.replaceAll('{days}', String(PASS_DAYS)))}
          featured
        >
          {unavailable && <Alert type='warning' showIcon className='mb-4' title={t('unavailable')} />}
          {Boolean(error) && <ErrorAlert error={error} className='mb-4' />}
          {confirmingGuest ? (
            <GuestWarning redirecting={redirecting} onContinue={() => void pay()} onSignIn={onSignIn} />
          ) : (
            <Button
              type='primary'
              size='large'
              block
              icon={<LockOutlined />}
              loading={redirecting}
              disabled={unavailable}
              onClick={() => (isGuest ? setConfirmingGuest(true) : void pay())}
            >
              {redirecting ? t('redirecting') : t('pay', { price: formatAmd(PASS_PRICE_AMD) })}
            </Button>
          )}
          <PassTerms />
        </DownloadOption>
      </div>
      <section className='mt-4 rounded-xl bg-canvas p-4 text-sm'>
        <h3 className='m-0 text-sm font-bold text-ink'>{t('afterTitle', { days: PASS_DAYS })}</h3>
        <p className='m-0 mt-1 leading-relaxed'>{t('afterText', { days: PASS_DAYS })}</p>
        <p className='m-0 mt-2 text-xs leading-relaxed text-muted'>{t('keptText')}</p>
      </section>
      <p className='mt-4 mb-0 text-xs leading-relaxed'>{t('secure')}</p>
      <p className='mt-1 mb-0 text-xs'>
        {t.rich('agree', {
          terms: (chunks) => (
            <Link href={ROUTES.terms} target='_blank' className='underline!'>
              {chunks}
            </Link>
          ),
          refund: (chunks) => (
            <Link href={ROUTES.refundPolicy} target='_blank' className='underline!'>
              {chunks}
            </Link>
          ),
        })}
      </p>
    </Modal>
  )
}
