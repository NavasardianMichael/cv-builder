import { useEffect, useId } from 'react'
import { useLeaveGuardStoreBase } from '@store/navigation/guard/store'

/**
 * Asks before the page is left while `active` — unsaved changes in the editor. Closing the
 * tab, reloading or leaving the site gets the browser's own dialog; links and the back button
 * get ours (`LeaveGuard`, which must be mounted on the same page).
 */
export const useLeaveGuard = (active: boolean): void => {
  const id = useId()
  const setGuard = useLeaveGuardStoreBase((state) => state.setGuard)

  useEffect(() => {
    setGuard(id, active)
    return () => setGuard(id, false)
  }, [id, active, setGuard])
}

/**
 * For a navigation that is not a link (a router call behind a button): asks the question if
 * anything is guarded. True when there is nothing to ask or the user agreed.
 */
export const confirmLeave = (): Promise<boolean> => useLeaveGuardStoreBase.getState().ask()
