'use client'

import { type FC, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useTranslations } from 'next-intl'
import type { PdfVariant } from '@api/cvs/types'
import { useCvEditorStore } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { usePdfDownload } from '@hooks/usePdfDownload'
import { CheckoutModal } from './CheckoutModal'
import { SignInToDownloadModal } from './SignInToDownloadModal'
import { flushSave } from '../useAutosave'

type Props = {
  /** Open the purchase step on mount (the user came back from sign-in to download). */
  autoOpen?: boolean
}

/** Guest → sign in; unpaid → the free black-and-white PDF or checkout; paid → the PDF itself. */
export const DownloadButton: FC<Props> = ({ autoOpen }) => {
  const t = useTranslations('Editor.download')
  const cvId = useCvEditorStore.use.cvId()
  const paidAt = useCvEditorStore.use.paidAt()
  const title = useCvEditorStore.use.doc()?.title ?? ''
  const { download, isDownloading } = usePdfDownload()
  // The bar mounts once the document has loaded, so the returning buyer's checkout can open
  // straight away rather than from an effect.
  const [modal, setModal] = useState<'signIn' | 'checkout' | null>(() =>
    autoOpen && cvId && cvId !== DRAFT_ID && !paidAt ? 'checkout' : null
  )

  const downloadNow = async (variant: PdfVariant = 'designed') => {
    if (!cvId) return
    await flushSave()
    if ((await download(cvId, title, variant)) && variant === 'basic') setModal(null)
  }

  const start = () => {
    if (!cvId) return
    if (cvId === DRAFT_ID) setModal('signIn')
    else if (paidAt) void downloadNow()
    else setModal('checkout')
  }

  return (
    <>
      <Tooltip title={t('button')}>
        <Button
          type='primary'
          icon={<DownloadOutlined />}
          loading={isDownloading}
          onClick={start}
          aria-label={t('button')}
          className='bg-accent hover:bg-accent-strong'
        />
      </Tooltip>
      <SignInToDownloadModal open={modal === 'signIn'} onClose={() => setModal(null)} />
      <CheckoutModal
        open={modal === 'checkout'}
        onClose={() => setModal(null)}
        onAlreadyPaid={() => {
          setModal(null)
          void downloadNow()
        }}
        onDownloadBasic={() => void downloadNow('basic')}
        isDownloading={isDownloading}
      />
    </>
  )
}
