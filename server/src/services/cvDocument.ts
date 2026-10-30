import {
  FONT_SLUGS,
  type FontSlug,
  SECTION_TYPES,
  type SectionType,
  TEMPLATE_IDS,
  type TemplateId,
} from '../lib/cv-catalogue.js'

/**
 * The CV document's server-side shape and its coercion. Twin of the web's
 * `src/store/cvs/single/types.ts`. Pure (no I/O) and unit-tested.
 *
 * Every write goes through `coerceContent` / `coerceDesign`, which **coerce rather than
 * reject**: an unknown field is dropped, a missing one defaulted, an over-long string cut.
 * The editor autosaves on every pause, so a strict validator would turn one bad field into
 * a document that silently stops saving. What is never let through: a colour that is not
 * a hex value (it reaches a `style` attribute), a font or template outside the catalogue,
 * and a photo that is not a small base64 image data URL.
 */

export type BlockStyle = { background: string | null; text: string | null; heading: string | null; font: FontSlug | null }
export type CvEntry = {
  id: string
  title: string
  subtitle: string
  period: string
  location: string
  description: string
  url: string
}
export type CvTag = { id: string; name: string; level: number | null }
export type SectionColumn = 'auto' | 'main' | 'side'
export type CvSection = {
  id: string
  type: SectionType
  title: string
  hidden: boolean
  column: SectionColumn
  text: string
  entries: CvEntry[]
  tags: CvTag[]
  style: BlockStyle
}
export type CvBasics = {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  photo: string | null
  style: BlockStyle
}
export type CvContent = { basics: CvBasics; sections: CvSection[] }

export type CvPalette = {
  accent: string
  background: string
  text: string
  heading: string
  muted: string
  sidebarBackground: string
  sidebarText: string
}
export type CvDesign = {
  templateId: TemplateId
  palette: CvPalette
  headingFont: FontSlug
  bodyFont: FontSlug
  fontScale: number
  lineHeight: number
  spacing: 'compact' | 'normal' | 'relaxed'
  photoShape: 'circle' | 'rounded' | 'square'
  showPhoto: boolean
  showIcons: boolean
  levelStyle: 'dots' | 'bars' | 'text' | 'none'
}

export const CV_LIMITS = {
  title: 120,
  short: 200,
  long: 6000,
  sections: 24,
  entries: 40,
  tags: 60,
  /** A 400px JPEG data URL is ~40-80KB; this leaves room for a PNG without letting MBs in. */
  photo: 700_000,
  id: 40,
  /** Stored as typed; the web renders it only through toWebsiteUrl, which allows http(s) alone. */
  url: 500,
} as const

const HEX = /^#[0-9a-f]{6}$/i
const PHOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/
const ID = /^[A-Za-z0-9_-]{1,40}$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const str = (value: unknown, max: number): string => (typeof value === 'string' ? value.slice(0, max) : '')

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback

const hexOrNull = (value: unknown): string | null => (typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : null)

const hex = (value: unknown, fallback: string): string => hexOrNull(value) ?? fallback

const fontOrNull = (value: unknown): FontSlug | null =>
  typeof value === 'string' && (FONT_SLUGS as readonly string[]).includes(value) ? (value as FontSlug) : null

const num = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback

let idCounter = 0
const id = (value: unknown): string =>
  typeof value === 'string' && ID.test(value) ? value : `s${Date.now().toString(36)}${(idCounter++).toString(36)}`

const list = <T>(value: unknown, max: number, item: (raw: unknown) => T): T[] =>
  Array.isArray(value) ? value.slice(0, max).map(item) : []

export const coerceStyle = (raw: unknown): BlockStyle => {
  const value = isRecord(raw) ? raw : {}
  return {
    background: hexOrNull(value.background),
    text: hexOrNull(value.text),
    heading: hexOrNull(value.heading),
    font: fontOrNull(value.font),
  }
}

const coerceEntry = (raw: unknown): CvEntry => {
  const value = isRecord(raw) ? raw : {}
  return {
    id: id(value.id),
    title: str(value.title, CV_LIMITS.short),
    subtitle: str(value.subtitle, CV_LIMITS.short),
    period: str(value.period, CV_LIMITS.short),
    location: str(value.location, CV_LIMITS.short),
    description: str(value.description, CV_LIMITS.long),
    url: str(value.url, CV_LIMITS.url),
  }
}

