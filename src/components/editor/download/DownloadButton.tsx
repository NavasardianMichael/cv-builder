'use client'

import { type FC, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { App, Button } from 'antd'
import { useTranslations } from 'next-intl'
import type { PdfVariant } from '@api/cvs/types'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { usePurchasesStore, usePurchasesStoreBase } from '@store/purchases/store'
import { accessActiveNow } from '@hooks/useAccess'
import { usePdfDownload } from '@hooks/usePdfDownload'
import { PASS_DAYS } from '@constants/pricing'
import { formatDateTime } from '@helpers/date'
import { isDraftId } from '@helpers/localDraft'
import { HintTooltip } from '@components/ui/HintTooltip'
import { AccessChip } from './AccessChip'
import { CheckoutModal, moveDraftToServer } from './CheckoutModal'
import { SignInToDownloadModal } from './SignInToDownloadModal'
import { flushSave } from '../useAutosave'

type Props = {
  /** Open the purchase step on mount (the user came back from sign-in to buy, or the dashboard's Download). */
  autoOpen?: boolean
}

/**
 * While the owner's full access runs → the designed PDF itself, of any CV in any template.
 * Otherwise the download dialog: the free black-and-white PDF, or buying `PASS_DAYS` days of
 * full access. Neither needs an account — a guest's draft prints as it is, and buying without
 * one warns first (CheckoutModal). The days-left chip beside it opens the same dialog to add
 * days on top.
 */
export const DownloadButton: FC<Props> = ({ autoOpen }) => {
  const t = useTranslations('Editor.download')
  const { message } = App.useApp()
  const cvId = useCvEditorStore.use.cvId()
  const setCvId = useCvEditorStore.use.setCvId()
  const title = useCvEditorStoreBase((state) => state.doc?.title) ?? ''
  const refreshAccess = usePurchasesStore.use.refresh()
  const { download, downloadDraft, isDownloading } = usePdfDownload()
  // The bar mounts once the document has loaded, so the returning buyer's checkout can open
  // straight away rather than from an effect.
  const [modal, setModal] = useState<'signIn' | 'checkout' | null>(() => (autoOpen && cvId && !isDraftId(cvId) ? 'checkout' : null))

  const downloadNow = async (variant: PdfVariant = 'designed') => {
    if (!cvId) return
    await flushSave()
    const doc = useCvEditorStoreBase.getState().doc
    if (!doc) return
    if (isDraftId(cvId) && variant === 'basic') {
      // A draft exists only in this browser, so it is sent to be printed as it is.
      if (await downloadDraft(doc)) setModal(null)
      return
    }
    // The designed PDF prints from the server: a draft is saved there first (the guest key owns it).
    const id = isDraftId(cvId) ? await moveDraftToServer(setCvId) : cvId
    const done = await download(id, title, variant)
    if (done && variant === 'basic') setModal(null)
    // Refused for want of access (it ran out while the page was open): the dialog explains.
    if (!done && variant === 'designed') {
      const { until } = await refreshAccess()
      if (!until || until <= Date.now()) setModal('checkout')
    }
  }

  const start = () => {
    if (!cvId) return
    if (accessActiveNow()) void downloadNow()
    else setModal('checkout')
  }

  return (
    <>
      <AccessChip onClick={() => setModal('checkout')} />
      <HintTooltip title={t('button')}>
        <Button
          type='primary'
          icon={<DownloadOutlined />}
          loading={isDownloading}
          onClick={start}
          aria-label={t('button')}
          className='bg-accent hover:bg-accent-strong'
        />
      </HintTooltip>
      {cvId && <SignInToDownloadModal cvId={cvId} open={modal === 'signIn'} onClose={() => setModal(null)} />}
      <CheckoutModal
        open={modal === 'checkout'}
        onClose={() => setModal(null)}
        onEarlierPayment={() => {
          // A payment whose redirect was lost went through: say so, so the buyer does not think
          // the click charged them again, then download.
          setModal(null)
          const { until } = usePurchasesStoreBase.getState()
          void message.success({ content: t('earlierPayment', { date: until ? formatDateTime(until) : '', days: PASS_DAYS }), duration: 8 })
          void downloadNow()
        }}
        onDownloadBasic={() => void downloadNow('basic')}
        onSignIn={() => setModal('signIn')}
        isDownloading={isDownloading}
      />
    </>
  )
}

