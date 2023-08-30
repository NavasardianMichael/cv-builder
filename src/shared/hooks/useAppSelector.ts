import { RootState } from 'app/store'
import type { TypedUseSelectorHook } from 'react-redux'
import { useSelector } from 'react-redux'

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector