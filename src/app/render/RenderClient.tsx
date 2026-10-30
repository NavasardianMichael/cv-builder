'use client'

import { type FC, useEffect, useState } from 'react'
import type { CvDocument as CvDocumentType } from '@store/cvs/single/types'
import { SITE_DOMAIN } from '@constants/app'
import { CvDocument } from '@components/cv/CvDocument'

/** Twin of `RenderDocument` in `server/src/services/pdf.ts`. */
type RenderDocument = CvDocumentType & { watermark?: boolean }

declare global {
  interface Window {
    __CV_RENDER__?: RenderDocument
  }
}

/**
 * Prints the document the API's headless Chrome injected as `window.__CV_RENDER__`
 * (`server/src/services/pdf.ts`). Opened directly in a browser it shows nothing: there is no
 * id in the URL and no request for one, so this page cannot print anyone's CV.
 *
 * `data-cv-ready` is what the API waits for before printing. The free PDF's watermark lives
 * here, not in `CvDocument`: it belongs to the printout, never to the editor or a preview.
 */
export const RenderClient: FC = () => {
  const [doc, setDoc] = useState<RenderDocument | null>(null)
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
      {doc.watermark && (
        <a className='cv-watermark' href={`https://${SITE_DOMAIN}/`}>
          Ստեղծված {SITE_DOMAIN}-ում
        </a>
      )}
    </div>
  )
}
