import type { Request, Response } from 'express'
import { clearGuestKey, readGuestKeyHash } from '../lib/guest.js'
import { prisma } from '../lib/prisma.js'

/**
 * Moves this browser's guest CVs — and the access passes it bought (its payments) — to the
 * account that has just signed in, then forgets the guest key. Called on sign-in, sign-up,
 * Google sign-in and `GET /identity/me`, so a guest who signs in by any route keeps what they
 * bought: the account's access is then folded from all of its payments.
 *
 * Never fails the sign-in: on an error the cookie is kept, and the next `/identity/me` retries.
 */
export const claimGuestCvs = async (req: Request, res: Response, userId: string): Promise<void> => {
  const guestKeyHash = readGuestKeyHash(req)
  if (!guestKeyHash) return
  try {
    await prisma.$transaction([
      prisma.cv.updateMany({ where: { guestKeyHash }, data: { userId, guestKeyHash: null } }),
      prisma.payment.updateMany({ where: { guestKeyHash }, data: { userId, guestKeyHash: null } }),
    ])
    clearGuestKey(res)
  } catch (error) {
    console.error('[guest] claiming guest CVs failed', error)
  }
}
