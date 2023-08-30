import { FC } from 'react'
import { FullName } from '../fullName/main'
import { Bio } from '../bio/main'
import { Contacts } from '../contacts'
import { SectionComponentProps } from 'shared/types/sections'

type Props = SectionComponentProps<'headlines'>

export const Headlines: FC<Props> = (props) => {
  return (
    <>
      <FullName />
      <Bio />
      <Contacts />
    </>
  )
}