import { FC } from 'react'
import styles from './main.module.css'
import { Bio, Contacts, FullName } from 'features/headlines'
import { useAppSelector } from 'shared/hooks/useAppSelector'
import { selectCVData } from 'shared/selectors'

type Props = {}

export const Template1: FC<Props> = ({  }) => {
  const data = useAppSelector(selectCVData)

  return (
    <div className={styles.template1}>
      <div className={styles.headlineLeft}>
        <FullName fullName={data.headlines.fullName} />
        <Bio bio={data.headlines.bio} />
      </div>
      <div className={styles.headlineRight}>
        <Contacts data={data.headlines.contacts} />
      </div>
    </div>
  )
}