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

/** Every modal and confirm dialog opens in the middle of the screen; set here, not per modal. */
const MODAL_CONFIG = { centered: true }

export const App: FC<PropsWithChildren> = ({ children }) => (
  <ConfigProvider theme={antdTheme} locale={hyAM} modal={MODAL_CONFIG}>
    {/* component={false}: context only, no wrapper element — enables App.useApp(). */}
    <AntApp component={false}>
      <AuthBootstrap />
      {children}
    </AntApp>
  </ConfigProvider>
)
