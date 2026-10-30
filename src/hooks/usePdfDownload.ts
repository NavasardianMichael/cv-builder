'use client'

import { useCallback, useState } from 'react'
import { App } from 'antd'
import { useTranslations } from 'next-intl'
import { downloadCvPdfAPI, downloadDraftPdfAPI } from '@api/cvs/main'
import type { PdfVariant } from '@api/cvs/types'
import type { CvDocument } from '@store/cvs/single/types'
import { classifyError, errorCopyKey } from '@helpers/error'
import { saveBlob } from '@helpers/image'

/**
 * Downloads a CV's PDF (the paid, designed one unless asked for the free `basic` one) and
 * hands it to the browser — or, with `downloadDraft`, the free PDF of a guest's local draft.
 * Rendering takes a few seconds, so a loading toast stays up until it lands. Rejections are
 * shown here, never rethrown.
 */
export const usePdfDownload = (): {
  download: (id: string, title: string, variant?: PdfVariant) => Promise<boolean>
  downloadDraft: (doc: CvDocument) => Promise<boolean>
  isDownloading: boolean
} => {
  const t = useTranslations('Editor.download')
  const tErrors = useTranslations('Errors')
  const { message } = App.useApp()
  const [isDownloading, setIsDownloading] = useState(false)

  const run = useCallback(
    async (key: string, title: string, fetchPdf: () => Promise<Blob>): Promise<boolean> => {
      setIsDownloading(true)
      message.loading({ key, content: t('preparing'), duration: 0 })
      try {
        saveBlob(await fetchPdf(), `${title.trim() || 'CV'}.pdf`)
        message.success({ key, content: t('done') })
        return true
      } catch (error) {
        message.error({ key, content: tErrors(errorCopyKey(classifyError(error))) })
        return false
      } finally {
        setIsDownloading(false)
      }
    },
    [message, t, tErrors]
  )

  const download = useCallback(
    (id: string, title: string, variant: PdfVariant = 'designed') =>
      run(`pdf-${id}`, title, () => downloadCvPdfAPI({ id, variant })),
    [run]
  )

  const downloadDraft = useCallback(
    (doc: CvDocument) => run('pdf-draft', doc.title, () => downloadDraftPdfAPI({ title: doc.title, content: doc.content })),
    [run]
  )

  return { download, downloadDraft, isDownloading }
}
