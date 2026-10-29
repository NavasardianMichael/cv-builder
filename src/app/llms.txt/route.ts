import { APP_DESCRIPTION, APP_NAME, APP_NAME_LATIN } from '@constants/app'
import { FONT_SLUGS, FONTS } from '@constants/fonts'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { ROUTES, templatePath } from '@constants/routes'
import { TEMPLATE_LIST } from '@constants/templates'
import { buildLlmsTxt } from '@helpers/llmsTxt'
import { absoluteUrl } from '@helpers/url'

/**
 * `/llms.txt` — the site's index for AI answer engines: what the service is, what it costs,
 * and every template with a one-line description. Static: it changes only with a deploy.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  const body = buildLlmsTxt({
    title: `${APP_NAME} (${APP_NAME_LATIN})`,
    summary: `${APP_DESCRIPTION} Գինը՝ ${formatAmd(CV_PRICE_AMD)} մեկ ռեզյումեի համար (մեկանգամյա, առանց բաժանորդագրության)։ Armenian-language CV/resume builder for job seekers in Armenia: 12 templates, 20 Armenian fonts, in-place editing, one-time ${CV_PRICE_AMD} AMD per CV download.`,
    sections: [
      {
        title: 'Էջեր',
        links: [
          { name: 'Գլխավոր', url: absoluteUrl(ROUTES.home), note: 'ինչ է ծառայությունը, հաճախ տրվող հարցեր' },
          { name: 'Ձևանմուշներ', url: absoluteUrl(ROUTES.templates), note: 'բոլոր 12 ձևանմուշները' },
          { name: 'Գինը', url: absoluteUrl(ROUTES.pricing), note: `${formatAmd(CV_PRICE_AMD)} մեկ ռեզյումեի PDF-ի համար` },
        ],
      },
      {
        title: 'Ձևանմուշներ',
        links: TEMPLATE_LIST.map((template) => ({
          name: template.name,
          url: absoluteUrl(templatePath(template.id)),
          note: `${template.tagline}։ Հարմար է՝ ${template.bestFor.join(', ')}`,
        })),
      },
      {
        title: 'Տառատեսակներ',
        links: [
          {
            name: FONT_SLUGS.map((slug) => FONTS[slug].name).join(', '),
            url: 'https://fonter.am/en/fonts?sortby=popular',
            note: 'հայերեն տառատեսակներ fonter.am-ից, բոլորն անվճար առևտրային օգտագործման համար',
          },
        ],
      },
      {
        title: 'Իրավական',
        links: [
          { name: 'Օգտագործման պայմաններ', url: absoluteUrl(ROUTES.terms) },
          { name: 'Գաղտնիություն', url: absoluteUrl(ROUTES.privacy) },
          { name: 'Վերադարձ', url: absoluteUrl(ROUTES.refundPolicy) },
        ],
      },
    ],
  })

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
