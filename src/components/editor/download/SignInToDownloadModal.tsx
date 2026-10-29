'use client'

import type { FC } from 'react'
import { Button, Divider, Modal } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { DRAFT_ID } from '@store/cvs/single/types'
import { CHECKOUT_QUERY, editorPath, RETURN_TO_QUERY, ROUTES } from '@constants/routes'
import { GoogleButton } from '@components/auth/GoogleButton'

/** Where a guest comes back to: their draft, which is imported and opens the checkout. */
const RETURN_TO = `${editorPath(DRAFT_ID)}?${CHECKOUT_QUERY}=1`

/** A guest asked to download: they sign in first, so the purchase belongs to an account. */
export const SignInToDownloadModal: FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const t = useTranslations('Editor.download')
  const tAuth = useTranslations('Auth')
  const tCommon = useTranslations('Common')
  const query = `?${RETURN_TO_QUERY}=${encodeURIComponent(RETURN_TO)}`

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={t('signInTitle')} width={440} centered>
      <p className='mb-5 text-muted'>{t('signInText')}</p>
      <div className='flex flex-col gap-3'>
        <GoogleButton returnTo={RETURN_TO} />
        <Divider plain className='my-1 text-xs text-muted'>
          {tCommon('or')}
        </Divider>
        <Link href={`${ROUTES.signIn}${query}`}>
          <Button block size='large' type='primary'>
            {t('signInEmail')}
          </Button>
        </Link>
        <p className='text-center text-sm text-muted'>
          {tAuth('noAccount')}{' '}
          <Link href={`${ROUTES.signUp}${query}`} className='font-semibold text-ink'>
            {tAuth('signUpTitle')}
          </Link>
        </p>
      </div>
    </Modal>
  )
}
