'use client'

import { type FC, type ReactNode, useMemo, useState } from 'react'
import { CheckOutlined, DownloadOutlined, LockOutlined } from '@ant-design/icons'
import { Alert, Button, Modal } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { checkoutCvAPI } from '@api/cvs/main'
import { useCvEditorStore } from '@store/cvs/single/store'
import type { CvContent, CvDesign } from '@store/cvs/single/types'
import { useCapabilities } from '@hooks/useCapabilities'
import { ERROR_CODES } from '@constants/errors'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { ROUTES } from '@constants/routes'
import { BASIC_DESIGN } from '@constants/templates'
import { basicContent } from '@helpers/basicCv'
import { classifyError } from '@helpers/error'
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
  isDownloading: boolean
}

type OptionProps = {
  content: CvContent
  design: CvDesign
  name: string
  price: string
  items: string[]
  children: ReactNode
  featured?: boolean
}

/** One way to download: what it looks like, what it costs, what it gives. */
const DownloadOption: FC<OptionProps> = ({ content, design, name, price, items, children, featured }) => (
  <section className={`flex flex-col rounded-2xl p-5 ${featured ? 'ring-2 ring-ink' : 'ring-1 ring-line'}`}>
    <div className='flex gap-4'>
      <div className='w-24 shrink-0 overflow-hidden rounded-md shadow-md ring-1 ring-black/5'>
        <CvPreview content={content} design={design} />
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
 * The two downloads: the free black-and-white PDF, and the designed one with the button that
 * sends the buyer to the bank. The document is saved first either way, so what is printed or
 * paid for is what is on screen.
 */
export const CheckoutModal: FC<Props> = ({ open, onClose, onAlreadyPaid, onDownloadBasic, isDownloading }) => {
  const t = useTranslations('Editor.download')
  const cvId = useCvEditorStore.use.cvId()
  const doc = useCvEditorStore.use.doc()
  const setPaidAt = useCvEditorStore.use.setPaidAt()
  const capabilities = useCapabilities()
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const plainContent = useMemo(() => (doc ? basicContent(doc.content) : null), [doc])

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

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={760} centered title={t('payTitle')} destroyOnHidden>
      {doc && plainContent && (
        <div className='grid gap-4 md:grid-cols-2'>
          <DownloadOption
            content={plainContent}
            design={BASIC_DESIGN}
            name={t('basicName')}
            price={t('basicPrice')}
            items={t.raw('basicIncludes') as string[]}
          >
            <Button size='large' block icon={<DownloadOutlined />} loading={isDownloading} onClick={onDownloadBasic}>
              {t('basicDownload')}
            </Button>
          </DownloadOption>

          <DownloadOption
            content={doc.content}
            design={doc.design}
            name={t('payName')}
            price={formatAmd(CV_PRICE_AMD)}
            items={t.raw('payIncludes') as string[]}
            featured
          >
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
          </DownloadOption>
        </div>
      )}
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
