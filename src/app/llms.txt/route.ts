import { APP_DESCRIPTION, APP_NAME, APP_NAME_LATIN } from '@constants/app'
import { FONT_SLUGS, FONTS } from '@constants/fonts'
import { formatAmd, PASS_DAYS, PASS_PRICE_AMD } from '@constants/pricing'
import { examplePath, guidePath, ROUTES, templatePath } from '@constants/routes'
import { KEYWORDS_EN, KEYWORDS_RU } from '@constants/seo'
import { TEMPLATE_LIST } from '@constants/templates'
import { CV_EXAMPLES, GUIDES } from '@content/index'
import { buildLlmsTxt } from '@helpers/llmsTxt'
import { absoluteUrl } from '@helpers/url'

/**
 * `/llms.txt` — the site's index for AI answer engines: what the service is, what it costs,
 * and every template with a one-line description. Static: it changes only with a deploy.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  const price = formatAmd(PASS_PRICE_AMD)
  const body = buildLlmsTxt({
    title: `${APP_NAME} (${APP_NAME_LATIN})`,
    summary: `${APP_DESCRIPTION} Պարզ, սև-սպիտակ, առանց նկարի ձևանմուշով PDF-ն անվճար է բոլորի համար և միշտ։ ${price} մեկ վճարով՝ լիարժեք հասանելիություն ${PASS_DAYS} օրով․ Ձեր բոլոր ինքնակենսագրականների PDF-ները ցանկացած պատրաստի, գունավոր, նկարով ձևանմուշով, առանց սահմանափակման։ Բաժանորդագրություն չէ․ ոչինչ ինքնաշխատ չի գանձվում, ժամկետի ավարտից հետո ոչինչ չի ջնջվում, իսկ շուտ գնելիս նոր օրերը գումարվում են մնացածին։`,
    // The site itself is Armenian-only; these say the same in the languages people ask in.
    details: [
      `In English: ${APP_NAME} (${APP_NAME_LATIN}) is an online builder for writing a CV (resume) in Armenian, for job seekers in Armenia and Armenian speakers abroad. Pick one of ${TEMPLATE_LIST.length} templates (from plain to gradient and illustrated-background designs), type straight onto the CV, and set colours, backgrounds and fonts (${FONT_SLUGS.length} Armenian fonts) per section. A PDF in the plain black-and-white template, without a photo, is free for anyone, always. One payment of ${PASS_PRICE_AMD} AMD opens full access for ${PASS_DAYS} days: unlimited PDFs of every CV you have or make, in any ready-made colour template with a photo. It is not a subscription: nothing renews or charges automatically, buying again while access runs adds ${PASS_DAYS} days on top, and when it ends nothing is deleted. No account needed. Also searched as: ${KEYWORDS_EN.join(', ')}.`,
      `По-русски: ${APP_NAME} (${APP_NAME_LATIN}) — онлайн-конструктор резюме на армянском языке для тех, кто ищет работу в Армении, и армяноязычных соискателей за рубежом. ${TEMPLATE_LIST.length} шаблонов (от строгих до градиентных и с иллюстрированным фоном), редактирование прямо на резюме, цвета, фоны и шрифты (${FONT_SLUGS.length} армянских шрифтов) для каждого раздела. PDF в простом чёрно-белом шаблоне без фото — бесплатно для всех и всегда. Один платёж ${PASS_PRICE_AMD} драмов открывает полный доступ на ${PASS_DAYS} дней: PDF всех ваших резюме в любом готовом цветном шаблоне с фото, без ограничений. Это не подписка: ничего не продлевается и не списывается автоматически, повторная покупка до окончания доступа добавляет ещё ${PASS_DAYS} дней, а по окончании ничего не удаляется. Регистрация не нужна. Также ищут как: ${KEYWORDS_RU.join(', ')}.`,
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
            note: `պարզ, սև-սպիտակ, առանց նկարի ձևանմուշով PDF՝ անվճար․ լիարժեք հասանելիություն ${PASS_DAYS} օրով՝ ${price}, բոլոր պատրաստի, գունավոր, նկարով ձևանմուշները բոլոր ինքնակենսագրականների համար`,
          },
          { name: 'Կապ մեզ հետ', url: absoluteUrl(ROUTES.contact), note: 'հարցեր և առաջարկներ' },
        ],
      },
      {
        title: 'Ուղեցույցներ',
        links: GUIDES.map((guide) => ({ name: guide.title, url: absoluteUrl(guidePath(guide.slug)), note: guide.description })),
      },
      {
        title: 'Ինքնակենսագրականի օրինակներ',
        links: CV_EXAMPLES.map((example) => ({ name: example.title, url: absoluteUrl(examplePath(example.slug)), note: example.description })),
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
