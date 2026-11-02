import { APP_DESCRIPTION, APP_NAME, APP_NAME_LATIN } from '@constants/app'
import { FONT_SLUGS, FONTS } from '@constants/fonts'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { ROUTES, templatePath } from '@constants/routes'
import { KEYWORDS_EN, KEYWORDS_RU } from '@constants/seo'
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
    summary: `${APP_DESCRIPTION} Պարզ, սև-սպիտակ, առանց նկարի ձևանմուշով PDF-ն անվճար է, պատրաստի, գունավոր, նկարով ձևանմուշով PDF-ը՝ ${formatAmd(CV_PRICE_AMD)} մեկ ինքնակենսագրականի համար (մեկանգամյա, առանց բաժանորդագրության)։`,
    // The site itself is Armenian-only; these say the same in the languages people ask in.
    details: [
      `In English: ${APP_NAME} (${APP_NAME_LATIN}) is an online builder for writing a CV (resume) in Armenian, for job seekers in Armenia and Armenian speakers abroad. Pick one of ${TEMPLATE_LIST.length} templates (from plain to gradient and illustrated-background designs), type straight onto the CV, and set colours, backgrounds and fonts (${FONT_SLUGS.length} Armenian fonts) per section. A PDF in the plain black-and-white template, without a photo, is free; a PDF in a ready-made colour template with a photo is a one-time ${CV_PRICE_AMD} AMD per CV, no subscription, and no account needed. Also searched as: ${KEYWORDS_EN.join(', ')}.`,
      `По-русски: ${APP_NAME} (${APP_NAME_LATIN}) — онлайн-конструктор резюме на армянском языке для тех, кто ищет работу в Армении, и армяноязычных соискателей за рубежом. ${TEMPLATE_LIST.length} шаблонов (от строгих до градиентных и с иллюстрированным фоном), редактирование прямо на резюме, цвета, фоны и шрифты (${FONT_SLUGS.length} армянских шрифтов) для каждого раздела. PDF в простом чёрно-белом шаблоне без фото — бесплатно; PDF в готовом цветном шаблоне с фото — ${CV_PRICE_AMD} драмов один раз за резюме, без подписки и без регистрации. Также ищут как: ${KEYWORDS_RU.join(', ')}.`,
    ],
    sections: [
      {
        title: 'Էջեր',
        links: [
          { name: 'Գլխավոր', url: absoluteUrl(ROUTES.home), note: 'ինչ է ծառայությունը, հաճախ տրվող հարցեր' },
          {
            name: 'Ձևանմուշներ',
            url: absoluteUrl(ROUTES.templates),
            note: `բոլոր ${TEMPLATE_LIST.length} ձևանմուշները`,
          },
          {
            name: 'Գինը',
            url: absoluteUrl(ROUTES.pricing),
            note: `պարզ, սև-սպիտակ, առանց նկարի ձևանմուշով PDF՝ անվճար, պատրաստի, գունավոր, նկարով ձևանմուշով PDF՝ ${formatAmd(CV_PRICE_AMD)} մեկ ինքնակենսագրականի համար`,
          },
          { name: 'Կապ մեզ հետ', url: absoluteUrl(ROUTES.contact), note: 'հարցեր և առաջարկներ' },
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

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
