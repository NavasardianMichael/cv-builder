import { FC } from 'react'
import { Section } from 'shared/ui/section/main'
import styles from './main.module.css'
import { useAppSelector } from 'shared/hooks/useAppSelector'
import { selectTemplates } from 'widgets/CV/model/selectors'
import { TEMPLATE_COMPONENTS } from './constants'

type Props = {}

export const CV: FC<Props> = ({  }) => {

  const { selectedTemplate } = useAppSelector(selectTemplates)
  
  const Template = TEMPLATE_COMPONENTS[selectedTemplate]

  return (
    <div className={styles.cv}>
      <Template />
    </div>
  )
}