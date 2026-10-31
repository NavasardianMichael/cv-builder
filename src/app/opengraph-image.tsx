import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { APP_NAME } from '@constants/app'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { TEMPLATE_IDS } from '@constants/templates'
import { APRICOT, CANVAS, INK } from '@styles/tokens'
import { brandMark } from './brandImage'

export const alt = `${APP_NAME} — Հայերեն ինքնակենսագրականի կառուցիչ`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Satori reads TTF/OTF/WOFF but not woff2, hence the one TTF kept in src/assets/og. */
const loadFont = (): Promise<Buffer> => readFile(path.join(process.cwd(), 'src/assets/og/Mardoto-Bold.ttf'))

export default async function OpengraphImage() {
  const font = await loadFont()
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 72,
        background: `radial-gradient(900px 500px at 100% 0%, ${APRICOT[100]}, ${CANVAS.base} 60%)`,
        fontFamily: 'Mardoto',
        color: INK[900],
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {brandMark(84)}
        <span style={{ fontSize: 56 }}>{APP_NAME}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span style={{ fontSize: 68, lineHeight: 1.1 }}>Ինքնակենսագրական, որը նման է Ձեզ</span>
        <span style={{ fontSize: 34, color: INK[500] }}>
          {TEMPLATE_IDS.length} ձևանմուշ · 20 հայերեն տառատեսակ · {formatAmd(CV_PRICE_AMD)} մեկ անգամ
        </span>
      </div>
      <div style={{ display: 'flex', width: 220, height: 10, borderRadius: 5, background: APRICOT[500] }} />
    </div>,
    { ...size, fonts: [{ name: 'Mardoto', data: font, weight: 700, style: 'normal' }] }
  )
}
