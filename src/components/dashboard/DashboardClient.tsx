'use client'

import { type FC, useCallback, useEffect, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Empty, Skeleton } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCvsListStore } from '@store/cvs/list/store'
import type { Cv } from '@store/cvs/single/types'
import { usePdfDownload } from '@hooks/usePdfDownload'
import { ROUTES } from '@constants/routes'
import { classifyError, errorCopyKey } from '@helpers/error'
import { reportError } from '@helpers/reportError'
import { ErrorState } from '@components/ui/ErrorState'
import { CvCard } from './CvCard'

export const DashboardClient: FC = () => {
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')
  const tErrors = useTranslations('Errors')
  const list = useCvsListStore.use.list()
  const isLoaded = useCvsListStore.use.isLoaded()
  const getCvs = useCvsListStore.use.getCvs()
  const duplicateCv = useCvsListStore.use.duplicateCv()
  const deleteCv = useCvsListStore.use.deleteCv()
  const { message, modal } = App.useApp()
  const { download } = usePdfDownload()
  const [loadError, setLoadError] = useState<unknown>(null)

  const load = useCallback(
    () =>
      getCvs().catch((failure: unknown) => {
        reportError(failure, 'dashboard:list')
        setLoadError(failure)
      }),
    [getCvs]
  )

  useEffect(() => {
    void load()
  }, [load])

  const retry = () => {
    setLoadError(null)
    void load()
  }

  const showError = (failure: unknown) => message.error(tErrors(errorCopyKey(classifyError(failure))))

  const onDuplicate = (cv: Cv) =>
    duplicateCv(cv.id)
      .then(() => message.success(t('duplicated')))
      .catch(showError)

  const onDelete = (cv: Cv) =>
    modal.confirm({
      title: t('deleteTitle', { title: cv.title }),
      content: cv.paidAt ? t('deletePaid') : t('deleteText'),
      okText: tCommon('delete'),
      okButtonProps: { danger: true },
      cancelText: tCommon('cancel'),
      onOk: () =>
        deleteCv(cv.id)
          .then(() => message.success(t('deleted')))
          .catch(showError),
    })

  const cvs = list.allIds.map((id) => list.byId[id])

  const body = () => {
    if (loadError) return <ErrorState error={loadError} onRetry={retry} />
    if (!isLoaded) {
      return (
        <div className='mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton.Node key={index} active className='aspect-210/297 h-auto! w-full! rounded-2xl' />
          ))}
        </div>
      )
    }
    if (!cvs.length) {
      return (
        <Empty
          className='mt-20'
          description={
            <>
              <strong className='block text-lg text-ink'>{t('emptyTitle')}</strong>
              <span className='text-muted'>{t('emptyText')}</span>
            </>
          }
        >
          <Link href={ROUTES.templates}>
            <Button type='primary'>{t('new')}</Button>
          </Link>
        </Empty>
      )
    }
    return (
      <div className='mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 xl:grid-cols-4'>
        {cvs.map((cv) => (
          <CvCard key={cv.id} cv={cv} onDuplicate={onDuplicate} onDelete={onDelete} onDownload={(item) => void download(item.id, item.title)} />
        ))}
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-12 md:px-6'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='m-0 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl'>{t('title')}</h1>
          <p className='mt-2 mb-0 text-muted'>{t('subtitle')}</p>
        </div>
        <Link href={ROUTES.templates}>
          <Button type='primary' size='large' icon={<PlusOutlined />}>
            {t('new')}
          </Button>
        </Link>
      </div>
      {body()}
    </div>
  )
}
