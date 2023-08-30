import { FC } from 'react'
import { UI_SIZES } from '../shared/constants'
import { UI_SIZE } from '../shared/types'
import { combineClassNames } from 'shared/helpers/commons'
import styles from './main.module.css'

type Props = {
  primary: boolean
  size: UI_SIZE
}

const initialProps: Props = {
    primary: true,
    size: UI_SIZES.md,
}

export const Button: FC<Partial<Props>> = ({
    primary = initialProps.primary,
    size = initialProps.size
}) => {
  return (
    <button className={combineClassNames(
        styles.button, 
        primary ? styles.primary : styles.secondary,
        styles[size]
    )}>
        Click Me!
    </button>
  )
}