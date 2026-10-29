'use client'

import { type FC, useState } from 'react'
import { CheckOutlined, LockOutlined } from '@ant-design/icons'
import { Alert, Button, Modal } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { checkoutCvAPI } from '@api/cvs/main'
import { useCvEditorStore } from '@store/cvs/single/store'
import { useCapabilities } from '@hooks/useCapabilities'
import { ERROR_CODES } from '@constants/errors'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { ROUTES } from '@constants/routes'
import { classifyError } from '@helpers/error'
import { CvPreview } from '@components/cv/CvPreview'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { flushSave } from '../useAutosave'

type Props = {
  open: boolean
  onClose: () => void
  /** The CV turned out to be paid already (another tab, a reconcile): download instead. */
  onAlreadyPaid: () => void
}

/**
 * The price, what it buys, and the button that sends the buyer to the bank. The document is
 * saved first, so what was paid for is what the PDF prints.
 */
export const CheckoutModal: FC<Props> = ({ open, onClose, onAlreadyPaid }) => {
  const t = useTranslations('Editor.download')
  const cvId = useCvEditorStore.use.cvId()
  const doc = useCvEditorStore.use.doc()
  const setPaidAt = useCvEditorStore.use.setPaidAt()
  const capabilities = useCapabilities()
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const pay = async () => {
    if (!cvId) return
    setError(null)
    setRedirecting(true)
    try {
      await flushSave()
      window.location.assign(await checkoutCvAPI({ id: cvId }))
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
  const includes = t.raw('payIncludes') as string[]

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={720} centered title={t('payTitle')} destroyOnHidden>
      <div className='grid gap-6 md:grid-cols-[220px_1fr]'>
        {doc && (
          <div className='hidden overflow-hidden rounded-lg shadow-md ring-1 ring-black/5 md:block'>
            <CvPreview content={doc.content} design={doc.design} />
          </div>
        )}
        <div>
          <p className='text-muted'>{t('payText')}</p>
          <p className='my-4 font-display text-4xl font-extrabold text-ink'>{formatAmd(CV_PRICE_AMD)}</p>
          <ul className='m-0 mb-5 flex list-none flex-col gap-2 p-0'>
            {includes.map((item) => (
              <li key={item} className='flex gap-2 text-sm'>
                <CheckOutlined className='mt-0.5 text-success' />
                {item}
              </li>
            ))}
          </ul>
          {unavailable && <Alert type='warning' showIcon className='mb-4' title={t('unavailable')} />}
          {Boolean(error) && <ErrorAlert error={error} className='mb-4' />}
          <Button
            type='primary'
            size='large'
            block
            icon={<LockOutlined />}
            loading={redirecting}
            disabled={unavailable}
            onClick={() => void pay()}
          >
            {redirecting ? t('redirecting') : t('pay', { price: formatAmd(CV_PRICE_AMD) })}
          </Button>
          <p className='mt-3 text-xs leading-relaxed text-muted'>{t('secure')}</p>
          <p className='mt-1 text-xs text-muted'>
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
        </div>
      </div>
    </Modal>
  )
}
