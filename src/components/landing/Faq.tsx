import type { FC } from 'react'
import { getTranslations } from 'next-intl/server'
import { CV_PRICE_AMD, formatAmd } from '@constants/pricing'
import { faqSchema } from '@linkedDataSchema/site'
import { JsonLd } from '@components/seo/JsonLd'
import { PlusOutlined } from '@components/ui/icons'

const FAQ_KEYS = ['price', 'after', 'payment', 'account', 'fonts', 'ats'] as const

/**
 * Questions people (and answer engines) actually ask, as native `<details>` — readable with
 * no JavaScript — plus the matching FAQPage JSON-LD built from the same strings.
 */
export const Faq: FC<{ title?: string }> = async ({ title }) => {
  const t = await getTranslations('Faq')
  const tHome = await getTranslations('Home')
  const price = formatAmd(CV_PRICE_AMD)
  const items = FAQ_KEYS.map((key) => ({ key, question: t(`${key}.q`), answer: t(`${key}.a`, { price }) }))

  return (
    <section className='mx-auto max-w-3xl px-4 py-20 md:px-6' aria-labelledby='faq-title'>
      <JsonLd data={faqSchema(items)} />
      <h2 id='faq-title' className='text-center font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl'>
        {title ?? tHome('faqTitle')}
      </h2>
      <div className='mt-10 flex flex-col gap-3'>
        {items.map((item) => (
          <details key={item.key} className='group rounded-2xl bg-surface p-5 ring-1 ring-line open:shadow-md'>
            <summary className='flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden'>
              {item.question}
              <PlusOutlined className='shrink-0 text-accent transition group-open:rotate-45' />
            </summary>
            <p className='m-0 mt-3 leading-relaxed text-muted'>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
