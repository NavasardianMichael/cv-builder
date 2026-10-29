import { toWebsiteUrl } from './url'

/**
 * Finds the parts of CV text that are links, so a rendered CV (the preview, the PDF) can make
 * them clickable without the user marking anything up.
 *
 * Recognised: `http(s)://…`, `www.…`, email addresses, and bare domains on a short list of
 * TLDs (`ani.am`, `github.com/ani`). The list is deliberately short: a bare `\w+\.\w+` would
 * turn "1.2 մլն" or "Node.js" into links. Trailing punctuation stays text.
 */
export type TextPart = { text: string; href?: string }

/**
 * An email, a full URL, a `www.` address, or a bare domain on one of the listed TLDs.
 *
 * The nested quantifiers are safe: every repeated group starts with a literal `.` its inner
 * class cannot match, so there is no overlapping way to split the input (no catastrophic
 * backtracking), and CV fields are capped at 6000 characters by the API anyway. Measured on
 * adversarial 6000-character inputs: well under 50 ms.
 */
const PATTERN =
  // eslint-disable-next-line security/detect-unsafe-regex
  /(?<email>[\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(?<url>https?:\/\/[^\s<>"«»]+)|(?<www>www\.[^\s<>"«»]+)|(?<domain>\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:am|com|org|net|io|dev|me|app|co|info|edu|gov|ru|ai|tech|design|xyz|eu|us|uk|de|fr)(?:\/[^\s<>"«»]*)?)/giu

/** Punctuation that ends a sentence rather than a URL ("see ani.am." / "(ani.am)"). */
const TRAILING = /[.,;:!?)\]»՝։՛՜]+$/u

export const linkify = (text: string): TextPart[] => {
  const parts: TextPart[] = []
  let last = 0

  for (const match of text.matchAll(PATTERN)) {
    const start = match.index ?? 0
    // A domain inside an email or a longer word is not a link of its own.
    if (match.groups?.domain && start > 0 && /[\w@.-]/u.test(text[start - 1])) continue

    let raw = match[0]
    const trailing = raw.match(TRAILING)?.[0] ?? ''
    raw = raw.slice(0, raw.length - trailing.length)
    if (!raw) continue

    const href = match.groups?.email ? `mailto:${raw}` : toWebsiteUrl(raw)
    if (!href) continue

    if (start > last) parts.push({ text: text.slice(last, start) })
    parts.push({ text: raw, href })
    last = start + raw.length
  }

  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

/** http(s) links open in a new tab; mailto/tel hand off to the system and need no tab. */
export const linkTarget = (href: string): { target?: '_blank'; rel?: string } =>
  /^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {}
