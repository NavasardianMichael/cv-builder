import type { FC } from 'react'

/**
 * Icons drawn in the CV (contacts, an item's link). Plain inline SVG in `currentColor`, so they print crisp,
 * follow every palette, and need no icon library in the PDF render. `github`, `telegram` and
 * `info` follow Feather's shapes (MIT).
 */
export type CvIconName = 'email' | 'phone' | 'location' | 'website' | 'linkedin' | 'github' | 'telegram' | 'info' | 'link'

const PATHS: Record<CvIconName, string> = {
  email: 'M3 5h18v14H3z M3 6l9 7 9-7',
  phone: 'M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z',
  location: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  website: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 3 2.5 15 0 18 M12 3c-2.5 3-2.5 15 0 18',
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  github:
    'M9 19c-5 1.5-5-2.5-7-3 M16 22v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 6.4-1.5 6.4-7a5.4 5.4 0 0 0-1.5-3.7 5.1 5.1 0 0 0-.1-3.8s-1.2-.4-3.9 1.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.5 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22',
  telegram: 'M22 2L11 13 M22 2l-7 20-4-9-9-4z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 16v-4 M12 8h.01',
  linkedin: 'M4 9h3v11H4z M5.5 4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z M10 9h3v1.6c.6-1 1.8-1.8 3.4-1.8 2.8 0 3.6 1.8 3.6 4.4V20h-3v-6c0-1.4-.4-2.4-1.8-2.4-1.5 0-2.2 1-2.2 2.6V20h-3z',
}

export const CvIcon: FC<{ name: CvIconName }> = ({ name }) => (
  <svg className='cv-icon' viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <path d={PATHS[name]} />
  </svg>
)
