import type { BreadcrumbList, FAQPage, ItemList, Organization, WebApplication, WebSite, WithContext } from 'schema-dts'
import { APP_DESCRIPTION, APP_NAME, APP_NAME_LATIN, LOCALE, SUPPORT_EMAIL } from '@constants/app'
import { CURRENCY, CV_PRICE_AMD } from '@constants/pricing'
import { templatePath } from '@constants/routes'
import { TEMPLATE_LIST } from '@constants/templates'
import { absoluteUrl } from '@helpers/url'

/**
 * JSON-LD for search and answer engines. Entity `@id`s are stable URLs with a fragment, so
 * every page that mentions the organisation or the app points at the same node.
 */
export const ORGANIZATION_ID = absoluteUrl('/#organization')
export const WEBSITE_ID = absoluteUrl('/#website')
export const APP_ID = absoluteUrl('/#app')

export const organizationSchema = (): WithContext<Organization> => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: APP_NAME,
  alternateName: APP_NAME_LATIN,
  url: absoluteUrl('/'),
  logo: absoluteUrl('/icon'),
  email: SUPPORT_EMAIL,
  areaServed: { '@type': 'Country', name: 'Armenia' },
})

export const websiteSchema = (): WithContext<WebSite> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: APP_NAME,
  url: absoluteUrl('/'),
  inLanguage: LOCALE,
  publisher: { '@id': ORGANIZATION_ID },
})

/** The product itself, with its two offers, so answer engines can quote what it costs. */
export const webApplicationSchema = (): WithContext<WebApplication> => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': APP_ID,
  name: APP_NAME,
  url: absoluteUrl('/'),
  description: APP_DESCRIPTION,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any (web browser)',
  inLanguage: LOCALE,
  isAccessibleForFree: true,
  publisher: { '@id': ORGANIZATION_ID },
  featureList: [
    '12 ինքնակենսագրականի ձևանմուշ',
    '20 հայերեն տառատեսակ',
    'Խմբագրում անմիջապես ինքնակենսագրականի վրա',
    'Գույնի, ֆոնի և տառատեսակի կարգավորում ամեն բաժնի համար',
    'PDF ներբեռնում ներկառուցված տառատեսակներով',
  ],
  offers: [
    {
      '@type': 'Offer',
      price: 0,
      priceCurrency: CURRENCY,
      description: 'Ինքնակենսագրականի պարզ սև-սպիտակ PDF ներբեռնում',
      availability: 'https://schema.org/InStock',
    },
    {
      '@type': 'Offer',
      price: CV_PRICE_AMD,
      priceCurrency: CURRENCY,
      description: 'Մեկ ինքնակենսագրականի ձևավորված PDF ներբեռնում, մեկանգամյա վճար',
      availability: 'https://schema.org/InStock',
    },
  ],
})

export const faqSchema = (items: { question: string; answer: string }[]): WithContext<FAQPage> => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: LOCALE,
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
})

export const breadcrumbSchema = (items: { name: string; path: string }[]): WithContext<BreadcrumbList> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

export const templatesListSchema = (): WithContext<ItemList> => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Ինքնակենսագրականի ձևանմուշներ',
  numberOfItems: TEMPLATE_LIST.length,
  itemListElement: TEMPLATE_LIST.map((template, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: absoluteUrl(templatePath(template.id)),
    name: template.name,
  })),
})
