export type LeaveGuardState = {
  /** The ids of every active guard (`useLeaveGuard`); the page is guarded while any exist. */
  guards: string[]
  /** The open "leave this page?" question; `resolve` gets the user's answer. */
  question: { resolve: (leave: boolean) => void } | null
  /** The user agreed to leave: let the navigation through without asking again. */
  leaving: boolean
}

export type LeaveGuardActions = {
  setGuard: (id: string, active: boolean) => void
  /** Resolves true at once while nothing is guarded, otherwise once the user answers. */
  ask: () => Promise<boolean>
  answer: (leave: boolean) => void
}
