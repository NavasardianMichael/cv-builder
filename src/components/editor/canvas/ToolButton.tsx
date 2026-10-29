'use client'

import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { cn } from '@helpers/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; label: string; tone?: 'default' | 'danger' }

/** A square icon button for the dark toolbars floating over the CV. `title` doubles as its tooltip. */
export const ToolButton = forwardRef<HTMLButtonElement, Props>(({ icon, label, tone = 'default', className, ...rest }, ref) => (
  <button
    ref={ref}
    type='button'
    title={label}
    aria-label={label}
    className={cn(
      'grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-[13px] text-white/85 transition-colors',
      'hover:bg-white/15 hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent',
      tone === 'danger' && 'hover:bg-red-500/80',
      className
    )}
    {...rest}
  >
    {icon}
  </button>
))

ToolButton.displayName = 'ToolButton'

export const ToolbarShell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex items-center gap-0.5 rounded-lg bg-ink-deep p-1 shadow-lg ring-1 ring-black/10', className)}>
    {children}
  </div>
)
