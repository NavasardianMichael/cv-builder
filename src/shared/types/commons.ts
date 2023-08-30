import { ReactNode } from 'react'

export type PropsWithOptionalChildren<P = unknown> = P & { children?: ReactNode };

export type NormalizedShape<T extends { id: string }> = {
    byId: Record<T['id'], T>
    allIds: T['id'][]
}