import type { Cv, User } from '@prisma/client'
import { coerceContent, coerceDesign } from '../services/cvDocument.js'

/** Prisma rows -> the shapes the web reads. Nothing else may hand a row to `ok()`. */

export const mapUser = (user: User) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  hasPassword: Boolean(user.passwordHash),
  hasGoogle: Boolean(user.googleId),
})

/** `content`/`design` are re-coerced on the way out too, so an old row reads in today's shape. */
export const mapCv = (cv: Cv) => ({
  id: cv.id,
  title: cv.title,
  content: coerceContent(cv.content),
  design: coerceDesign(cv.design),
  paidAt: cv.paidAt?.toISOString() ?? null,
  createdAt: cv.createdAt.toISOString(),
  updatedAt: cv.updatedAt.toISOString(),
})
