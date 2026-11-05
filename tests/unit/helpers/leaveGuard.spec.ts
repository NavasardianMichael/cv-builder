import { beforeEach, describe, expect, it } from 'vitest'
import { useLeaveGuardStoreBase } from '@store/navigation/guard/store'

const store = () => useLeaveGuardStoreBase.getState()

describe('leave guard', () => {
  beforeEach(() => {
    store().setGuard('editor', false)
    store().setGuard('other', false)
  })

  it('lets a navigation through at once while nothing is unsaved', async () => {
    await expect(store().ask()).resolves.toBe(true)
    expect(store().question).toBeNull()
  })

  it('holds a navigation until the user answers', async () => {
    store().setGuard('editor', true)
    const stay = store().ask()
    expect(store().question).not.toBeNull()
    store().answer(false)
    await expect(stay).resolves.toBe(false)
    expect(store().leaving).toBe(false)

    const leave = store().ask()
    store().answer(true)
    await expect(leave).resolves.toBe(true)
    // Agreed once: the page load that follows does not ask again.
    expect(store().leaving).toBe(true)
    await expect(store().ask()).resolves.toBe(true)
  })

  it('starts afresh once nothing is unsaved, so the next change asks again', async () => {
    store().setGuard('editor', true)
    const leave = store().ask()
    store().answer(true)
    await leave
    store().setGuard('editor', false)
    expect(store().leaving).toBe(false)

    store().setGuard('editor', true)
    void store().ask()
    expect(store().question).not.toBeNull()
  })

  it('drops an open question when the changes get saved under it', async () => {
    store().setGuard('editor', true)
    const pending = store().ask()
    store().setGuard('editor', false)
    await expect(pending).resolves.toBe(false)
    expect(store().question).toBeNull()
  })

  it('answers a superseded question with "stay"', async () => {
    store().setGuard('editor', true)
    const first = store().ask()
    const second = store().ask()
    await expect(first).resolves.toBe(false)
    store().answer(true)
    await expect(second).resolves.toBe(true)
  })

  it('stays guarded while any guard is up, and registers each id once', () => {
    store().setGuard('editor', true)
    store().setGuard('editor', true)
    store().setGuard('other', true)
    expect(store().guards).toEqual(['editor', 'other'])
    store().setGuard('editor', false)
    expect(store().guards).toEqual(['other'])
  })
})
