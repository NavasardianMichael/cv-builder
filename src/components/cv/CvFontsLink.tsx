import type { FC } from 'react'
import { CV_FONTS_STYLESHEET } from '@constants/fonts'

/**
 * The twenty CV typefaces' `@font-face` rules. Linked only on pages that draw CVs, so the
 * landing page's critical path stays free of them; a face downloads only when used.
 * React 19 hoists a `<link rel="stylesheet" precedence>` into <head> and dedupes it.
 */
export const CvFontsLink: FC = () => <link rel='stylesheet' href={CV_FONTS_STYLESHEET} precedence='default' />
