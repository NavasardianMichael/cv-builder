'use client'

import { type FC, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useTranslations } from 'next-intl'
import type { PdfVariant } from '@api/cvs/types'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { usePdfDownload } from '@hooks/usePdfDownload'
import { CheckoutModal } from './CheckoutModal'
import { SignInToDownloadModal } from './SignInToDownloadModal'
import { flushSave } from '../useAutosave'

type Props = {
  /** Open the purchase step on mount (the user came back from sign-in to download). */
  autoOpen?: boolean
}

/**
 * Paid → the PDF itself. Otherwise the download dialog: the free black-and-white PDF, or
 * checkout. Neither needs an account — a guest's draft prints as it is, and buying without
 * one warns first (CheckoutModal).
 */
export const DownloadButton: FC<Props> = ({ autoOpen }) => {
  const t = useTranslations('Editor.download')
  const cvId = useCvEditorStore.use.cvId()
  const paidAt = useCvEditorStore.use.paidAt()
  const title = useCvEditorStoreBase((state) => state.doc?.title) ?? ''
  const { download, downloadDraft, isDownloading } = usePdfDownload()
  // The bar mounts once the document has loaded, so the returning buyer's checkout can open
  // straight away rather than from an effect.
  const [modal, setModal] = useState<'signIn' | 'checkout' | null>(() =>
    autoOpen && cvId && cvId !== DRAFT_ID && !paidAt ? 'checkout' : null
  )

  const downloadNow = async (variant: PdfVariant = 'designed') => {
    if (!cvId) return
    await flushSave()
    // A draft exists only in this browser, so it is sent to be printed; it can only be the free PDF.
    const doc = useCvEditorStoreBase.getState().doc
    const done = cvId === DRAFT_ID ? Boolean(doc) && (await downloadDraft(doc!)) : await download(cvId, title, variant)
    if (done && variant === 'basic') setModal(null)
  }

  const start = () => {
    if (!cvId) return
    if (paidAt) void downloadNow()
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
      {cvId && <SignInToDownloadModal cvId={cvId} open={modal === 'signIn'} onClose={() => setModal(null)} />}
      <CheckoutModal
        open={modal === 'checkout'}
        onClose={() => setModal(null)}
        onAlreadyPaid={() => {
          setModal(null)
          void downloadNow()
        }}
        onDownloadBasic={() => void downloadNow('basic')}
        onSignIn={() => setModal('signIn')}
        isDownloading={isDownloading}
      />
    </>
  )
}
