'use client'

import type { FC } from 'react'
import { AppstoreOutlined, BgColorsOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import { useTranslations } from 'next-intl'
import { DesignPanel } from './DesignPanel'
import { SectionsPanel } from './SectionsPanel'
import { TemplatesPanel } from './TemplatesPanel'

/** The editor's settings column: template, design, sections. Unmounts inactive tabs. */
export const EditorPanel: FC = () => {
  const t = useTranslations('Editor.tabs')
  return (
    <Tabs
      defaultActiveKey='design'
      destroyOnHidden
      centered
      items={[
        { key: 'templates', label: t('templates'), icon: <AppstoreOutlined />, children: <div className='px-5 pb-8'><TemplatesPanel /></div> },
        { key: 'design', label: t('design'), icon: <BgColorsOutlined />, children: <div className='px-5 pb-8'><DesignPanel /></div> },
        { key: 'sections', label: t('sections'), icon: <UnorderedListOutlined />, children: <div className='px-5 pb-8'><SectionsPanel /></div> },
      ]}
    />
  )
}
