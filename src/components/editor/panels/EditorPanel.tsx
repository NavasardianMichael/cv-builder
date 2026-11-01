'use client'

import type { FC, ReactNode } from 'react'
import { AppstoreOutlined, BgColorsOutlined, FormOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import { useTranslations } from 'next-intl'
import { ContentPanel } from './ContentPanel'
import { DesignPanel } from './DesignPanel'
import { SectionsPanel } from './SectionsPanel'
import { TemplatesPanel } from './TemplatesPanel'

/**
 * The editor's panels. `content` (the CV's text as a form) exists on phones and tablets only:
 * on a desktop the text is typed on the sheet itself.
 */
export type EditorTab = 'content' | 'templates' | 'design' | 'sections'

export const TAB_ICONS: Record<EditorTab, ReactNode> = {
  content: <FormOutlined />,
  templates: <AppstoreOutlined />,
  design: <BgColorsOutlined />,
  sections: <UnorderedListOutlined />,
}

/** One panel's contents. `focusBlock` opens that block in the content form. */
export const PanelBody: FC<{ tab: EditorTab; focusBlock?: string | null }> = ({ tab, focusBlock }) => {
  if (tab === 'content') return <ContentPanel focusBlock={focusBlock} />
  if (tab === 'templates') return <TemplatesPanel />
  if (tab === 'design') return <DesignPanel />
  return <SectionsPanel />
}

const DESKTOP_TABS: EditorTab[] = ['templates', 'design', 'sections']

/** The desktop settings column: template, design, sections. Unmounts inactive tabs. */
export const EditorPanel: FC = () => {
  const t = useTranslations('Editor.tabs')
  return (
    <Tabs
      defaultActiveKey='design'
      destroyOnHidden
      centered
      items={DESKTOP_TABS.map((tab) => ({
        key: tab,
        label: t(tab),
        icon: TAB_ICONS[tab],
        children: (
          <div className='px-5 pb-8'>
            <PanelBody tab={tab} />
          </div>
        ),
      }))}
    />
  )
}
