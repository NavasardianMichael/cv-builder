'use client'

import type { FC, ReactNode } from 'react'
import type { CvDesign } from '@store/cvs/single/types'
import { cn } from '@helpers/cn'
import { designVars } from '@helpers/cvStyle'

type Props = {
  design: CvDesign
  /** A full-height coloured sidebar strip behind that column. */
  sidebar?: 'left' | 'right'
  /** A layer for background art behind the text, drawn by the template's CSS on every page. */
  decor?: boolean
  className?: string
  children: ReactNode
}

/**
 * One A4 sheet (210mm wide; as tall as the content).
 *
 * Two print problems, solved here once for every template:
 *
 * - **Page padding on every page.** The PDF prints with `@page { margin: 0 }` so colour can
 *   bleed to the edge, which would put page 2's first line flush against the top. The body
 *   therefore sits in a table whose empty `thead`/`tfoot` rows are the vertical padding:
 *   Chrome repeats a table's header and footer groups on every printed page.
 * - **A sidebar colour on every page.** `.cv-side-bg` is absolutely positioned on screen
 *   and `position: fixed` in print, which Chrome repeats per page. `.cv-decor`, the background
 *   art, works the same way; its images are one A4 page tall and repeat down the sheet, so the
 *   editor shows each page's art where the PDF prints it.
 */
export const CvPage: FC<Props> = ({ design, sidebar, decor, className, children }) => (
  <div
    className={cn('cv-root', `cvt-${design.templateId}`, sidebar && `cv-has-side cv-side-${sidebar}`, className)}
    style={designVars(design)}
  >
    {sidebar && <div className='cv-side-bg' aria-hidden='true' />}
    {decor && <div className='cv-decor' aria-hidden='true' />}
    <table className='cv-flow' role='presentation'>
      <thead>
        <tr>
          <td>
            <div className='cv-flow-pad' />
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className='cv-flow-cell'>
            <div className='cv-body'>{children}</div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <div className='cv-flow-pad' />
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
)
