'use client'

import type { FC } from 'react'
import { ColorPicker } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStoreBase } from '@store/cvs/single/store'
import { PALETTE_PRESETS } from '@constants/palettes'

type Props = {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  /** Offer a clear button: null means "inherit from the design". */
  clearable?: boolean
}

/**
 * A colour, as the CV stores it: `#rrggbb` (the API accepts six-digit hex only, so any alpha
 * is dropped). Presets are the current palette first, then every preset's accent.
 */
export const ColorField: FC<Props> = ({ label, value, onChange, clearable }) => {
  const t = useTranslations('Editor.design')
  const palette = useCvEditorStoreBase((state) => state.doc?.design.palette)

  const presets = [
    ...(palette ? [{ label: t('colors'), colors: Object.values(palette), defaultOpen: true }] : []),
    { label: t('palettes'), colors: PALETTE_PRESETS.map((preset) => preset.palette.accent), defaultOpen: false },
  ]

  return (
    <label className='flex items-center justify-between gap-3 py-1 text-sm'>
      <span className='text-muted'>{label}</span>
      <ColorPicker
        value={value ?? undefined}
        // An unset colour is antd's transparent default, which `disabledAlpha` warns about;
        // the slice below keeps any pick opaque `#rrggbb` either way.
        disabledAlpha={value !== null}
        allowClear={clearable}
        presets={presets}
        size='small'
        showText={(color) => (value ? color.toHexString().slice(0, 7).toUpperCase() : '—')}
        onChange={(color) => onChange(color.toHexString().slice(0, 7))}
        onClear={() => onChange(null)}
      />
    </label>
  )
}
