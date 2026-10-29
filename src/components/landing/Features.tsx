import type { FC, ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import {
  BgColorsOutlined,
  EditOutlined,
  FilePdfOutlined,
  FontSizeOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@components/ui/icons'

const FEATURES: { key: string; icon: ReactNode }[] = [
  { key: 'inline', icon: <EditOutlined /> },
  { key: 'style', icon: <BgColorsOutlined /> },
  { key: 'fonts', icon: <FontSizeOutlined /> },
  { key: 'pdf', icon: <FilePdfOutlined /> },
  { key: 'privacy', icon: <SafetyCertificateOutlined /> },
  { key: 'once', icon: <WalletOutlined /> },
]

export const Features: FC = async () => {
  const t = await getTranslations('Home')
  return (
    <section className='mx-auto max-w-7xl px-4 py-20 md:px-6' aria-labelledby='features-title'>
      <div className='mx-auto max-w-2xl text-center'>
        <h2 id='features-title' className='text-balance font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl'>
          {t('featuresTitle')}
        </h2>
        <p className='mt-4 text-lg text-muted'>{t('featuresSubtitle')}</p>
      </div>
      <ul className='m-0 mt-14 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3'>
        {FEATURES.map((feature) => (
          <li key={feature.key} className='rounded-2xl bg-surface p-7 ring-1 ring-line transition hover:shadow-lg'>
            <span className='grid size-12 place-items-center rounded-xl bg-accent-soft text-xl text-accent-strong' aria-hidden='true'>
              {feature.icon}
            </span>
            <h3 className='mt-5 mb-2 text-lg font-bold text-ink'>{t(`features.${feature.key}.title`)}</h3>
            <p className='m-0 leading-relaxed text-muted'>{t(`features.${feature.key}.text`)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
