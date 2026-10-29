import type { FC } from 'react'
import { getTranslations } from 'next-intl/server'

const STEPS = ['pick', 'write', 'download'] as const

export const Steps: FC = async () => {
  const t = await getTranslations('Home')
  return (
    <section className='bg-ink py-20 text-white' aria-labelledby='steps-title'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <h2 id='steps-title' className='text-center font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl'>
          {t('stepsTitle')}
        </h2>
        <ol className='m-0 mt-14 grid list-none gap-8 p-0 md:grid-cols-3'>
          {STEPS.map((step, index) => (
            <li key={step} className='relative rounded-2xl bg-white/5 p-8 ring-1 ring-white/10'>
              <span className='font-display text-5xl font-extrabold text-accent'>{index + 1}</span>
              <h3 className='mt-4 mb-2 text-xl font-bold text-white'>{t(`steps.${step}.title`)}</h3>
              <p className='m-0 leading-relaxed text-white/70'>{t(`steps.${step}.text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
