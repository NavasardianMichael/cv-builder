'use client'

import type { FC } from 'react'
import { LogoutOutlined, SettingOutlined, SnippetsOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Dropdown, type MenuProps, Skeleton } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@store/auth/store'
import { ROUTES } from '@constants/routes'
import { initialsOf } from '@helpers/cvStyle'
import { classifyError, errorCopyKey } from '@helpers/error'

/** Sign-in button for a guest, avatar menu for a user, a placeholder while the session resolves. */
export const AccountMenu: FC = () => {
  const t = useTranslations('Nav')
  const tErrors = useTranslations('Errors')
  const user = useAuthStore.use.user()
  const isResolved = useAuthStore.use.isResolved()
  const logout = useAuthStore.use.logout()
  const router = useRouter()
  const { message } = App.useApp()

  if (!isResolved) return <Skeleton.Avatar active />

  if (!user) {
    return (
      <Link href={ROUTES.signIn}>
        <Button type='text'>{t('signIn')}</Button>
      </Link>
    )
  }

  const items: MenuProps['items'] = [
    { key: 'name', label: <span className='font-semibold'>{user.fullName}</span>, disabled: true },
    { type: 'divider' },
    { key: 'dashboard', icon: <SnippetsOutlined />, label: <Link href={ROUTES.dashboard}>{t('dashboard')}</Link> },
    { key: 'account', icon: <SettingOutlined />, label: <Link href={ROUTES.account}>{t('account')}</Link> },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('signOut'),
      onClick: () => {
        logout()
          .then(() => router.push(ROUTES.home))
          .catch((error: unknown) => message.error(tErrors(errorCopyKey(classifyError(error)))))
      },
    },
  ]

  return (
    <Dropdown menu={{ items }} placement='bottomRight' trigger={['click']}>
      <button type='button' className='cursor-pointer rounded-full border-0 bg-transparent p-0' aria-label={user.fullName}>
        <Avatar src={user.avatarUrl ?? undefined} className='bg-ink'>
          {initialsOf(user.fullName)}
        </Avatar>
      </button>
    </Dropdown>
  )
}
