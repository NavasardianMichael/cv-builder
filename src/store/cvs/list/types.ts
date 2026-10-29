import type { Cv } from '@store/cvs/single/types'
import type { Normalized } from '@interfaces/commons'
import type { StateCommonProps } from '@interfaces/store'

export type CvsListState = {
  list: Normalized<Cv>
  /** Whether the list has been fetched at least once. */
  isLoaded: boolean
} & StateCommonProps

export type CvsListActions = {
  getCvs: () => Promise<void>
  duplicateCv: (id: string) => Promise<Cv>
  deleteCv: (id: string) => Promise<void>
}
