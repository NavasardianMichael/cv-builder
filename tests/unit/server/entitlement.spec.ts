import { describe, expect, it } from 'vitest'
import { accessWindow } from '../../../server/src/services/entitlement'
import { isUnusedSince, RETENTION_DAYS, retentionCutoff } from '../../../server/src/services/retention'

const DAY = 24 * 60 * 60 * 1000
const T0 = Date.UTC(2026, 10, 1)
const at = (day: number): Date => new Date(T0 + day * DAY)
const paid = (id: string, day: number) => ({ id, paidAt: at(day) })

describe('accessWindow', () => {
  it('is empty with no payment', () => {
    expect(accessWindow([], 21)).toEqual({ until: null, chain: [] })
  })

  it('runs the pass days from the payment', () => {
    const window = accessWindow([paid('a', 0)], 21)
    expect(window.until).toEqual(at(21))
    expect(window.chain.map((p) => p.id)).toEqual(['a'])
  })

  it('adds a pass bought while one runs on top, whatever order the rows come in', () => {
    const window = accessWindow([paid('b', 10), paid('a', 0)], 21)
    expect(window.until).toEqual(at(42))
    expect(window.chain.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('starts a new window, from scratch, after one ran out', () => {
    const window = accessWindow([paid('a', 0), paid('b', 30)], 21)
    expect(window.until).toEqual(at(51))
    expect(window.chain.map((p) => p.id)).toEqual(['b'])
  })

  it('counts a payment made the moment the last one ends as a new window', () => {
    const window = accessWindow([paid('a', 0), paid('b', 21)], 21)
    expect(window.until).toEqual(at(42))
    expect(window.chain.map((p) => p.id)).toEqual(['b'])
  })
})

describe('retention', () => {
  const now = at(500)
  const cutoff = retentionCutoff(now)
  const longAgo = at(10)

  it('looks a year back', () => {
    expect(RETENTION_DAYS).toBe(365)
    expect(cutoff).toEqual(at(135))
  })

  it('removes only what was not used, not downloaded and had no access for the whole year', () => {
    expect(isUnusedSince({ lastUsedAt: longAgo, lastDownloadAt: null, accessUntil: null }, cutoff)).toBe(true)
    expect(isUnusedSince({ lastUsedAt: longAgo, lastDownloadAt: longAgo, accessUntil: at(31) }, cutoff)).toBe(true)
  })

  it('keeps it after any use, any download, or any access within the year', () => {
    expect(isUnusedSince({ lastUsedAt: at(400), lastDownloadAt: null, accessUntil: null }, cutoff)).toBe(false)
    expect(isUnusedSince({ lastUsedAt: longAgo, lastDownloadAt: at(400), accessUntil: null }, cutoff)).toBe(false)
    // A pass that ended inside the year counts: its days were in use.
    expect(isUnusedSince({ lastUsedAt: longAgo, lastDownloadAt: null, accessUntil: at(150) }, cutoff)).toBe(false)
  })
})
