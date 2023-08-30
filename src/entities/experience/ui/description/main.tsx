import { FC } from 'react'
import styles from './main.module.css'
import { Experience } from 'entities/experience/model/types';

type Props = Pick<Experience, 'description'>

export const Description: FC<Props> = ({ description }) => {

  if(!description) return null;

  return (
    <span className={styles.description}>
      {description}
    </span>
  )
}