import type { Request, Response } from 'express'
import { clearGuestKey, readGuestKeyHash } from '../lib/guest.js'
import { prisma } from '../lib/prisma.js'

/**
 * Moves this browser's guest CVs — and the payments made for them — to the account that has
 * just signed in, then forgets the guest key. Called on sign-in, sign-up, Google sign-in and
 * `GET /identity/me`, so a guest who signs in by any route keeps what they bought.
 *
 * Never fails the sign-in: on an error the cookie is kept, and the next `/identity/me` retries.
 */
export const claimGuestCvs = async (req: Request, res: Response, userId: string): Promise<void> => {
  const guestKeyHash = readGuestKeyHash(req)
  if (!guestKeyHash) return
  try {
    await prisma.$transaction(async (tx) => {
      const cvs = await tx.cv.findMany({ where: { guestKeyHash }, select: { id: true } })
      if (!cvs.length) return
      const ids = cvs.map((cv) => cv.id)
      await tx.cv.updateMany({ where: { id: { in: ids } }, data: { userId, guestKeyHash: null } })
      await tx.payment.updateMany({ where: { cvId: { in: ids }, userId: null }, data: { userId } })
    })
    clearGuestKey(res)
  } catch (error) {
    console.error('[guest] claiming guest CVs failed', error)
  }
}
