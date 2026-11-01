import type { ReactElement } from 'react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { APP_NAME } from '@constants/app'
import { type TemplateId,TEMPLATES } from '@constants/templates'
import { getSiteUrl } from '@helpers/url'
import { APRICOT, CANVAS, INK } from '@styles/tokens'
import { brandMark } from './brandImage'

/** The size every share preview expects (Facebook, LinkedIn, Telegram, X large card). */
export const SOCIAL_CARD_SIZE = { width: 1200, height: 630 }

type CardFont = { name: string; data: Buffer; weight: 500 | 700; style: 'normal' }

/**
 * Satori reads TTF/OTF/WOFF but not woff2, hence the two Mardoto TTFs (fonter.am's own files)
 * kept in src/assets/og. Read at build time: every card is prerendered.
 */
export const loadCardFonts = async (): Promise<CardFont[]> => {
  const [medium, bold] = await Promise.all([
    readFile(path.join(process.cwd(), 'src/assets/og/Mardoto-Medium.ttf')),
    readFile(path.join(process.cwd(), 'src/assets/og/Mardoto-Bold.ttf')),
  ])
  return [
    { name: 'Mardoto', data: medium, weight: 500, style: 'normal' },
    { name: 'Mardoto', data: bold, weight: 700, style: 'normal' },
  ]
}

type Sheet = { id: TemplateId; left: number; top: number; width: number; tilt: number }

const bar = (width: number | string, height: number, color: string, opacity = 1): ReactElement => (
  <div style={{ display: 'flex', width, height, borderRadius: height, background: color, opacity }} />
)

/** A CV page in miniature, in the template's own colours and column layout. No text. */
const miniCv = ({ id, left, top, width, tilt }: Sheet): ReactElement => {
  const { layout, defaults } = TEMPLATES[id]
  const p = defaults.palette
  const unit = width / 100
  const height = width * 1.414

  const lines = (count: number, color: string, opacity: number): ReactElement => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2.4 * unit }}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={{ display: 'flex' }}>
          {bar(index === count - 1 ? '62%' : '100%', 1.6 * unit, color, opacity)}
        </div>
      ))}
    </div>
  )
  const section = (lineCount: number): ReactElement => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 * unit }}>
      {bar(26 * unit, 2.2 * unit, p.accent)}
      {lines(lineCount, p.text, 0.28)}
    </div>
  )
  const main = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 7 * unit, padding: 8 * unit }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2.6 * unit }}>
        {bar(layout === 'single' ? 58 * unit : 44 * unit, 4.4 * unit, p.heading)}
        {bar(30 * unit, 2.2 * unit, p.accent, 0.85)}
      </div>
      {section(4)}
      {section(3)}
      {section(3)}
    </div>
  )
  const side = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6 * unit,
        width: 34 * unit,
        padding: `${8 * unit}px ${5 * unit}px`,
        background: p.sidebarBackground,
      }}
    >
      <div style={{ display: 'flex', width: 18 * unit, height: 18 * unit, borderRadius: 18 * unit, background: p.sidebarText, opacity: 0.22 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2.4 * unit, width: '100%' }}>
        {bar('70%', 2 * unit, p.accent)}
        {lines(3, p.sidebarText, 0.4)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2.4 * unit, width: '100%' }}>
        {bar('60%', 2 * unit, p.accent)}
        {lines(3, p.sidebarText, 0.4)}
      </div>
    </div>
  )

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        display: 'flex',
        flexDirection: layout === 'side-right' ? 'row-reverse' : 'row',
        width,
        height,
        overflow: 'hidden',
        borderRadius: 2.4 * unit,
        background: p.background,
        boxShadow: '0 28px 56px -18px rgba(20, 24, 45, 0.45)',
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {layout === 'single' ? null : side}
      {main}
    </div>
  )
}

type CardProps = {
  heading: string
  subheading: string
  /** Small facts along the bottom, as pills. */
  facts: string[]
  sheets: Sheet[]
}

/** The share preview: brand, heading and facts on the left, CV sheets on the right. */
export const socialCard = ({ heading, subheading, facts, sheets }: CardProps): ReactElement => (
  <div
    style={{
      position: 'relative',
      display: 'flex',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: `radial-gradient(760px 520px at 88% 30%, ${APRICOT[100]}, ${CANVAS.base} 72%)`,
      fontFamily: 'Mardoto',
      color: INK[900],
    }}
  >
    {sheets.map(miniCv)}
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 660, padding: '60px 0 56px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {brandMark(60)}
        <span style={{ fontSize: 38, fontWeight: 700 }}>{APP_NAME}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.1 }}>{heading}</span>
        <span style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.3, color: INK[500] }}>{subheading}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {facts.map((fact) => (
            <span
              key={fact}
              style={{
                display: 'flex',
                padding: '8px 18px',
                borderRadius: 999,
                background: 'white',
                border: `1.5px solid ${INK[100]}`,
                fontSize: 22,
                fontWeight: 500,
                color: INK[700],
              }}
            >
              {fact}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {bar(44, 6, APRICOT[500])}
          <span style={{ fontSize: 22, fontWeight: 500, color: INK[500] }}>{getSiteUrl().replace(/^https?:\/\//, '')}</span>
        </div>
      </div>
    </div>
  </div>
)
