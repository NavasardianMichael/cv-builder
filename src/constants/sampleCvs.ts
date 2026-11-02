import type { ContactType } from '@constants/contacts'
import type { SectionType } from '@constants/sections'
import type { TemplateId } from '@constants/templates'

/**
 * The example CVs behind template previews and "start from an example": one person per kind of
 * reader, matched to each template's `bestFor`. Without them every template page shows the
 * same CV, which is most of its text — 42 pages a search engine reads as one.
 *
 * Document copy, like the templates' own. Plain data: `sampleContent` (`helpers/cvFactory`)
 * gives it ids and styles. People and employers are made up; universities are real.
 */

export type SampleEntry = { title: string; subtitle?: string; period?: string; location?: string; description?: string }

export type SampleSection = {
  type: SectionType
  /** Only where the section's default title does not fit (a `custom` section). */
  title?: string
  text?: string
  entries?: SampleEntry[]
  /** Name and level (0-5), or null for a tag without one. */
  tags?: [string, number | null][]
}

export type SampleCv = {
  fullName: string
  headline: string
  contacts: [ContactType, string][]
  sections: SampleSection[]
}

export type SampleId =
  | 'designer'
  | 'developer'
  | 'manager'
  | 'marketer'
  | 'lawyer'
  | 'accountant'
  | 'researcher'
  | 'teacher'
  | 'student'
  | 'doctor'
  | 'engineer'

export const DEFAULT_SAMPLE: SampleId = 'designer'

