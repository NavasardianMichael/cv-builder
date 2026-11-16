import type { FC } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { examplePath, guidePath, newCvPath, ROUTES } from '@constants/routes'
import { DEFAULT_TEMPLATE_ID, templateDesign } from '@constants/templates'
import { readingMinutes } from '@content/index'
import type { ContentSection, CvExample, Guide } from '@content/types'
import { contentFromSample } from '@helpers/cvFactory'
import { formatDay } from '@helpers/date'
import { CvPreview } from '@components/cv/CvPreview'
import { TemplateCardLink, TemplateCardPending } from '@components/templates/TemplateCardLink'
import { ArrowRightOutlined } from '@components/ui/icons'

/** Updated date and reading time, under a page's `<h1>`. `<time>` carries the machine date. */
export const ContentMeta: FC<{ page: Guide | CvExample }> = async ({ page }) => {
  const t = await getTranslations('Content')
  return (
    <p className='m-0 mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted'>
      <span>
        {t.rich('updated', { date: () => <time dateTime={page.updated}>{formatDay(page.updated)}</time> })}
      </span>
      <span>{t('readingTime', { minutes: readingMinutes(page) })}</span>
    </p>
  )
}

/** Jump links to a page's sections, and to its questions. */
export const TableOfContents: FC<{ sections: ContentSection[]; hasFaq: boolean }> = async ({ sections, hasFaq }) => {
  const t = await getTranslations('Content')
  if (sections.length < 3) return null
  const items = [...sections.map((section) => ({ id: section.id, label: section.heading })), ...(hasFaq ? [{ id: 'hartser', label: t('faqTitle') }] : [])]
  return (
    <nav aria-labelledby='toc-heading' className='mt-8 rounded-2xl bg-surface p-5 ring-1 ring-line'>
      <h2 id='toc-heading' className='m-0 text-sm font-semibold tracking-wider text-muted uppercase'>
        {t('toc')}
      </h2>
      <ol className='m-0 mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-[15px] marker:text-muted'>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className='text-ink no-underline hover:text-accent-strong hover:underline'>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Other phrasings of the page's subject, Latin-lettered among them: how people type it. */
export const SearchTerms: FC<{ terms: string[] }> = async ({ terms }) => {
  const t = await getTranslations('Content')
  return (
    <p className='m-0 mt-12 text-sm leading-relaxed text-muted'>
      {t('searchTerms')} {terms.join(', ')}
    </p>
  )
}

/** "Make yours now": the end of every content page. */
export const ContentCta: FC = async () => {
  const t = await getTranslations('Content')
  return (
    <section className='relative mt-14 overflow-hidden rounded-3xl bg-ink px-6 py-10 text-center sm:px-10'>
      <div className='pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-accent opacity-30 blur-3xl' aria-hidden='true' />
      <h2 className='text-balance relative m-0 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl'>{t('ctaTitle')}</h2>
      <p className='relative mx-auto mt-3 mb-0 max-w-xl text-white/80'>{t('ctaText')}</p>
      <div className='relative mt-6 flex flex-wrap justify-center gap-3'>
        <Link
          href={newCvPath(DEFAULT_TEMPLATE_ID)}
          className='inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-accent-strong'
        >
          {t('ctaButton')} <ArrowRightOutlined />
        </Link>
        <Link href={ROUTES.templates} className='inline-flex items-center rounded-full px-6 py-3 font-semibold text-white no-underline ring-1 ring-white/30 transition hover:bg-white/10'>
          {t('ctaTemplates')}
        </Link>
      </div>
    </section>
  )
}

export const GuideCard: FC<{ guide: Guide; headingLevel?: 'h2' | 'h3' }> = async ({ guide, headingLevel: Heading = 'h3' }) => {
  const t = await getTranslations('Content')
  return (
    <Link
      href={guidePath(guide.slug)}
      className='group flex h-full flex-col rounded-2xl bg-surface p-5 text-inherit no-underline ring-1 ring-line transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(20,24,45,0.35)] sm:p-6'
    >
      <Heading className='m-0 font-display text-lg font-bold text-ink group-hover:text-accent-strong'>{guide.shortTitle}</Heading>
      <p className='m-0 mt-2 flex-1 text-sm leading-relaxed text-muted'>{guide.description}</p>
      <span className='mt-4 text-xs font-medium text-muted'>{t('readingTime', { minutes: readingMinutes(guide) })}</span>
    </Link>
  )
}

/** An example's first page, drawn by the CV renderer, linking to its page. */
export const ExampleCard: FC<{ example: CvExample; headingLevel?: 'h2' | 'h3' }> = ({ example, headingLevel: Heading = 'h3' }) => (
  <TemplateCardLink href={examplePath(example.slug)} className='group block rounded-2xl text-inherit no-underline focus-visible:outline-offset-4'>
    <div className='relative overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_-12px_rgba(20,24,45,0.25)] ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_50px_-16px_rgba(20,24,45,0.35)]'>
      <CvPreview content={contentFromSample(example.cv)} design={templateDesign(example.templateId)} />
      <TemplateCardPending />
    </div>
    <div className='mt-4 px-1'>
      <Heading className='m-0 font-display text-lg font-bold text-ink'>{example.profession}</Heading>
      <p className='m-0 mt-1 text-sm text-muted'>{example.shortTitle}</p>
    </div>
  </TemplateCardLink>
)
