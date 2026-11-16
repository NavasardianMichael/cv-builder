import { APP_NAME, SUPPORT_ADDRESS, SUPPORT_EMAIL, SUPPORT_PHONE } from '@constants/app'
import { FONT_SLUGS, FONTS_SOURCE_URL } from '@constants/fonts'
import { formatAmd, PASS_DAYS, PASS_PRICE_AMD } from '@constants/pricing'
import { TEMPLATE_IDS } from '@constants/templates'
import type { ContentSection } from './types'

/**
 * `/about`: who is behind the guides and the builder, how the content is written, what is free
 * and what the data is used for — what a reader (and a search engine weighing whether to trust
 * the guides) looks for. Every claim here is one the code or the legal pages already make;
 * nothing names people the site does not name elsewhere.
 */
export const ABOUT = {
  title: 'Մեր մասին',
  metaTitle: `Մեր մասին․ ինչ է «${APP_NAME}» ծառայությունը`,
  description:
    'Ով ենք մենք և ինչու ենք ստեղծել հայերեն ինքնակենսագրականի կառուցիչը, ինչպես ենք գրում ուղեցույցներն ու օրինակները, ինչն է անվճար և ինչպես ենք պահում Ձեր տվյալները։',
  updated: '2026-11-16',
  intro: [
    `«${APP_NAME}» առցանց ծառայություն է Հայաստանում աշխատանք փնտրողների համար։ Մեր նպատակը պարզ է․ որ յուրաքանչյուրը կարողանա րոպեների ընթացքում պատրաստել կոկիկ, հայերեն ինքնակենսագրական՝ առանց դիզայնի ծրագրերի և առանց գրանցման։`,
  ],
  sections: [
    {
      id: 'inchu',
      heading: 'Ինչու ենք ստեղծել այս ծառայությունը',
      blocks: [
        {
          kind: 'p',
          text: 'Ինքնակենսագրականի կառուցիչներից շատերն աշխատում են անգլերենով կամ ռուսերենով, իսկ հայերեն տեքստի դեպքում տառատեսակները հաճախ չեն աջակցում հայերեն տառերը, և PDF-ում հայտնվում են անհասկանալի նշաններ։ Մենք ստեղծել ենք գործիք, որն ամբողջությամբ հայերեն է՝ ինտերֆեյսից մինչև տառատեսակներ․',
        },
        {
          kind: 'list',
          items: [
            `**${TEMPLATE_IDS.length} ձևանմուշ**՝ զուսպից մինչև գունավոր և նկարազարդ`,
            `**${FONT_SLUGS.length} հայերեն տառատեսակ** [fonter.am](${FONTS_SOURCE_URL})-ից, բոլորն անվճար առևտրային օգտագործման համար`,
            '**խմբագրում հենց թերթիկի վրա**՝ համակարգչով, պլանշետով և հեռախոսով',
            '**PDF**, որը ցանկացած սարքում բացվում է նույն տեսքով',
          ],
        },
      ],
    },
    {
      id: 'bovandakutyun',
      heading: 'Ինչպես ենք գրում ուղեցույցները և օրինակները',
      blocks: [
        {
          kind: 'p',
          text: 'Մեր [ուղեցույցները](/guides) և [ինքնակենսագրականի օրինակները](/examples) գրված են հայերեն և հարմարեցված են Հայաստանում աշխատանք փնտրողներին։ Օրինակներում ներկայացված մարդիկ և ընկերությունները հորինված են, իսկ բուհերը՝ իրական։ Լեզուների իմացության մակարդակների և Europass ձևաչափի մասին տեղեկությունները հղում են Եվրոպական միության պաշտոնական [Europass](https://europass.europa.eu/en) կայքին։',
        },
        {
          kind: 'p',
          text: 'Յուրաքանչյուր էջում նշված է վերջին թարմացման ամսաթիվը։ Եթե նկատել եք սխալ կամ ունեք առաջարկ, [գրեք մեզ](/contact)․ մենք կուղղենք այն հնարավորինս արագ։',
        },
      ],
    },
    {
      id: 'gin',
      heading: 'Ինչն է անվճար',
      blocks: [
        {
          kind: 'p',
          text: `Պարզ, սև-սպիտակ ձևանմուշով PDF-ն անվճար է բոլորի համար և միշտ։ Գունավոր, նկարով ձևանմուշների համար կա մեկանգամյա վճար՝ ${formatAmd(PASS_PRICE_AMD)}, որը բացում է լիարժեք հասանելիություն ${PASS_DAYS} օրով։ Սա բաժանորդագրություն չէ․ ոչինչ ինքնաշխատ չի գանձվում։ Մանրամասները՝ [Գինը](/pricing) էջում։`,
        },
      ],
    },
    {
      id: 'tvyalner',
      heading: 'Ձեր տվյալները',
      blocks: [
        {
          kind: 'p',
          text: 'Ինքնակենսագրական կարող եք ստեղծել առանց հաշվի․ մինչև մուտք գործելը սևագիրը պահվում է միայն Ձեր դիտարկիչում։ Մենք չենք վաճառում Ձեր տվյալները և չենք փոխանցում դրանք գովազդատուներին, իսկ մեկ տարի ընդհանրապես չօգտագործված տվյալները ջնջվում են ինքնաշխատ։ Մանրամասները՝ [Գաղտնիության քաղաքականությունում](/privacy)։',
        },
      ],
    },
    {
      id: 'kap',
      heading: 'Կապ',
      blocks: [
        {
          kind: 'list',
          items: [`**Էլ. փոստ**՝ ${SUPPORT_EMAIL}`, `**Հեռախոս**՝ ${SUPPORT_PHONE}`, `**Հասցե**՝ ${SUPPORT_ADDRESS}`],
        },
        {
          kind: 'p',
          text: 'Կարող եք գրել նաև [կապի էջից](/contact)։',
        },
      ],
    },
  ] satisfies ContentSection[],
}
