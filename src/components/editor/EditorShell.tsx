'use client'

import { type FC, useCallback, useEffect, useState } from 'react'
import { Button, Drawer, Spin } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createCvAPI, getCvAPI } from '@api/cvs/main'
import { useAuthStore } from '@store/auth/store'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { CHECKOUT_QUERY, editorPath, newCvPath, RETURN_TO_QUERY, ROUTES } from '@constants/routes'
import { DEFAULT_TEMPLATE_ID } from '@constants/templates'
import { dedupe } from '@helpers/dedupe'
import { classifyError } from '@helpers/error'
import { clearLocalDraft, readLocalDraft } from '@helpers/localDraft'
import { ErrorState } from '@components/ui/ErrorState'
import { EditorCanvas } from './canvas/EditorCanvas'
import { EditorTopBar } from './EditorTopBar'
import { EditorPanel } from './panels/EditorPanel'
import { Autosave } from './useAutosave'
import { useEditorShortcuts } from './useEditorShortcuts'

type Props = {
  cvId: string
  autoCheckout: boolean
}

type LoadState = { phase: 'loading' } | { phase: 'importing' } | { phase: 'ready' } | { phase: 'error'; error: unknown }

/**
 * Opens one CV for editing.
 *
 * - A server CV needs a session — or, for one bought without an account, this browser's guest
 *   cookie. Without either the user is sent to sign in and back.
 * - `draft` is a guest's local CV. Once the user is signed in it is imported as a server CV
 *   and the URL replaced — which is how "sign in to buy" carries the work across. Buying
 *   without an account turns it into a server CV in place (CheckoutModal).
 */
export const EditorShell: FC<Props> = ({ cvId, autoCheckout }) => {
  const t = useTranslations('Editor')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const loadDocument = useCvEditorStore.use.loadDocument()
  /** The open document's id: the draft's changes once a guest buys it (`cvId` is the URL's). */
  const openCvId = useCvEditorStore.use.cvId()
  const [state, setState] = useState<LoadState>({ phase: 'loading' })
  const [zoom, setZoom] = useState<number | null>(null)
  const [fitZoom, setFitZoom] = useState(1)
  const [pages, setPages] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const selectBlock = useCvEditorStore.use.selectBlock()

  useEditorShortcuts()

  const load = useCallback(async () => {
    if (cvId === DRAFT_ID) {
      const draft = readLocalDraft()
      if (!draft) return router.replace(newCvPath(DEFAULT_TEMPLATE_ID))
      if (!user) {
        loadDocument({ cvId: DRAFT_ID, doc: draft, paidAt: null })
        return setState({ phase: 'ready' })
      }
      setState({ phase: 'importing' })
      const createdId = await dedupe('import-draft', async () => {
        const created = await createCvAPI(draft)
        clearLocalDraft()
        return created.id
      })
      return router.replace(`${editorPath(createdId)}${autoCheckout ? `?${CHECKOUT_QUERY}=1` : ''}`)
    }

    let cv
    try {
      cv = await getCvAPI({ id: cvId })
    } catch (error) {
      // Signed out and not this browser's guest CV: it may be an account's, so sign in and back.
      const { kind } = classifyError(error)
      if (user || (kind !== 'unauthorized' && kind !== 'notFound')) throw error
      const back = `${editorPath(cvId)}${autoCheckout ? `?${CHECKOUT_QUERY}=1` : ''}`
      return router.replace(`${ROUTES.signIn}?${RETURN_TO_QUERY}=${encodeURIComponent(back)}`)
    }
    loadDocument({ cvId: cv.id, doc: { title: cv.title, content: cv.content, design: cv.design }, paidAt: cv.paidAt })
    setState({ phase: 'ready' })
  }, [autoCheckout, cvId, loadDocument, router, user])

  useEffect(() => {
    if (!isResolved) return
    // Opening the document reads localStorage (a guest's draft) and the API once the session
    // is known — the external systems this effect exists to synchronise with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((error: unknown) => setState({ phase: 'error', error }))
  }, [isResolved, load])

  // Leaving the editor drops the document, so the next one never flashes the previous.
  useEffect(() => () => useCvEditorStoreBase.getState().reset(), [])

  if (state.phase === 'error') {
    return (
      <div className='grid min-h-dvh place-items-center bg-canvas p-6'>
        <ErrorState
          error={state.error}
          title={t('loadFailed')}
          onRetry={() => {
            setState({ phase: 'loading' })
            load().catch((error: unknown) => setState({ phase: 'error', error }))
          }}
          extra={
            <Link href={user ? ROUTES.dashboard : ROUTES.home}>
              <Button>{tCommon('back')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (state.phase !== 'ready') {
    return (
      <div className='grid min-h-dvh place-items-center bg-canvas'>
        <Spin size='large' description={state.phase === 'importing' ? t('importing') : tCommon('loading')} />
      </div>
    )
  }

  return (
    <div className='flex h-dvh flex-col bg-canvas'>
      <Autosave />
      <EditorTopBar
        zoom={zoom}
        fitZoom={fitZoom}
        pages={pages}
        onZoomChange={setZoom}
        onOpenPanel={() => setPanelOpen(true)}
        autoCheckout={autoCheckout}
        previewing={previewing}
        onPreviewChange={(next) => {
          if (next) selectBlock(null)
          setPreviewing(next)
        }}
      />
      {!user && openCvId && (
        <div className='flex shrink-0 items-center justify-center gap-3 bg-accent-soft px-4 py-1.5 text-center text-xs'>
          <span>{t(openCvId === DRAFT_ID ? 'guestBanner' : 'guestCvBanner')}</span>
          <Link
            href={`${ROUTES.signIn}?${RETURN_TO_QUERY}=${encodeURIComponent(editorPath(openCvId))}`}
            className='font-semibold text-ink underline'
          >
            {t('guestBannerCta')}
          </Link>
        </div>
      )}
      <div className='flex min-h-0 flex-1'>
        <aside className='hidden w-90 shrink-0 overflow-y-auto border-r border-line bg-surface lg:block' aria-label={t('panelOpen')}>
          <EditorPanel />
        </aside>
        <div className='min-w-0 flex-1 overflow-auto bg-[color-mix(in_srgb,var(--brand-ink)_7%,var(--brand-canvas))]'>
          <EditorCanvas zoom={zoom} previewing={previewing} onPagesChange={setPages} onFitZoomChange={setFitZoom} />
        </div>
      </div>
      <Drawer
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        placement='left'
        title={t('panelOpen')}
        className='lg:hidden'
        styles={{ body: { padding: 0 } }}
      >
        <EditorPanel />
      </Drawer>
    </div>
  )
}
