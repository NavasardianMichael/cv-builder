'use client'

import type { FC } from 'react'
import { UndoOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useTranslations } from 'next-intl'
import type { BlockStyle } from '@store/cvs/single/types'
import { emptyStyle } from '@helpers/cvFactory'
import { hasBlockStyle } from '@helpers/cvStyle'
import { ColorField } from './ColorField'
import { FontSelect } from './FontSelect'

type Props = {
  title: string
  style: BlockStyle
  onChange: (style: Partial<BlockStyle>) => void
}

/** One block's overrides: background, text and heading colour, typeface. Empty = inherit. */
export const BlockStyleForm: FC<Props> = ({ title, style, onChange }) => {
  const t = useTranslations('Editor.block')
  return (
    <div className='w-64'>
      <p className='mb-2 text-sm font-semibold'>{title}</p>
      <ColorField label={t('background')} value={style.background} clearable onChange={(background) => onChange({ background })} />
      <ColorField label={t('textColor')} value={style.text} clearable onChange={(text) => onChange({ text })} />
      <ColorField label={t('headingColor')} value={style.heading} clearable onChange={(heading) => onChange({ heading })} />
      <div className='mt-2'>
        <span className='mb-1 block text-sm text-muted'>{t('font')}</span>
        <FontSelect value={style.font} placeholder={t('inherit')} ariaLabel={t('font')} onChange={(font) => onChange({ font })} />
      </div>
      <Button
        className='mt-3'
        size='small'
        block
        icon={<UndoOutlined />}
        disabled={!hasBlockStyle(style)}
        onClick={() => onChange(emptyStyle())}
      >
        {t('reset')}
      </Button>
    </div>
  )
}
