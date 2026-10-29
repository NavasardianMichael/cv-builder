import localFont from 'next/font/local'

/**
 * The app's own type: Mardoto for UI text, Montserrat Armenian for display headings. Both are
 * from the self-hosted CV set in `public/fonts/`, so a visitor who opens the editor already
 * has them cached. next/font preloads the faces and inlines the @font-face.
 *
 * next/font arguments must be literals — do not DRY these into a loop.
 */
export const fontUi = localFont({
  src: [
    { path: '../../public/fonts/mardoto/400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/mardoto/500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/mardoto/700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-ui',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

export const fontDisplay = localFont({
  src: [
    { path: '../../public/fonts/montserrat-armenian/700.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/montserrat-armenian/800.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-display-face',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
