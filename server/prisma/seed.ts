import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password.js'

import 'dotenv/config'

/**
 * One local account, idempotent (`upsert` on the unique email). It runs on every
 * `pnpm install` through scripts/postinstall.mjs, so it must stay re-runnable.
 * Password: `rezyume-dev-1234`.
 */
const prisma = new PrismaClient()

const main = async (): Promise<void> => {
  await prisma.user.upsert({
    where: { email: 'demo@rezyume.local' },
    update: {},
    create: {
      email: 'demo@rezyume.local',
      fullName: 'Արամ Պետրոսյան',
      passwordHash: await hashPassword('rezyume-dev-1234'),
    },
  })
  console.log('[seed] demo@rezyume.local / rezyume-dev-1234')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
