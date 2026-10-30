import type { Metadata } from 'next'
import { cvFontFamily } from '@constants/fonts'
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
 *
 * The watermark is `position: fixed`, which Chrome repeats on every printed page; it sits in
 * the page's bottom padding, right-aligned with the text.
 */
const PRINT_CSS = `
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; }
nextjs-portal { display: none !important; }
.cv-watermark {
  position: fixed;
  right: 16mm;
  bottom: 5mm;
  font: 7.5pt/1 ${cvFontFamily('ghea-grapalat')}, sans-serif;
  color: #808080;
  text-decoration: none;
}
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
