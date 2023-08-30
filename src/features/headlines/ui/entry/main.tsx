import { FC } from 'react'
import { FullName } from '../fullName/main'
import { Bio } from '../bio/main'
import { Contacts } from '../contacts'
import { HeadlinesSlice } from 'features/headlines/model/types'

type Props = HeadlinesSlice

export const Headlines: FC<Props> = ({ fullName, bio, contacts }) => {
  return (
    <>
      <FullName fullName={fullName} />
      <Bio bio={bio} />
      <Contacts data={contacts}  />
    </>
  )
}