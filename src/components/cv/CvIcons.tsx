import type { FC } from 'react'

/**
 * Contact icons drawn in the CV. Plain inline SVG in `currentColor`, so they print crisp,
 * follow every palette, and need no icon library in the PDF render.
 */
export type CvIconName = 'email' | 'phone' | 'location' | 'website' | 'linkedin'

const PATHS: Record<CvIconName, string> = {
  email: 'M3 5h18v14H3z M3 6l9 7 9-7',
  phone: 'M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z',
  location: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  website: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 3 2.5 15 0 18 M12 3c-2.5 3-2.5 15 0 18',
  linkedin: 'M4 9h3v11H4z M5.5 4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z M10 9h3v1.6c.6-1 1.8-1.8 3.4-1.8 2.8 0 3.6 1.8 3.6 4.4V20h-3v-6c0-1.4-.4-2.4-1.8-2.4-1.5 0-2.2 1-2.2 2.6V20h-3z',
}

export const CvIcon: FC<{ name: CvIconName }> = ({ name }) => (
  <svg className='cv-icon' viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <path d={PATHS[name]} />
  </svg>
)
