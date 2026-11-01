'use client'

import type { FC, ReactNode } from 'react'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { cn } from '@helpers/cn'
import { type EditorTab, TAB_ICONS } from './panels/EditorPanel'

type Props = {
  /** The panel open in the bottom sheet, if any. */
  openTab: EditorTab | null
  onOpenTab: (tab: EditorTab) => void
  previewing: boolean
  onPreviewChange: (previewing: boolean) => void
}

const TABS: EditorTab[] = ['content', 'templates', 'design', 'sections']

const BarButton: FC<{ icon: ReactNode; label: string; active: boolean; onClick: () => void; pressed?: boolean }> = ({
  icon,
  label,
  active,
  onClick,
  pressed,
}) => (
  <button
    type='button'
    aria-pressed={pressed}
    onClick={onClick}
    className={cn(
      'relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-0 bg-transparent px-1 pt-2 pb-1.5 text-muted transition-colors',
      active && 'text-ink'
    )}
  >
    {active && <span className='absolute inset-x-1/4 top-0 h-0.5 rounded-full bg-accent' aria-hidden='true' />}
    <span className='text-lg leading-none'>{icon}</span>
    <span className={cn('max-w-full truncate text-[11px] leading-tight', active && 'font-semibold')}>{label}</span>
  </button>
)

/**
 * Phones and tablets: the editor's panels and preview at the thumb, app-style, where the
 * desktop has a settings column and a preview button. Each tab opens its panel as a sheet.
 */
export const EditorBottomBar: FC<Props> = ({ openTab, onOpenTab, previewing, onPreviewChange }) => {
  const t = useTranslations('Editor')
  return (
    <nav
      className='flex shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden'
      aria-label={t('editorTools')}
    >
      {TABS.map((tab) => (
        <BarButton key={tab} icon={TAB_ICONS[tab]} label={t(`tabs.${tab}`)} active={openTab === tab} onClick={() => onOpenTab(tab)} />
      ))}
      <BarButton
        icon={previewing ? <EditOutlined /> : <EyeOutlined />}
        label={previewing ? t('previewExit') : t('previewShort')}
        active={previewing}
        pressed={previewing}
        onClick={() => onPreviewChange(!previewing)}
      />
    </nav>
  )
}
