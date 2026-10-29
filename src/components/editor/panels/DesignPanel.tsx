'use client'

import type { FC, ReactNode } from 'react'
import { ClearOutlined } from '@ant-design/icons'
import { App, Button, Segmented, Slider, Switch } from 'antd'
import { useTranslations } from 'next-intl'
import { useCvEditorStore } from '@store/cvs/single/store'
import type { CvLevelStyle, CvPalette, CvPhotoShape, CvSpacing } from '@store/cvs/single/types'
import { PALETTE_PRESETS } from '@constants/palettes'
import { TEMPLATES_WITH_SIDE_COLORS } from '@constants/templates'
import { cn } from '@helpers/cn'
import { ColorField } from '../controls/ColorField'
import { FontSelect } from '../controls/FontSelect'

const Group: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <section className='border-b border-line py-4 first:pt-0 last:border-0'>
    <h3 className='mb-3 text-xs font-semibold tracking-wider text-muted uppercase'>{title}</h3>
    {children}
  </section>
)

const samePalette = (a: CvPalette, b: CvPalette): boolean =>
  (Object.keys(a) as (keyof CvPalette)[]).every((key) => a[key] === b[key])

const COLOR_ROLES: (keyof CvPalette)[] = ['accent', 'background', 'text', 'heading', 'muted']
const SIDE_ROLES: (keyof CvPalette)[] = ['sidebarBackground', 'sidebarText']

/** Whole-CV design: palette, fonts, sizes, photo and level display. */
export const DesignPanel: FC = () => {
  const t = useTranslations('Editor.design')
  const design = useCvEditorStore.use.doc()?.design
  const setDesign = useCvEditorStore.use.setDesign()
  const setPalette = useCvEditorStore.use.setPalette()
  const resetBlockStyles = useCvEditorStore.use.resetBlockStyles()
  const { message } = App.useApp()
  if (!design) return null

  const roles = TEMPLATES_WITH_SIDE_COLORS.has(design.templateId) ? [...COLOR_ROLES, ...SIDE_ROLES] : COLOR_ROLES

  return (
    <div>
      <Group title={t('palettes')}>
        <ul className='m-0 grid list-none grid-cols-5 gap-2 p-0'>
          {PALETTE_PRESETS.map((preset) => {
            const active = samePalette(preset.palette, design.palette)
            return (
              <li key={preset.id}>
                <button
                  type='button'
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={active}
                  onClick={() => setPalette(preset.palette)}
                  className={cn(
                    'relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border-2 p-0 transition hover:scale-105',
                    active ? 'border-ink' : 'border-transparent'
                  )}
                  style={{ background: preset.palette.sidebarBackground }}
                >
                  <span className='absolute inset-x-0 bottom-0 h-1/2' style={{ background: preset.palette.accent }} />
                  <span className='absolute top-1.5 left-1.5 size-2.5 rounded-full' style={{ background: preset.palette.background }} />
                </button>
              </li>
            )
          })}
        </ul>
      </Group>

      <Group title={t('colors')}>
        {roles.map((role) => (
          <ColorField key={role} label={t(role)} value={design.palette[role]} onChange={(value) => value && setPalette({ [role]: value })} />
        ))}
      </Group>

      <Group title={t('fonts')}>
        <span className='mb-1 block text-sm text-muted'>{t('headingFont')}</span>
        <FontSelect value={design.headingFont} ariaLabel={t('headingFont')} onChange={(font) => font && setDesign({ headingFont: font })} />
        <span className='mt-3 mb-1 block text-sm text-muted'>{t('bodyFont')}</span>
        <FontSelect value={design.bodyFont} ariaLabel={t('bodyFont')} onChange={(font) => font && setDesign({ bodyFont: font })} />

        <span className='mt-4 block text-sm text-muted'>{t('fontScale')}</span>
        <Slider
          min={0.8}
          max={1.25}
          step={0.01}
          value={design.fontScale}
          tooltip={{ formatter: (value) => `${Math.round((value ?? 1) * 100)}%` }}
          onChange={(fontScale) => setDesign({ fontScale })}
        />
        <span className='block text-sm text-muted'>{t('lineHeight')}</span>
        <Slider min={1.1} max={1.9} step={0.05} value={design.lineHeight} onChange={(lineHeight) => setDesign({ lineHeight })} />
        <span className='mb-1 block text-sm text-muted'>{t('spacing')}</span>
        <Segmented<CvSpacing>
          block
          value={design.spacing}
          onChange={(spacing) => setDesign({ spacing })}
          options={(['compact', 'normal', 'relaxed'] as const).map((value) => ({ value, label: t(`spacingOptions.${value}`) }))}
        />
      </Group>

      <Group title={t('photo')}>
        <label className='flex items-center justify-between py-1 text-sm'>
          <span>{t('showPhoto')}</span>
          <Switch checked={design.showPhoto} onChange={(showPhoto) => setDesign({ showPhoto })} />
        </label>
        <Segmented<CvPhotoShape>
          className='mt-2'
          block
          disabled={!design.showPhoto}
          value={design.photoShape}
          onChange={(photoShape) => setDesign({ photoShape })}
          options={(['circle', 'rounded', 'square'] as const).map((value) => ({ value, label: t(`photoShapes.${value}`) }))}
        />
        <label className='mt-3 flex items-center justify-between py-1 text-sm'>
          <span>{t('showIcons')}</span>
          <Switch checked={design.showIcons} onChange={(showIcons) => setDesign({ showIcons })} />
        </label>
      </Group>

      <Group title={t('levelStyle')}>
        <Segmented<CvLevelStyle>
          block
          value={design.levelStyle}
          onChange={(levelStyle) => setDesign({ levelStyle })}
          options={(['dots', 'bars', 'text', 'none'] as const).map((value) => ({ value, label: t(`levelStyles.${value}`) }))}
        />
      </Group>

      <Button
        block
        icon={<ClearOutlined />}
        onClick={() => {
          resetBlockStyles()
          message.success(t('resetBlocksDone'))
        }}
      >
        {t('resetBlocks')}
      </Button>
    </div>
  )
}
