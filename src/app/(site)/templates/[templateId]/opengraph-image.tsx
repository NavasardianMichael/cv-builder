import { loadCardFonts, SOCIAL_CARD_SIZE, socialCard } from '@app/socialCard'
import { ImageResponse } from 'next/og'
import { APP_NAME } from '@constants/app'
import { isTemplateId, TEMPLATE_IDS, TEMPLATES } from '@constants/templates'

type Props = { params: Promise<{ templateId: string }> }

export const alt = `${APP_NAME} — ինքնակենսագրականի ձևանմուշ`
export const size = SOCIAL_CARD_SIZE
export const contentType = 'image/png'

/** Prerendered for every template, like the page itself. */
export function generateStaticParams() {
  return TEMPLATE_IDS.map((templateId) => ({ templateId }))
}

/** A template's share preview: its name, its tagline, and two pages in its own colours. */
export default async function TemplateOpengraphImage({ params }: Props) {
  const { templateId } = await params
  const id = isTemplateId(templateId) ? templateId : 'modern'
  const template = TEMPLATES[id]
  return new ImageResponse(
    socialCard({
      heading: `«${template.name}» ձևանմուշ`,
      subheading: template.tagline,
      facts: template.bestFor,
      sheets: [
        { id, left: 760, top: 150, width: 262, tilt: -6 },
        { id, left: 880, top: 96, width: 282, tilt: 4 },
      ],
    }),
    { ...size, fonts: await loadCardFonts() }
  )
}
