'use client'

import { useCallback, useState } from 'react'
import { App } from 'antd'
import { useTranslations } from 'next-intl'
import { downloadCvPdfAPI } from '@api/cvs/main'
import type { PdfVariant } from '@api/cvs/types'
import { classifyError, errorCopyKey } from '@helpers/error'
import { saveBlob } from '@helpers/image'

/**
 * Downloads a CV's PDF (the paid, designed one unless asked for the free `basic` one) and
 * hands it to the browser. Rendering takes a few seconds, so a loading toast stays up until it
 * lands. Rejections are shown here, never rethrown.
 */
export const usePdfDownload = (): {
  download: (id: string, title: string, variant?: PdfVariant) => Promise<boolean>
  isDownloading: boolean
} => {
  const t = useTranslations('Editor.download')
  const tErrors = useTranslations('Errors')
  const { message } = App.useApp()
  const [isDownloading, setIsDownloading] = useState(false)

  const download = useCallback(
    async (id: string, title: string, variant: PdfVariant = 'designed'): Promise<boolean> => {
      const key = `pdf-${id}`
      setIsDownloading(true)
      message.loading({ key, content: t('preparing'), duration: 0 })
      try {
        const blob = await downloadCvPdfAPI({ id, variant })
        saveBlob(blob, `${title.trim() || 'CV'}.pdf`)
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

  return { download, isDownloading }
}
