'use client'

import { type FC, useCallback, useEffect, useState } from 'react'
import { Button, Modal, Spin } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createCvAPI } from '@api/cvs/main'
import { useAuthStore } from '@store/auth/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { editorPath, ROUTES } from '@constants/routes'
import type { TemplateId } from '@constants/templates'
import { newCvDocument } from '@helpers/cvFactory'
import { dedupe } from '@helpers/dedupe'
import { readLocalDraft, writeLocalDraft } from '@helpers/localDraft'
import { ErrorState } from '@components/ui/ErrorState'

type Props = { templateId: TemplateId; sample: boolean }

/**
 * Starts a CV and opens it. Signed in: created on the server. Guest: written as the local
 * draft — after asking, if a draft is already there, since there is only one.
 */
export const NewCvClient: FC<Props> = ({ templateId, sample }) => {
  const t = useTranslations('Editor')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const [askReplace, setAskReplace] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const startDraft = useCallback(() => {
    writeLocalDraft(newCvDocument(templateId, { sample }))
    router.replace(editorPath(DRAFT_ID))
  }, [router, sample, templateId])

  const start = useCallback(async () => {
    if (user) {
      const id = await dedupe(`new-cv:${templateId}:${sample}`, async () => (await createCvAPI(newCvDocument(templateId, { sample }))).id)
      return router.replace(editorPath(id))
    }
    if (readLocalDraft()) return setAskReplace(true)
    startDraft()
  }, [router, sample, startDraft, templateId, user])

  useEffect(() => {
    if (!isResolved) return
    // Reading localStorage (is there a draft?) is an external system; asking about it from
    // here, once the session is known, is what this effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start().catch(setError)
  }, [isResolved, start])

  if (error) {
    return (
      <div className='grid min-h-dvh place-items-center p-6'>
        <ErrorState
          error={error}
          onRetry={() => {
            setError(null)
            start().catch(setError)
          }}
          extra={
            <Link href={ROUTES.templates}>
              <Button>{tCommon('back')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className='grid min-h-dvh place-items-center bg-canvas'>
      <Spin size='large' description={tCommon('loading')} />
      <Modal
        open={askReplace}
        title={t('replaceDraftTitle')}
        closable={false}
        mask={{ closable: false }}
        onOk={startDraft}
        okText={t('replaceDraft')}
        cancelText={t('keepDraft')}
        onCancel={() => router.replace(editorPath(DRAFT_ID))}
      >
        {t('replaceDraftText')}
      </Modal>
    </div>
  )
}
