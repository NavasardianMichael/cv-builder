'use client'

import { type FC, useCallback, useEffect, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import { Button, Drawer, Spin } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createCvAPI, getCvAPI } from '@api/cvs/main'
import { useAuthStore } from '@store/auth/store'
import { useCvEditorStore, useCvEditorStoreBase } from '@store/cvs/single/store'
import { DRAFT_ID } from '@store/cvs/single/types'
import { COMPACT_QUERY, useMediaQuery } from '@hooks/useMediaQuery'
import { CHECKOUT_QUERY, editorPath, newCvPath, RETURN_TO_QUERY, ROUTES } from '@constants/routes'
import { DEFAULT_TEMPLATE_ID } from '@constants/templates'
import { dedupe } from '@helpers/dedupe'
import { classifyError } from '@helpers/error'
import { clearLocalDraft, readLocalDraft } from '@helpers/localDraft'
import { LeaveGuard } from '@components/layout/LeaveGuard'
import { ErrorState } from '@components/ui/ErrorState'
import { CanvasZoomControl } from './canvas/CanvasZoomControl'
import { EditorCanvas } from './canvas/EditorCanvas'
import { EditorBottomBar } from './EditorBottomBar'
import { EditorTopBar } from './EditorTopBar'
import { EditorPanel, type EditorTab, PanelBody } from './panels/EditorPanel'
import { Autosave } from './useAutosave'
import { useEditorShortcuts } from './useEditorShortcuts'

type Props = {
  cvId: string
  autoCheckout: boolean
}

type LoadState = { phase: 'loading' } | { phase: 'importing' } | { phase: 'ready' } | { phase: 'error'; error: unknown }

/** Below this zoom the sheet's text is too small to type into: taps open the content form. */
const DIRECT_EDIT_ZOOM = 0.65

/** The text form takes most of the screen; the others leave the sheet in view above them. */
const SHEET_SIZES: Record<EditorTab, string> = { content: '88dvh', templates: '62dvh', design: '62dvh', sections: '62dvh' }

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
  /** The bottom sheet's panel; kept after closing, so it does not empty while sliding away. */
  const [sheet, setSheet] = useState<{ tab: EditorTab; focusBlock: string | null }>({ tab: 'content', focusBlock: null })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  /** Closing the guest banner lasts only until the editor is next opened: it is never stored. */
  const [guestBannerOpen, setGuestBannerOpen] = useState(true)
  const selectBlock = useCvEditorStore.use.selectBlock()
  const compact = useMediaQuery(COMPACT_QUERY)
  const tapToEdit = compact && (zoom ?? fitZoom) < DIRECT_EDIT_ZOOM
  const tSheet = useTranslations('Editor.tabs')

  useEditorShortcuts()

  const openSheet = (tab: EditorTab, focusBlock: string | null = null) => {
    setSheet({ tab, focusBlock })
    setSheetOpen(true)
  }

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
      <LeaveGuard />
      <EditorTopBar
        zoom={zoom}
        fitZoom={fitZoom}
        pages={pages}
        onZoomChange={setZoom}
        autoCheckout={autoCheckout}
        previewing={previewing}
        onPreviewChange={(next) => {
          if (next) selectBlock(null)
          setPreviewing(next)
        }}
      />
      {!user && openCvId && guestBannerOpen && (
        <div className='flex shrink-0 items-center gap-2 bg-accent-soft px-1 py-0.5 text-[11px] leading-snug sm:px-2 sm:py-1 sm:text-xs'>
          {/* As wide as the close button, so the message stays centred on the whole bar. */}
          <span className='w-6 shrink-0' aria-hidden='true' />
          <div className='flex min-w-0 flex-1 items-center justify-center gap-3 text-center'>
            <span>{t(openCvId === DRAFT_ID ? 'guestBanner' : 'guestCvBanner')}</span>
            <Link
              href={`${ROUTES.signIn}?${RETURN_TO_QUERY}=${encodeURIComponent(editorPath(openCvId))}`}
              className='shrink-0 font-semibold text-ink underline'
            >
              {t('guestBannerCta')}
            </Link>
          </div>
          <Button
            type='text'
            size='small'
            icon={<CloseOutlined />}
            onClick={() => setGuestBannerOpen(false)}
            aria-label={tCommon('close')}
            className='shrink-0'
          />
        </div>
      )}
      <div className='flex min-h-0 flex-1'>
        {/* Does not scroll itself: the tabs' body does, under a tab bar that stays (EditorPanel). */}
        <aside className='hidden w-90 shrink-0 overflow-hidden border-r border-line bg-surface lg:block' aria-label={t('panelOpen')}>
          <EditorPanel />
        </aside>
        <div className='relative flex min-w-0 flex-1'>
          <EditorCanvas
            zoom={zoom}
            onZoomChange={setZoom}
            previewing={previewing}
            onBlockTap={tapToEdit ? (focusBlock) => openSheet('content', focusBlock) : undefined}
            onPagesChange={setPages}
            onFitZoomChange={setFitZoom}
          />
          {compact && <CanvasZoomControl zoom={zoom} fitZoom={fitZoom} onZoomChange={setZoom} showTapHint={tapToEdit && !previewing} />}
        </div>
      </div>
      <EditorBottomBar
        openTab={sheetOpen ? sheet.tab : null}
        onOpenTab={(tab) => openSheet(tab)}
        previewing={previewing}
        onPreviewChange={(next) => {
          if (next) selectBlock(null)
          setPreviewing(next)
        }}
      />
      {compact && (
        <Drawer
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          placement='bottom'
          size={SHEET_SIZES[sheet.tab]}
          title={tSheet(sheet.tab)}
          destroyOnHidden
          styles={{
            wrapper: { borderRadius: '16px 16px 0 0', overflow: 'hidden' },
            header: { padding: '12px 16px' },
            body: { padding: '16px 16px calc(32px + env(safe-area-inset-bottom))' },
            // A light veil: design and template changes are watched on the sheet above.
            mask: { background: 'rgba(20, 24, 45, 0.18)' },
          }}
        >
          <PanelBody tab={sheet.tab} focusBlock={sheet.focusBlock} />
        </Drawer>
      )}
    </div>
  )
}
