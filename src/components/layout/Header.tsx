'use client'

import { type FC, useEffect, useState, useSyncExternalStore } from 'react'
import { MenuOutlined } from '@ant-design/icons'
import { Button, Drawer } from 'antd'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { ROUTES } from '@constants/routes'
import { cn } from '@helpers/cn'
import { clearGuestCvsMark, hasGuestCvs } from '@helpers/guestCvs'
import { AccountMenu } from './AccountMenu'
import { BrandLogo } from './BrandLogo'

type NavItem = { href: string; label: string }

/** localStorage has no change event within a tab; the flag only changes on a full navigation. */
const subscribeNever = (): (() => void) => () => undefined

export const Header: FC = () => {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const user = useAuthStore.use.user()
  // A guest who bought without an account gets the way back to those CVs (`helpers/guestCvs`).
  const guestCvs = useSyncExternalStore(subscribeNever, hasGuestCvs, () => false)
  const [open, setOpen] = useState(false)

  // Signed in: the API has moved this browser's guest CVs to the account.
  useEffect(() => {
    if (user) clearGuestCvsMark()
  }, [user])

  const items: NavItem[] = [
    { href: ROUTES.templates, label: t('templates') },
    { href: ROUTES.pricing, label: t('pricing') },
    ...(user || guestCvs ? [{ href: ROUTES.dashboard, label: t('dashboard') }] : []),
  ]

  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className='sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md'>
      <div className='mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-6'>
        <BrandLogo />
        <nav className='hidden items-center gap-1 md:flex' aria-label={t('menu')}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[15px] font-medium text-muted no-underline transition-colors hover:text-ink',
                isActive(item.href) && 'bg-surface text-ink shadow-sm'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className='ml-auto flex items-center gap-2'>
          <AccountMenu />
          <Link href={ROUTES.templates} className='hidden sm:block'>
            <Button type='primary' shape='round'>
              {t('createCv')}
            </Button>
          </Link>
          <Button
            className='md:hidden'
            type='text'
            icon={<MenuOutlined />}
            aria-label={t('menu')}
            onClick={() => setOpen(true)}
          />
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} placement='right' size='default' title={t('menu')}>
        <nav className='flex flex-col gap-1'>
          {[{ href: ROUTES.home, label: t('home') }, ...items].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className='rounded-lg px-3 py-2.5 text-base font-medium no-underline hover:bg-canvas'
            >
              {item.label}
            </Link>
          ))}
          <Link href={ROUTES.templates} onClick={() => setOpen(false)} className='mt-4'>
            <Button type='primary' block size='large'>
              {t('createCv')}
            </Button>
          </Link>
        </nav>
      </Drawer>
    </header>
  )
}