export const SAMPLE_CVS: Record<SampleId, SampleCv> = {
  designer: {
    fullName: 'Անի Հովհաննիսյան',
    headline: 'Ավագ արտադրանքի դիզայներ',
    contacts: [
      ['email', 'ani.hovhannisyan@mail.am'],
      ['phone', '+374 91 123 456'],
      ['location', 'Երևան, Հայաստան'],
      ['website', 'anihovhannisyan.am'],
      ['linkedin', 'linkedin.com/in/anihov'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Արտադրանքի դիզայներ՝ 7 տարվա փորձով ֆինտեք և էլեկտրոնային առևտրի ոլորտներում։ Սիրում եմ բարդ գործընթացները դարձնել պարզ և հաճելի, աշխատել հետազոտության տվյալներով և թիմի հետ գտնել լուծումներ, որոնք օգնում են և՛ օգտատիրոջը, և՛ բիզնեսին։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Ավագ արտադրանքի դիզայներ',
            subtitle: 'Արարատ Տեխ',
            period: '2021 – այժմ',
            location: 'Երևան',
            description:
              '• Ղեկավարել եմ բջջային բանկինգի հավելվածի վերանախագծումը՝ 1,2 մլն օգտատեր\n• Կրճատել եմ վճարման քայլերը 5-ից 2-ի, ինչը 18%-ով բարձրացրեց փոխարկումը\n• Ստեղծել և պահպանում եմ ընկերության դիզայն համակարգը',
          },
          {
            title: 'UX/UI դիզայներ',
            subtitle: 'Սևան Դիջիթալ',
            period: '2018 – 2021',
            location: 'Երևան',
            description:
              '• Նախագծել եմ 20+ վեբ և բջջային ինտերֆեյս տեղական և միջազգային հաճախորդների համար\n• Անցկացրել եմ օգտատերերի հարցազրույցներ և օգտագործելիության թեստեր',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          { title: 'Ինֆորմատիկայի մագիստրոս', subtitle: 'Երևանի պետական համալսարան', period: '2016 – 2018', location: 'Երևան' },
          { title: 'Դիզայնի բակալավր', subtitle: 'Հայաստանի ամերիկյան համալսարան', period: '2012 – 2016', location: 'Երևան' },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Figma', 5],
          ['Օգտատերերի հետազոտություն', 4],
          ['Դիզայն համակարգեր', 5],
          ['Պրոտոտիպավորում', 4],
          ['HTML/CSS', 3],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Անգլերեն', 4], ['Ռուսերեն', 4]] },
      { type: 'certificates', entries: [{ title: 'Google UX Design Certificate', subtitle: 'Coursera', period: '2020' }] },
      { type: 'interests', tags: [['Լեռնագնացություն', null], ['Լուսանկարչություն', null], ['Շախմատ', null]] },
    ],
  },

  developer: {
    fullName: 'Դավիթ Սարգսյան',
    headline: 'Ավագ backend ծրագրավորող',
    contacts: [
      ['email', 'davit.sargsyan@mail.am'],
      ['phone', '+374 93 456 789'],
      ['location', 'Երևան, Հայաստան'],
      ['github', 'github.com/davitsargsyan'],
      ['linkedin', 'linkedin.com/in/davitsargsyan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Backend ծրագրավորող՝ 6 տարվա փորձով բարձր ծանրաբեռնվածությամբ համակարգերում։ Նախագծում և զարգացնում եմ API-ներ ու միկրոծառայություններ, կարևորում եմ մաքուր կոդը, թեստերը և թիմում գիտելիքների փոխանակումը։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Ավագ backend ծրագրավորող',
            subtitle: 'Գառնի Սոֆթ',
            period: '2022 – այժմ',
            location: 'Երևան',
            description:
              '• Նախագծել եմ վճարումների ծառայությունը, որն օրական մշակում է 300 հազար գործարք\n• Տվյալների բազայի հարցումների օպտիմալացմամբ API-ի պատասխանի ժամանակը կրճատել եմ 40%-ով\n• Մենթոր եմ թիմի երեք կրտսեր ծրագրավորողների համար',
          },
          {
            title: 'Ծրագրավորող',
            subtitle: 'Լոռի Լաբս',
            period: '2019 – 2022',
            location: 'Երևան',
            description:
              '• Մշակել եմ ներքին CRM համակարգի REST API-ն\n• Ներդրել եմ ավտոմատ թեստավորում և CI/CD, ինչի շնորհիվ թողարկումները դարձան շաբաթական',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          {
            title: 'Ինֆորմատիկայի և կիրառական մաթեմատիկայի բակալավր',
            subtitle: 'Երևանի պետական համալսարան',
            period: '2015 – 2019',
            location: 'Երևան',
          },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Go', 5],
          ['Python', 5],
          ['PostgreSQL', 4],
          ['Docker և Kubernetes', 4],
          ['AWS', 3],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Անգլերեն', 4], ['Ռուսերեն', 3]] },
      {
        type: 'projects',
        entries: [
          {
            title: 'HTTP հարցումների քանակը սահմանափակող բաց կոդով գրադարան',
            subtitle: 'GitHub, 1200+ աստղ',
            period: '2021',
          },
        ],
      },
    ],
  },

  manager: {
    fullName: 'Արմեն Պետրոսյան',
    headline: 'Գործառնական տնօրեն',
    contacts: [
      ['email', 'armen.petrosyan@mail.am'],
      ['phone', '+374 99 234 567'],
      ['location', 'Երևան, Հայաստան'],
      ['linkedin', 'linkedin.com/in/armenpetrosyan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Ղեկավար՝ 12 տարվա փորձով մանրածախ առևտրի և լոգիստիկայի ոլորտներում։ Կառուցում եմ արդյունավետ թիմեր և գործընթացներ, որոնք ընկերությանը թույլ են տալիս աճել՝ առանց որակը կորցնելու։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Գործառնական տնօրեն',
            subtitle: 'Արագած Ռիթեյլ',
            period: '2019 – այժմ',
            location: 'Երևան',
            description:
              '• Ղեկավարում եմ 14 խանութից բաղկացած ցանցը՝ 220 աշխատակցով\n• Պահեստային ծախսերը կրճատել եմ 22%-ով՝ ներդնելով պաշարների կառավարման նոր համակարգ\n• Երեք տարում ընկերության շրջանառությունն աճել է կրկնակի',
          },
          {
            title: 'Լոգիստիկայի բաժնի ղեկավար',
            subtitle: 'Շիրակ Լոգիստիկ',
            period: '2013 – 2019',
            location: 'Երևան',
            description:
              '• Կազմակերպել եմ ապրանքների առաքումը Հայաստանի բոլոր մարզեր\n• Մշակել եմ մատակարարների ընտրության և գնահատման կարգը',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          { title: 'Բիզնեսի կառավարման մագիստրոս (MBA)', subtitle: 'Հայաստանի ամերիկյան համալսարան', period: '2011 – 2013', location: 'Երևան' },
          { title: 'Տնտեսագիտության բակալավր', subtitle: 'Հայաստանի պետական տնտեսագիտական համալսարան', period: '2007 – 2011', location: 'Երևան' },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Ռազմավարական պլանավորում', 5],
          ['Թիմի ղեկավարում', 5],
          ['Բյուջետավորում', 4],
          ['Գործընթացների օպտիմալացում', 5],
          ['Բանակցություններ', 4],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Ռուսերեն', 5], ['Անգլերեն', 4]] },
      { type: 'certificates', entries: [{ title: 'Lean Six Sigma Green Belt', subtitle: 'ASQ', period: '2018' }] },
    ],
  },

  marketer: {
    fullName: 'Մարիամ Գրիգորյան',
    headline: 'Թվային մարքեթինգի մասնագետ',
    contacts: [
      ['email', 'mariam.grigoryan@mail.am'],
      ['phone', '+374 77 345 678'],
      ['location', 'Երևան, Հայաստան'],
      ['website', 'mariamgrigoryan.am'],
      ['linkedin', 'linkedin.com/in/mariamgrigoryan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Մարքեթոլոգ՝ 5 տարվա փորձով բրենդների առաջխաղացման և սոցիալական ցանցերի ոլորտում։ Ստեղծում եմ արշավներ, որոնք իսկապես հետաքրքրում են մարդկանց, և դրանց արդյունքը չափում եմ թվերով։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Թվային մարքեթինգի մասնագետ',
            subtitle: 'Ծիրան Մեդիա',
            period: '2021 – այժմ',
            location: 'Երևան',
            description:
              '• Վարում եմ 8 բրենդի սոցիալական ցանցերը՝ ընդհանուր 450 հազար հետևորդով\n• Վերակազմավորել եմ գովազդային արշավները, ինչի շնորհիվ մեկ հայտի արժեքը նվազել է 35%-ով\n• Համակարգում եմ դիզայներների և կոպիրայթերների թիմը',
          },
          {
            title: 'SMM մասնագետ',
            subtitle: 'Գեղարդ Քոմյունիքեյշնս',
            period: '2019 – 2021',
            location: 'Երևան',
            description: '• Մշակել եմ բովանդակային պլաններ և գրել հրապարակումներ\n• Կազմակերպել եմ 15+ առցանց և առկա միջոցառում',
          },
        ],
      },
      {
        type: 'education',
        entries: [{ title: 'Լրագրության բակալավր', subtitle: 'Երևանի պետական համալսարան', period: '2015 – 2019', location: 'Երևան' }],
      },
      {
        type: 'skills',
        tags: [
          ['Meta Ads', 5],
          ['Google Analytics', 4],
          ['Կոպիրայթինգ', 5],
          ['Բովանդակության պլանավորում', 5],
          ['Canva', 4],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Անգլերեն', 5], ['Ռուսերեն', 3]] },
      { type: 'certificates', entries: [{ title: 'Google Ads Search Certification', subtitle: 'Google', period: '2022' }] },
      { type: 'interests', tags: [['Կինո', null], ['Ճանապարհորդություն', null], ['Պոդքասթներ', null]] },
    ],
  },

  lawyer: {
    fullName: 'Գոռ Մկրտչյան',
    headline: 'Փաստաբան',
    contacts: [
      ['email', 'gor.mkrtchyan@mail.am'],
      ['phone', '+374 91 567 890'],
      ['location', 'Երևան, Հայաստան'],
      ['linkedin', 'linkedin.com/in/gormkrtchyan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Փաստաբան՝ 9 տարվա փորձով քաղաքացիական և կորպորատիվ իրավունքի ոլորտներում։ Ներկայացնում եմ հաճախորդների շահերը դատարաններում և խորհրդատվություն եմ տրամադրում պայմանագրային ու աշխատանքային հարցերով։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Ավագ փաստաբան',
            subtitle: 'Արդար Լեքս իրավաբանական ընկերություն',
            period: '2019 – այժմ',
            location: 'Երևան',
            description:
              '• Ներկայացրել եմ հաճախորդների շահերը 60+ քաղաքացիական և տնտեսական գործով\n• Կազմում եմ գործարար պայմանագրեր և իրականացնում դրանց իրավական փորձաքննություն\n• Իրավաբանական խորհրդատվություն եմ տրամադրում փոքր և միջին բիզնեսին',
          },
          {
            title: 'Իրավախորհրդատու',
            subtitle: 'Ախթամար Բիլդ',
            period: '2015 – 2019',
            location: 'Երևան',
            description:
              '• Ապահովել եմ ընկերության գործունեության համապատասխանությունը օրենսդրությանը\n• Վարել եմ աշխատանքային վեճերով գործերը',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          { title: 'Իրավագիտության մագիստրոս', subtitle: 'Երևանի պետական համալսարան', period: '2013 – 2015', location: 'Երևան' },
          { title: 'Իրավագիտության բակալավր', subtitle: 'Երևանի պետական համալսարան', period: '2009 – 2013', location: 'Երևան' },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Քաղաքացիական իրավունք', 5],
          ['Կորպորատիվ իրավունք', 5],
          ['Պայմանագրերի կազմում', 5],
          ['Դատական ներկայացուցչություն', 4],
          ['Աշխատանքային իրավունք', 4],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Ռուսերեն', 5], ['Անգլերեն', 4]] },
      { type: 'certificates', entries: [{ title: 'Փաստաբանի արտոնագիր', subtitle: 'ՀՀ փաստաբանների պալատ', period: '2016' }] },
    ],
  },

  accountant: {
    fullName: 'Լիլիթ Ավետիսյան',
    headline: 'Գլխավոր հաշվապահ',
    contacts: [
      ['email', 'lilit.avetisyan@mail.am'],
      ['phone', '+374 94 678 901'],
      ['location', 'Երևան, Հայաստան'],
      ['linkedin', 'linkedin.com/in/lilitavetisyan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Հաշվապահ՝ 10 տարվա փորձով բանկային և արտադրական ոլորտներում։ Հաշվառումը վարում եմ ՀՀ օրենսդրությանը և ՖՀՄՍ-ին համապատասխան, աշխատում եմ ճշգրիտ և միշտ պահպանում եմ ժամկետները։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Գլխավոր հաշվապահ',
            subtitle: 'Դիլիջան Ֆուդս',
            period: '2020 – այժմ',
            location: 'Երևան',
            description:
              '• Ղեկավարում եմ հինգ հաշվապահից բաղկացած բաժինը\n• Պատրաստում եմ ամսական, եռամսյակային և տարեկան ֆինանսական հաշվետվությունները\n• Հաշվառումը տեղափոխել եմ նոր ծրագրային համակարգ՝ առանց տվյալների կորստի',
          },
          {
            title: 'Հաշվապահ',
            subtitle: 'Ձորագետ Բանկ',
            period: '2014 – 2020',
            location: 'Երևան',
            description:
              '• Վարել եմ հաճախորդների հաշիվների և գործարքների հաշվառումը\n• Մասնակցել եմ տարեկան արտաքին աուդիտների նախապատրաստմանը',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          {
            title: 'Հաշվապահական հաշվառման և աուդիտի բակալավր',
            subtitle: 'Հայաստանի պետական տնտեսագիտական համալսարան',
            period: '2010 – 2014',
            location: 'Երևան',
          },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['1C: Հաշվապահություն', 5],
          ['ՖՀՄՍ', 4],
          ['Հարկային հաշվետվություններ', 5],
          ['Excel', 5],
          ['Ֆինանսական վերլուծություն', 4],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Ռուսերեն', 4], ['Անգլերեն', 3]] },
      {
        type: 'certificates',
        entries: [{ title: 'Հաշվապահի որակավորման վկայական', subtitle: 'ՀՀ ֆինանսների նախարարություն', period: '2017' }],
      },
    ],
  },

  researcher: {
    fullName: 'Նարեկ Հակոբյան',
    headline: 'Ավագ գիտաշխատող, կենսաբան',
    contacts: [
      ['email', 'narek.hakobyan@mail.am'],
      ['phone', '+374 95 789 012'],
      ['location', 'Երևան, Հայաստան'],
      ['linkedin', 'linkedin.com/in/narekhakobyan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Մոլեկուլային կենսաբան, կենսաբանական գիտությունների թեկնածու։ Ուսումնասիրում եմ մանրէների դիմադրողականությունը հակաբիոտիկների նկատմամբ, դասավանդում եմ և ղեկավարում ուսանողների հետազոտական աշխատանքները։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Ավագ գիտաշխատող',
            subtitle: 'Երևանի պետական համալսարան, կենսաբանության ֆակուլտետ',
            period: '2018 – այժմ',
            location: 'Երևան',
            description:
              '• Ղեկավարում եմ միջազգային դրամաշնորհներով ֆինանսավորվող երկու հետազոտական նախագիծ\n• Հեղինակ եմ 14 գիտական հոդվածի, որից 9-ը՝ միջազգային ամսագրերում\n• Մանրէաբանության դասընթաց եմ վարում մագիստրանտների համար',
          },
          {
            title: 'Կրտսեր գիտաշխատող',
            subtitle: 'Կենսատեխնոլոգիայի գիտական կենտրոն',
            period: '2014 – 2018',
            location: 'Երևան',
            description:
              '• Մշակել և ներդրել եմ լաբորատոր հետազոտության նոր մեթոդիկա\n• Զեկուցումներով հանդես եմ եկել գիտաժողովներում Գերմանիայում, Ֆրանսիայում և Վրաստանում',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          { title: 'Կենսաբանական գիտությունների թեկնածու', subtitle: 'Երևանի պետական համալսարան', period: '2014 – 2017', location: 'Երևան' },
          { title: 'Կենսաբանության մագիստրոս', subtitle: 'Երևանի պետական համալսարան', period: '2012 – 2014', location: 'Երևան' },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Մոլեկուլային կլոնավորում', 5],
          ['ՊՇՌ վերլուծություն', 5],
          ['Վիճակագրական վերլուծություն (R)', 4],
          ['Գիտական հոդվածների գրում', 5],
          ['Դրամաշնորհային հայտերի կազմում', 4],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Անգլերեն', 5], ['Ռուսերեն', 4], ['Գերմաներեն', 2]] },
      {
        type: 'custom',
        title: 'Ընտրված հրապարակումներ',
        entries: [
          {
            title: 'Հակաբիոտիկային դիմադրողականության գեները Հայաստանի ջրային էկոհամակարգերում',
            subtitle: 'Biological Journal of Armenia',
            period: '2023',
          },
          { title: 'Սևանա լճի մանրէային համայնքների կառուցվածքը', subtitle: 'Microorganisms', period: '2021' },
        ],
      },
    ],
  },

  teacher: {
    fullName: 'Անահիտ Ղազարյան',
    headline: 'Հայոց լեզվի և գրականության ուսուցիչ',
    contacts: [
      ['email', 'anahit.ghazaryan@mail.am'],
      ['phone', '+374 98 890 123'],
      ['location', 'Երևան, Հայաստան'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Ուսուցիչ՝ 13 տարվա մանկավարժական փորձով։ Դասերս կառուցում եմ այնպես, որ աշակերտները սիրեն ընթերցանությունը, ազատ արտահայտեն իրենց մտքերը և սովորեն քննադատաբար մտածել։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Հայոց լեզվի և գրականության ուսուցիչ',
            subtitle: 'Երևանի թիվ 210 ավագ դպրոց',
            period: '2017 – այժմ',
            location: 'Երևան',
            description:
              '• Դասավանդում եմ 10–12-րդ դասարաններում\n• Իմ աշակերտներից 12-ը դարձել են հանրապետական առարկայական օլիմպիադայի մրցանակակիր\n• Ղեկավարում եմ դպրոցի գրական ակումբը և խմբագրում դպրոցական ամսագիրը',
          },
          {
            title: 'Հայոց լեզվի և գրականության ուսուցիչ',
            subtitle: 'Աշտարակի միջնակարգ դպրոց',
            period: '2013 – 2017',
            location: 'Աշտարակ',
            description:
              '• Դասավանդել եմ 5–9-րդ դասարաններում\n• Մշակել եմ ընթերցանության խթանման ծրագիր, որը ներառվել է դպրոցի ուսումնական պլանում',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          {
            title: 'Հայոց լեզվի և գրականության մագիստրոս',
            subtitle: 'Խաչատուր Աբովյանի անվան հայկական պետական մանկավարժական համալսարան',
            period: '2011 – 2013',
            location: 'Երևան',
          },
          {
            title: 'Հայոց լեզվի և գրականության բակալավր',
            subtitle: 'Խաչատուր Աբովյանի անվան հայկական պետական մանկավարժական համալսարան',
            period: '2007 – 2011',
            location: 'Երևան',
          },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Դասի պլանավորում', 5],
          ['Ինտերակտիվ մեթոդներ', 5],
          ['Ներառական կրթություն', 4],
          ['Google Classroom', 4],
          ['Դասղեկի աշխատանք', 5],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Ռուսերեն', 4], ['Անգլերեն', 3]] },
      {
        type: 'certificates',
        entries: [{ title: 'Ուսուցիչների ատեստավորման դասընթաց', subtitle: 'Կրթության ազգային ինստիտուտ', period: '2021' }],
      },
      { type: 'interests', tags: [['Պոեզիա', null], ['Թատրոն', null], ['Ազգագրություն', null]] },
    ],
  },

  student: {
    fullName: 'Տիգրան Հարությունյան',
    headline: 'Ֆինանսների ֆակուլտետի ուսանող',
    contacts: [
      ['email', 'tigran.harutyunyan@mail.am'],
      ['phone', '+374 55 901 234'],
      ['location', 'Երևան, Հայաստան'],
      ['linkedin', 'linkedin.com/in/tigranharutyunyan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Ֆինանսների ֆակուլտետի 4-րդ կուրսի ուսանող եմ։ Արագ եմ սովորում, սիրում եմ աշխատել թվերի հետ և փնտրում եմ առաջին աշխատանքս ֆինանսների կամ վերլուծության ոլորտում։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Պրակտիկանտ, ֆինանսական բաժին',
            subtitle: 'Վանաձոր Թրեյդ',
            period: '2025, հուլիս – սեպտեմբեր',
            location: 'Երևան',
            description:
              '• Օգնել եմ ամսական հաշվետվությունների պատրաստմանը\n• Excel-ում ստեղծել եմ ծախսերի հաշվառման աղյուսակ, որը բաժինը մինչ օրս օգտագործում է',
          },
          {
            title: 'Բարիստա',
            subtitle: 'Լուսաբաց սրճարան',
            period: '2024 – 2025',
            location: 'Երևան',
            description: '• Սպասարկել եմ օրական 150+ հաճախորդ\n• Սովորել եմ աշխատել թիմում և արագ որոշումներ կայացնել',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          {
            title: 'Ֆինանսների բակալավր (4-րդ կուրս)',
            subtitle: 'Հայաստանի պետական տնտեսագիտական համալսարան',
            period: '2023 – այժմ',
            location: 'Երևան',
          },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Excel', 4],
          ['Ֆինանսական վերլուծություն', 3],
          ['Power BI', 3],
          ['Թիմային աշխատանք', 5],
          ['Շփման հմտություններ', 4],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Անգլերեն', 4], ['Ռուսերեն', 3]] },
      {
        type: 'volunteering',
        entries: [
          {
            title: 'Կամավորների խմբի համակարգող',
            subtitle: 'Երևանյան մարաթոն',
            period: '2024',
            description: '• Համակարգել եմ 20 կամավորից բաղկացած խումբը',
          },
        ],
      },
      { type: 'interests', tags: [['Ֆուտբոլ', null], ['Շախմատ', null], ['Ներդրումներ', null]] },
    ],
  },

  doctor: {
    fullName: 'Սոնա Մանուկյան',
    headline: 'Մանկաբույժ',
    contacts: [
      ['email', 'sona.manukyan@mail.am'],
      ['phone', '+374 96 012 345'],
      ['location', 'Երևան, Հայաստան'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Մանկաբույժ՝ 6 տարվա կլինիկական փորձով։ Կարևորում եմ ուշադիր զրույցը ծնողների հետ և վստահելի կապը երեխաների հետ, որպեսզի այցը երեխայի համար լինի հանգիստ, իսկ բուժումը՝ հասկանալի ծնողների համար։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Մանկաբույժ',
            subtitle: 'Առողջ սերունդ բժշկական կենտրոն',
            period: '2022 – այժմ',
            location: 'Երևան',
            description:
              '• Ամսական ընդունում եմ 300+ փոքր պացիենտի\n• Վարում եմ մինչև 3 տարեկան երեխաների զարգացման պլանային հսկողությունը\n• Ծնողների համար դասընթացներ եմ անցկացնում երեխաներին առաջին օգնություն ցույց տալու վերաբերյալ',
          },
          {
            title: 'Տեղամասային մանկաբույժ',
            subtitle: 'Աբովյանի բժշկական կենտրոն',
            period: '2020 – 2022',
            location: 'Աբովյան',
            description:
              '• Հսկել եմ տեղամասի շուրջ 800 երեխայի առողջությունը\n• Կազմակերպել եմ պատվաստումների ժամանակացույցը և ծնողների խորհրդատվությունը',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          {
            title: 'Կլինիկական օրդինատուրա, մանկաբուժություն',
            subtitle: 'Մխիթար Հերացու անվան Երևանի պետական բժշկական համալսարան',
            period: '2017 – 2020',
            location: 'Երևան',
          },
          {
            title: 'Ընդհանուր բժշկություն',
            subtitle: 'Մխիթար Հերացու անվան Երևանի պետական բժշկական համալսարան',
            period: '2011 – 2017',
            location: 'Երևան',
          },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['Ախտորոշում', 5],
          ['Նորածինների խնամք', 5],
          ['Պատվաստումների կազմակերպում', 4],
          ['Առաջին բուժօգնություն', 5],
          ['Ծնողների խորհրդատվություն', 5],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Ռուսերեն', 4], ['Անգլերեն', 4]] },
      {
        type: 'certificates',
        entries: [{ title: 'Pediatric Advanced Life Support (PALS)', subtitle: 'American Heart Association', period: '2023' }],
      },
    ],
  },

  engineer: {
    fullName: 'Հայկ Վարդանյան',
    headline: 'Շինարար ինժեներ, նախագծի ղեկավար',
    contacts: [
      ['email', 'hayk.vardanyan@mail.am'],
      ['phone', '+374 97 123 789'],
      ['location', 'Երևան, Հայաստան'],
      ['linkedin', 'linkedin.com/in/haykvardanyan'],
    ],
    sections: [
      {
        type: 'summary',
        text: 'Շինարար ինժեներ՝ 10 տարվա փորձով բնակելի և հասարակական շենքերի նախագծման ու կառուցման ոլորտում։ Նախագծերը ղեկավարում եմ սկզբից մինչև շահագործման հանձնելը՝ պահպանելով ժամկետներն ու բյուջեն։',
      },
      {
        type: 'experience',
        entries: [
          {
            title: 'Նախագծի ղեկավար',
            subtitle: 'Արմավիր Շին',
            period: '2020 – այժմ',
            location: 'Երևան',
            description:
              '• Ղեկավարել եմ 12-հարկանի բնակելի համալիրի կառուցումը՝ 18 մլն դոլար բյուջեով\n• Համակարգում եմ 6 ենթակապալառուի և 80+ աշխատողի աշխատանքը\n• Նախագիծը հանձնել ենք ժամկետից երկու ամիս շուտ',
          },
          {
            title: 'Կոնստրուկտոր ինժեներ',
            subtitle: 'Կասկադ Նախագիծ',
            period: '2016 – 2020',
            location: 'Երևան',
            description:
              '• Կատարել եմ երկաթբետոնե կոնստրուկցիաների հաշվարկներ՝ սեյսմակայունության պահանջներին համապատասխան\n• Մշակել եմ 30+ շենքի կոնստրուկտիվ նախագծեր',
          },
        ],
      },
      {
        type: 'education',
        entries: [
          {
            title: 'Շինարարության մագիստրոս',
            subtitle: 'Երևանի ճարտարապետության և շինարարության ազգային համալսարան',
            period: '2014 – 2016',
            location: 'Երևան',
          },
          {
            title: 'Արդյունաբերական և քաղաքացիական շինարարության բակալավր',
            subtitle: 'Երևանի ճարտարապետության և շինարարության ազգային համալսարան',
            period: '2010 – 2014',
            location: 'Երևան',
          },
        ],
      },
      {
        type: 'skills',
        tags: [
          ['AutoCAD', 5],
          ['Revit', 4],
          ['ETABS / SAP2000', 4],
          ['Նախագծերի կառավարում', 5],
          ['Նախահաշիվների կազմում', 4],
        ],
      },
      { type: 'languages', tags: [['Հայերեն', 5], ['Ռուսերեն', 5], ['Անգլերեն', 3]] },
      { type: 'certificates', entries: [{ title: 'Project Management Professional (PMP)', subtitle: 'PMI', period: '2021' }] },
    ],
  },
}

/** Each template's example, picked from its `bestFor`. */
export const TEMPLATE_SAMPLES: Record<TemplateId, SampleId> = {
  classic: 'lawyer',
  modern: 'manager',
  minimal: 'designer',
  executive: 'manager',
  creative: 'marketer',
  elegant: 'teacher',
  tech: 'developer',
  timeline: 'engineer',
  compact: 'researcher',
  bold: 'marketer',
  academic: 'researcher',
  soft: 'student',
  corporate: 'accountant',
  ats: 'developer',
  portrait: 'accountant',
  euro: 'student',
  ribbon: 'student',
  bento: 'designer',
  midnight: 'developer',
  swiss: 'designer',
  manuscript: 'teacher',
  gazette: 'marketer',
  aurora: 'designer',
  sunset: 'marketer',
  neon: 'developer',
  prism: 'designer',
  masis: 'teacher',
  waves: 'doctor',
  blossom: 'teacher',
  memphis: 'designer',
  ornament: 'lawyer',
  blueprint: 'engineer',
  terrazzo: 'designer',
  popart: 'marketer',
  topo: 'researcher',
  botanic: 'doctor',
  cosmos: 'researcher',
  bauhaus: 'designer',
  candy: 'student',
  diagonal: 'manager',
  spectrum: 'marketer',
  ocean: 'researcher',
}
