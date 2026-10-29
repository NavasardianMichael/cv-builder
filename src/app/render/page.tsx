import type { Metadata } from 'next'
import { CvFontsLink } from '@components/cv/CvFontsLink'
import { RenderClient } from './RenderClient'

export const metadata: Metadata = {
  title: 'CV',
  robots: { index: false, follow: false },
}

/**
 * The PDF print target (see RenderClient). `@page` margin 0 lets colour bleed to the sheet's
 * edge; CvPage puts the padding back on every page. Next's dev-tools badge is hidden so it
 * never lands in a development PDF.
 */
const PRINT_CSS = `
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; }
nextjs-portal { display: none !important; }
`

export default function RenderPage() {
  return (
    <>
      <CvFontsLink />
      <style>{PRINT_CSS}</style>
      <RenderClient />
    </>
  )
}
