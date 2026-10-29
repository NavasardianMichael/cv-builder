'use client'

import { type FC, useState } from 'react'
import { GoogleOutlined } from '@ant-design/icons'
import { App, Button, Form, Input, Popconfirm, Skeleton, Tag } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { changePasswordAPI, deleteMeAPI, updateMeAPI } from '@api/auth/main'
import { useAuthStore } from '@store/auth/store'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@constants/auth'
import { ROUTES } from '@constants/routes'
import { ErrorAlert } from '@components/ui/ErrorAlert'
import { passwordRules } from '../auth/passwordRules'

const Card: FC<{ title: string; children: React.ReactNode; tone?: 'danger' }> = ({ title, children, tone }) => (
  <section className={`rounded-2xl bg-surface p-6 ring-1 ${tone === 'danger' ? 'ring-danger/30' : 'ring-line'}`}>
    <h2 className={`m-0 mb-5 text-lg font-bold ${tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{title}</h2>
    {children}
  </section>
)

export const AccountClient: FC = () => {
  const t = useTranslations('Account')
  const tAuth = useTranslations('Auth')
  const tCommon = useTranslations('Common')
  const user = useAuthStore.use.user()
  const setUser = useAuthStore.use.setUser()
  const router = useRouter()
  const { message } = App.useApp()
  const [busy, setBusy] = useState<'profile' | 'password' | 'delete' | null>(null)
  const [error, setError] = useState<{ form: string; error: unknown } | null>(null)
  const [passwordForm] = Form.useForm()

  if (!user) return <Skeleton active className='mx-auto max-w-2xl px-4 py-12' />

  const run = async (form: 'profile' | 'password' | 'delete', action: () => Promise<void>) => {
    setError(null)
    setBusy(form)
    try {
      await action()
    } catch (failure) {
      setError({ form, error: failure })
    } finally {
      setBusy(null)
    }
  }

  const errorFor = (form: string) => (error?.form === form ? <ErrorAlert error={error.error} className='mb-4' /> : null)

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12'>
      <h1 className='m-0 font-display text-3xl font-extrabold text-ink'>{t('title')}</h1>

      <Card title={t('profile')}>
        <Form
          layout='vertical'
          requiredMark={false}
          initialValues={{ fullName: user.fullName }}
          onFinish={({ fullName }: { fullName: string }) =>
            run('profile', async () => {
              setUser(await updateMeAPI({ fullName: fullName.trim() }))
              message.success(t('saved'))
            })
          }
        >
          <Form.Item label={tAuth('email')}>
            <Input value={user.email} disabled />
          </Form.Item>
          <Form.Item name='fullName' label={tAuth('fullName')} rules={[{ required: true, whitespace: true, message: tAuth('required') }]}>
            <Input maxLength={100} />
          </Form.Item>
          {errorFor('profile')}
          <Button type='primary' htmlType='submit' loading={busy === 'profile'}>
            {tCommon('save')}
          </Button>
        </Form>
      </Card>

      <Card title={t('passwordSection')}>
        {user.hasGoogle && (
          <Tag icon={<GoogleOutlined />} className='mb-4'>
            {t('googleLinked')}
          </Tag>
        )}
        <Form
          form={passwordForm}
          layout='vertical'
          requiredMark={false}
          onFinish={(values: { currentPassword?: string; newPassword: string }) =>
            run('password', async () => {
              setUser(await changePasswordAPI(values))
              passwordForm.resetFields()
              message.success(t('passwordChanged'))
            })
          }
        >
          {user.hasPassword && (
            <Form.Item name='currentPassword' label={tAuth('currentPassword')} rules={[{ required: true, message: tAuth('required') }]}>
              <Input.Password autoComplete='current-password' />
            </Form.Item>
          )}
          <Form.Item
            name='newPassword'
            label={tAuth('newPassword')}
            extra={tAuth('passwordHint', { min: PASSWORD_MIN_LENGTH })}
            rules={passwordRules(tAuth('required'), tAuth('weakPassword', { min: PASSWORD_MIN_LENGTH }))}
          >
            <Input.Password autoComplete='new-password' maxLength={PASSWORD_MAX_LENGTH} />
          </Form.Item>
          {errorFor('password')}
          <Button htmlType='submit' loading={busy === 'password'}>
            {user.hasPassword ? t('changePassword') : t('setPassword')}
          </Button>
        </Form>
      </Card>

      <Card title={t('danger')} tone='danger'>
        <p className='mt-0 text-muted'>{t('dangerText')}</p>
        {errorFor('delete')}
        <Popconfirm
          title={t('deleteConfirm')}
          okButtonProps={{ danger: true }}
          onConfirm={() =>
            run('delete', async () => {
              await deleteMeAPI()
              setUser(null)
              router.replace(ROUTES.home)
            })
          }
        >
          <Button danger loading={busy === 'delete'}>
            {t('deleteAccount')}
          </Button>
        </Popconfirm>
      </Card>
    </div>
  )
}
