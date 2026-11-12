import { accessWindow } from './entitlement.js'
import { paidPasses } from './payments.js'
import { PASS_DAYS } from './pricing.js'
import { DAY_MS, isUnusedSince, RETENTION_DAYS, retentionCutoff } from './retention.js'
import { prisma } from '../lib/prisma.js'
import type { CvOwner } from '../middleware/auth.js'

/**
 * Applies the retention policy (services/retention.ts): deletes accounts — with their CVs —
 * and guests' CVs that have gone wholly unused for `RETENTION_DAYS`: not used, not downloaded,
 * no access running. Candidates are found by their last use, then each is checked for the
 * other two, so a download or a pass within the year always keeps it.
 */
export const purgeUnused = async (now = new Date()): Promise<{ users: number; guestCvs: number }> => {
  const cutoff = retentionCutoff(now)
  const accessUntil = async (owner: CvOwner): Promise<Date | null> => accessWindow(await paidPasses(owner), PASS_DAYS).until

  let users = 0
  const staleUsers = await prisma.user.findMany({ where: { lastActiveAt: { lt: cutoff } }, select: { id: true, lastActiveAt: true } })
  for (const user of staleUsers) {
    const lastDownload = await prisma.pdfDownload.findFirst({
      where: { cv: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    const facts = { lastUsedAt: user.lastActiveAt, lastDownloadAt: lastDownload?.createdAt ?? null, accessUntil: await accessUntil({ userId: user.id }) }
    if (!isUnusedSince(facts, cutoff)) continue
    await prisma.user.delete({ where: { id: user.id } })
    users += 1
  }

  let guestCvs = 0
  const staleGuestCvs = await prisma.cv.findMany({
    where: { userId: null, updatedAt: { lt: cutoff } },
    select: { id: true, guestKeyHash: true, updatedAt: true },
  })
  const guestAccess = new Map<string, Date | null>()
  for (const cv of staleGuestCvs) {
    let until: Date | null = null
    if (cv.guestKeyHash) {
      if (!guestAccess.has(cv.guestKeyHash)) guestAccess.set(cv.guestKeyHash, await accessUntil({ guestKeyHash: cv.guestKeyHash }))
      until = guestAccess.get(cv.guestKeyHash) ?? null
    }
    const lastDownload = await prisma.pdfDownload.findFirst({ where: { cvId: cv.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
    if (!isUnusedSince({ lastUsedAt: cv.updatedAt, lastDownloadAt: lastDownload?.createdAt ?? null, accessUntil: until }, cutoff)) continue
    await prisma.cv.delete({ where: { id: cv.id } })
    guestCvs += 1
  }

  return { users, guestCvs }
}

const SWEEP_EVERY_MS = DAY_MS
/** Not at boot: a deploy restarting the API should not also be the moment it deletes. */
const FIRST_SWEEP_MS = 10 * 60 * 1000

const sweep = async (): Promise<void> => {
  try {
    const removed = await purgeUnused()
    if (removed.users || removed.guestCvs) {
      console.info(`[retention] removed ${removed.users} account(s) and ${removed.guestCvs} guest CV(s) unused for ${RETENTION_DAYS} days`)
    }
  } catch (error) {
    console.error('[retention] sweep failed', error instanceof Error ? error.message : error)
  }
}

/** Runs the sweep once a day in the API process. Idempotent, so several instances may each run it. */
export const scheduleRetention = (): void => {
  setTimeout(() => {
    void sweep()
    setInterval(() => void sweep(), SWEEP_EVERY_MS).unref()
  }, FIRST_SWEEP_MS).unref()
}
