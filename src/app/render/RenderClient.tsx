'use client'

import { type FC, useEffect, useState } from 'react'
import type { CvDocument as CvDocumentType } from '@store/cvs/single/types'
import { CvDocument } from '@components/cv/CvDocument'

declare global {
  interface Window {
    __CV_RENDER__?: CvDocumentType
  }
}

/**
 * Prints the document the API's headless Chrome injected as `window.__CV_RENDER__`
 * (`server/src/services/pdf.ts`). Opened directly in a browser it shows nothing: there is no
 * id in the URL and no request for one, so this page cannot print anyone's CV.
 *
 * `data-cv-ready` is what the API waits for before printing.
 */
export const RenderClient: FC = () => {
  const [doc, setDoc] = useState<CvDocumentType | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Read after hydration: the injected global does not exist during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoc(window.__CV_RENDER__ ?? null)
  }, [])

  useEffect(() => {
    if (!doc) return
    document.title = doc.title
    document.documentElement.style.background = doc.design.palette.background
    document.body.style.background = doc.design.palette.background
    let active = true
    void document.fonts.ready.then(() => active && setReady(true))
    return () => {
      active = false
    }
  }, [doc])

  if (!doc) return null
  return (
    <div data-cv-ready={ready ? 'true' : 'false'}>
      <CvDocument content={doc.content} design={doc.design} />
    </div>
  )
}
