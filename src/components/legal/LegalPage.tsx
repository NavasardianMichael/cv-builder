import type { FC } from 'react'
import { getTranslations } from 'next-intl/server'
import type { LegalDocument } from '@constants/legal'

export const LegalPage: FC<{ document: LegalDocument }> = async ({ document }) => {
  const t = await getTranslations('Legal')
  return (
    <article className='mx-auto max-w-3xl px-4 py-14 md:px-6'>
      <h1 className='m-0 font-display text-4xl font-extrabold tracking-tight text-ink'>{document.title}</h1>
      <p className='mt-3 text-sm text-muted'>{t('updated', { date: document.updated })}</p>
      <p className='mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm'>{t('draftNotice')}</p>
      {document.sections.map((section) => (
        <section key={section.heading} className='mt-10'>
          <h2 className='m-0 text-xl font-bold text-ink'>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className='mt-3 mb-0 leading-relaxed text-text'>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  )
}
