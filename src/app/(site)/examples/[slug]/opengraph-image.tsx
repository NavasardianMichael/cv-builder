import { loadCardFonts, SOCIAL_CARD_SIZE, socialCard } from '@app/socialCard'
import { ImageResponse } from 'next/og'
import { APP_NAME } from '@constants/app'
import { TEMPLATES } from '@constants/templates'
import { CV_EXAMPLES, findExample } from '@content/index'

type Props = { params: Promise<{ slug: string }> }

export const alt = `${APP_NAME} — ինքնակենսագրականի օրինակ`
export const size = SOCIAL_CARD_SIZE
export const contentType = 'image/png'

/** Prerendered for every example, like the page itself. */
export function generateStaticParams() {
  return CV_EXAMPLES.map((example) => ({ slug: example.slug }))
}

/** An example's share preview: the profession, and two pages of the template it is shown in. */
export default async function ExampleOpengraphImage({ params }: Props) {
  const example = findExample((await params).slug) ?? CV_EXAMPLES[0]
  const id = example.templateId
  return new ImageResponse(
    socialCard({
      heading: example.profession,
      subheading: 'Ինքնակենսագրականի օրինակ հայերեն',
      facts: [`«${TEMPLATES[id].name}» ձևանմուշ`, 'Բացեք և լրացրեք', 'PDF'],
      sheets: [
        { id, left: 760, top: 150, width: 262, tilt: -6 },
        { id, left: 880, top: 96, width: 282, tilt: 4 },
      ],
    }),
    { ...size, fonts: await loadCardFonts() }
  )
}
