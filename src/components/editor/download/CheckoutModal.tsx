'use client'

import { type FC, type ReactNode, useMemo, useState } from 'react'
import { CheckOutlined, DownloadOutlined, LockOutlined } from '@ant-design/icons'
import { Alert, Button, Modal } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { checkoutCvAPI, createCvAPI } from '@api/cvs/main'
import type { PdfVariant } from '@api/cvs/types'
import { useAuthStore } from '@store/auth/store'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { useCapabilities } from '@hooks/useCapabilities'
import { ERROR_CODES } from '@constants/errors'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { editorPath, ROUTES } from '@constants/routes'
import { BASIC_DESIGN } from '@constants/templates'
import { basicContent } from '@helpers/basicCv'
import { classifyError } from '@helpers/error'
import { markGuestCvs } from '@helpers/guestCvs'
import { clearLocalDraft } from '@helpers/localDraft'
import { CvPreview } from '@components/cv/CvPreview'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { flushSave } from '../useAutosave'

type Props = {
  open: boolean
  onClose: () => void
  /** The CV turned out to be paid already (another tab, a reconcile): download instead. */
  onAlreadyPaid: () => void
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
const moveDraftToServer = async (setCvId: (id: string) => void): Promise<string> => {
  const { doc } = useCvEditorStoreBase.getState()
  if (!doc) throw new Error('No document to buy')
  const created = await createCvAPI(doc)
  clearLocalDraft()
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
 * The two downloads: the free black-and-white PDF, and the designed one with the button that
 * sends the buyer to the bank. The document is saved first either way, so what is printed or
 * paid for is what is on screen. Neither needs an account; buying without one is warned about
 * once, on the way to the bank.
 */
export const CheckoutModal: FC<Props> = ({ open, onClose, onAlreadyPaid, onDownloadBasic, onSignIn, isDownloading }) => {
  const t = useTranslations('Editor.download')
  const cvId = useCvEditorStore.use.cvId()
  const setCvId = useCvEditorStore.use.setCvId()
  const setPaidAt = useCvEditorStore.use.setPaidAt()
  const isGuest = !useAuthStore.use.user()
  const capabilities = useCapabilities()
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
      const id = cvId === DRAFT_ID ? await moveDraftToServer(setCvId) : cvId
      window.location.assign(await checkoutCvAPI({ id }))
    } catch (failure) {
      setRedirecting(false)
      if (classifyError(failure).code === ERROR_CODES.cvAlreadyPaid) {
        setPaidAt(new Date().toISOString())
        onAlreadyPaid()
        return
      }
      setError(failure)
    }
  }

  const unavailable = capabilities !== null && !capabilities.payments

  return (
    <Modal open={open} onCancel={close} footer={null} width={760} centered title={t('payTitle')} destroyOnHidden>
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
          name={t('payName')}
          price={formatAmd(CV_PRICE_AMD)}
          items={t.raw('payIncludes') as string[]}
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
              {redirecting ? t('redirecting') : t('pay', { price: formatAmd(CV_PRICE_AMD) })}
            </Button>
          )}
        </DownloadOption>
      </div>
      <p className='mt-4 mb-0 text-xs leading-relaxed text-muted'>{t('secure')}</p>
      <p className='mt-1 mb-0 text-xs text-muted'>
        {t.rich('agree', {
          terms: (chunks) => (
            <Link href={ROUTES.terms} target='_blank' className='underline'>
              {chunks}
            </Link>
          ),
          refund: (chunks) => (
            <Link href={ROUTES.refundPolicy} target='_blank' className='underline'>
              {chunks}
            </Link>
          ),
        })}
      </p>
    </Modal>
  )
}
