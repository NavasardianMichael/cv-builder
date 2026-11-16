'use client'

import { type FC, useCallback, useEffect, useState } from 'react'
import { Button, Result, Spin } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createCvAPI } from '@api/cvs/main'
import { useAuthStore } from '@store/auth/store'
import { editorPath, RETURN_TO_QUERY, ROUTES } from '@constants/routes'
import type { SampleCv } from '@constants/sampleCvs'
import type { TemplateId } from '@constants/templates'
import { newCvDocument } from '@helpers/cvFactory'
import { dedupe } from '@helpers/dedupe'
import { startLocalDraft } from '@helpers/localDraft'
import { ErrorState } from '@components/ui/ErrorState'

type Props = {
  templateId: TemplateId
  sample: boolean
  free: boolean
  /** A CV example page's text to start from (`?example=`), or null. */
  example: { slug: string; cv: SampleCv } | null
}

/**
 * Starts a CV and opens it. Signed in: created on the server. Guest: kept as a new local draft
 * beside any others (`helpers/localDraft`), so nothing is replaced and nothing is asked. A
 * browser that refuses to store it (site data blocked) is told so here: the editor reads the
 * draft back, and opening it without one would send the guest straight back to this page, in a
 * loop.
 */
export const NewCvClient: FC<Props> = ({ templateId, sample, free, example }) => {
  const t = useTranslations('Editor')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const [error, setError] = useState<unknown>(null)
  const [storageBlocked, setStorageBlocked] = useState(false)

  const start = useCallback(async () => {
    const key = `new-cv:${templateId}:${sample}:${free}:${example?.slug ?? ''}`
    const create = () => newCvDocument(templateId, { sample, free, example: example?.cv })
    if (user) {
      const id = await dedupe(key, async () => (await createCvAPI(create())).id)
      return router.replace(editorPath(id))
    }
    // Deduped like the server's: StrictMode's second run must not leave a second draft.
    const id = await dedupe(`${key}:draft`, async () => startLocalDraft(create()))
    if (!id) return setStorageBlocked(true)
    router.replace(editorPath(id))
  }, [example, free, router, sample, templateId, user])

  useEffect(() => {
    if (!isResolved) return
    // Writing the guest's draft to localStorage (an external system) once the session is known
    // is what this effect is for; it reports a refusal through state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start().catch(setError)
  }, [isResolved, start])

  if (storageBlocked) {
    const back = `${window.location.pathname}${window.location.search}`
    return (
      <div className='grid min-h-dvh place-items-center p-6'>
        <Result
          status='warning'
          title={t('storageBlockedTitle')}
          subTitle={t('storageBlockedText')}
          extra={
            <div className='flex flex-wrap justify-center gap-2'>
              <Link href={`${ROUTES.signIn}?${RETURN_TO_QUERY}=${encodeURIComponent(back)}`}>
                <Button type='primary'>{t('guestBannerCta')}</Button>
              </Link>
              <Link href={ROUTES.templates}>
                <Button>{tCommon('back')}</Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

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
    </div>
  )
}
