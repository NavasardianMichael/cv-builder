'use client'

import { type FC, type PropsWithChildren, useEffect } from 'react'
import { App as AntApp, ConfigProvider } from 'antd'
import hyAM from 'antd/locale/hy_AM'
import { useAuthStoreBase } from '@store/auth/store'
import { antdTheme } from '@styles/theme'

/** Resolves the session once per page load; every island then reads it from the store. */
const AuthBootstrap: FC = () => {
  useEffect(() => {
    const { isResolved, getMe } = useAuthStoreBase.getState()
    if (!isResolved) void getMe()
  }, [])
  return null
}

export const App: FC<PropsWithChildren> = ({ children }) => (
  <ConfigProvider theme={antdTheme} locale={hyAM}>
    {/* component={false}: context only, no wrapper element — enables App.useApp(). */}
    <AntApp component={false}>
      <AuthBootstrap />
      {children}
    </AntApp>
  </ConfigProvider>
)