const coerceTag = (raw: unknown): CvTag => {
  const value = isRecord(raw) ? raw : {}
  const level = typeof value.level === 'number' && Number.isFinite(value.level) ? Math.round(num(value.level, 0, 5, 0)) : null
  return { id: id(value.id), name: str(value.name, CV_LIMITS.short), level }
}

const coerceSection = (raw: unknown): CvSection => {
  const value = isRecord(raw) ? raw : {}
  return {
    id: id(value.id),
    type: oneOf(value.type, SECTION_TYPES, 'custom'),
    title: str(value.title, CV_LIMITS.short),
    hidden: value.hidden === true,
    column: oneOf(value.column, ['auto', 'main', 'side'] as const, 'auto'),
    text: str(value.text, CV_LIMITS.long),
    entries: list(value.entries, CV_LIMITS.entries, coerceEntry),
    tags: list(value.tags, CV_LIMITS.tags, coerceTag),
    style: coerceStyle(value.style),
  }
}

const coercePhoto = (value: unknown): string | null =>
  typeof value === 'string' && value.length <= CV_LIMITS.photo && PHOTO.test(value) ? value : null

export const coerceContent = (raw: unknown): CvContent => {
  const value = isRecord(raw) ? raw : {}
  const basics = isRecord(value.basics) ? value.basics : {}
  return {
    basics: {
      fullName: str(basics.fullName, CV_LIMITS.short),
      headline: str(basics.headline, CV_LIMITS.short),
      email: str(basics.email, CV_LIMITS.short),
      phone: str(basics.phone, CV_LIMITS.short),
      location: str(basics.location, CV_LIMITS.short),
      website: str(basics.website, CV_LIMITS.short),
      linkedin: str(basics.linkedin, CV_LIMITS.short),
      photo: coercePhoto(basics.photo),
      style: coerceStyle(basics.style),
    },
    sections: list(value.sections, CV_LIMITS.sections, coerceSection),
  }
}

/** Neutral fallbacks; a real document always arrives with its template's palette. */
const FALLBACK_PALETTE: CvPalette = {
  accent: '#2f4f7f',
  background: '#ffffff',
  text: '#2b2f36',
  heading: '#14171c',
  muted: '#6b7280',
  sidebarBackground: '#f3f4f6',
  sidebarText: '#2b2f36',
}

export const coerceDesign = (raw: unknown): CvDesign => {
  const value = isRecord(raw) ? raw : {}
  const palette = isRecord(value.palette) ? value.palette : {}
  return {
    templateId: oneOf(value.templateId, TEMPLATE_IDS, 'classic'),
    palette: {
      accent: hex(palette.accent, FALLBACK_PALETTE.accent),
      background: hex(palette.background, FALLBACK_PALETTE.background),
      text: hex(palette.text, FALLBACK_PALETTE.text),
      heading: hex(palette.heading, FALLBACK_PALETTE.heading),
      muted: hex(palette.muted, FALLBACK_PALETTE.muted),
      sidebarBackground: hex(palette.sidebarBackground, FALLBACK_PALETTE.sidebarBackground),
      sidebarText: hex(palette.sidebarText, FALLBACK_PALETTE.sidebarText),
    },
    headingFont: fontOrNull(value.headingFont) ?? 'mardoto',
    bodyFont: fontOrNull(value.bodyFont) ?? 'mardoto',
    fontScale: num(value.fontScale, 0.8, 1.25, 1),
    lineHeight: num(value.lineHeight, 1.1, 1.9, 1.45),
    spacing: oneOf(value.spacing, ['compact', 'normal', 'relaxed'] as const, 'normal'),
    photoShape: oneOf(value.photoShape, ['circle', 'rounded', 'square'] as const, 'circle'),
    showPhoto: value.showPhoto !== false,
    showIcons: value.showIcons !== false,
    levelStyle: oneOf(value.levelStyle, ['dots', 'bars', 'text', 'none'] as const, 'dots'),
  }
}

/** A CV's title when none was given. */
export const DEFAULT_CV_TITLE = 'Իմ ինքնակենսագրականը'

export const coerceTitle = (raw: unknown, fallback: string): string => {
  const title = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, CV_LIMITS.title) : ''
  return title || fallback
}
