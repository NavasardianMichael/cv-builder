import { type Prisma, PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword } from '../src/lib/password.js'
import { coerceContent, coerceDesign } from '../src/services/cvDocument.js'

import 'dotenv/config'

/**
 * Local test accounts (docs/DEV_CREDS.md). Runs on every `pnpm install` through
 * scripts/postinstall.mjs, so it must stay re-runnable: users are upserted on their unique
 * email, CVs found by (user, title) before creating, the payment by its CV. `update: {}`
 * is deliberate — editing a fixture does not rewrite an existing row; delete it to re-seed.
 *
 * CV documents come from prisma/fixtures/cvs.json, generated from the web's own factory by
 * scripts/build-seed-fixtures.ts.
 */
const prisma = new PrismaClient()

const PASSWORD = 'rezyume-dev-1234'

type Fixture = { title: string; content: unknown; design: unknown }
type FixtureKey = 'paidModern' | 'unpaidCreative' | 'blankClassic' | 'longTimeline'

const fixtures = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/cvs.json'), 'utf8')
) as Record<FixtureKey, Fixture>

type SeedUser = { email: string; fullName: string; cvs: { fixture: FixtureKey; paid?: boolean }[] }

const USERS: SeedUser[] = [
  // A brand-new account: empty dashboard, first-run experience.
  { email: 'demo@rezyume.local', fullName: 'Արամ Պետրոսյան', cvs: [] },
  // A returning customer: one paid CV (downloadable), one unpaid (checkout), one blank.
  {
    email: 'ani@rezyume.local',
    fullName: 'Անի Հովհաննիսյան',
    cvs: [{ fixture: 'paidModern', paid: true }, { fixture: 'unpaidCreative' }, { fixture: 'blankClassic' }],
  },
  // A long, two-page CV, for pagination and the page-break guides.
  { email: 'gor@rezyume.local', fullName: 'Գոռ Մարտիրոսյան', cvs: [{ fixture: 'longTimeline' }] },
  // Every CV paid: the "already paid" paths (download straight away, checkout refused).
  { email: 'paid@rezyume.local', fullName: 'Լիլիթ Սարգսյան', cvs: [{ fixture: 'paidModern', paid: true }] },
]

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue

const seedCv = async (userId: string, fixtureKey: FixtureKey, paid: boolean): Promise<void> => {
  const fixture = fixtures[fixtureKey]
  const design = coerceDesign(fixture.design)
  const existing = await prisma.cv.findFirst({ where: { userId, title: fixture.title } })
  const cv =
    existing ??
    (await prisma.cv.create({
      data: {
        userId,
        title: fixture.title,
        templateId: design.templateId,
        content: asJson(coerceContent(fixture.content)),
        design: asJson(design),
        paidAt: paid ? new Date() : null,
      },
    }))

  if (!paid) return
  const payment = await prisma.payment.findFirst({ where: { cvId: cv.id, status: 'succeeded' } })
  if (!payment) {
    await prisma.payment.create({
      data: { userId, cvId: cv.id, amount: 2000, gateway: 'mock', status: 'succeeded', paidAt: cv.paidAt ?? new Date() },
    })
  }
}

const main = async (): Promise<void> => {
  const passwordHash = await hashPassword(PASSWORD)
  for (const seed of USERS) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: { email: seed.email, fullName: seed.fullName, passwordHash },
    })
    for (const cv of seed.cvs) await seedCv(user.id, cv.fixture, Boolean(cv.paid))
    console.log(`[seed] ${seed.email} / ${PASSWORD} — ${seed.cvs.length} CV(s)`)
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
