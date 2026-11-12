import type { Prisma } from '@prisma/client'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword } from '../src/lib/password.js'
import { coerceContent, coerceDesign } from '../src/services/cvDocument.js'
import { PASS_PRICE_AMD } from '../src/services/pricing.js'

// The API's own loader, so the seed reads the same env files as the API and `prisma migrate`
// (`.env.development.local` first) — `dotenv/config` reads only `server/.env`.
import '../src/load-env.js'

// Imported only now, after the env files: on import, @prisma/client loads `server/.env` by
// itself, and dotenv never overrides — a static import would let that file win.
const { PrismaClient } = await import('@prisma/client')

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

const PASSWORD = 'cv-builder-dev-1234'

type Fixture = { title: string; content: unknown; design: unknown }
type FixtureKey = 'paidModern' | 'unpaidCreative' | 'blankClassic' | 'longTimeline'

const fixtures = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/cvs.json'), 'utf8')
) as Record<FixtureKey, Fixture>

/** `pass`: a full-access pass that is still running, or one that ran out. */
type SeedUser = { email: string; fullName: string; pass?: 'running' | 'ended'; cvs: { fixture: FixtureKey }[] }

const USERS: SeedUser[] = [
  // A brand-new account: empty dashboard, first-run experience.
  { email: 'demo@cv-builder.local', fullName: 'Արամ Պետրոսյան', cvs: [] },
  // Full access running (a pass paid 2 days ago): any template downloads; the editor's chip shows days left.
  {
    email: 'ani@cv-builder.local',
    fullName: 'Անի Հովհաննիսյան',
    pass: 'running',
    cvs: [{ fixture: 'paidModern' }, { fixture: 'unpaidCreative' }, { fixture: 'blankClassic' }],
  },
  // A long, two-page CV, for pagination and the page-break guides. Never bought: checkout.
  { email: 'gor@cv-builder.local', fullName: 'Գոռ Մարտիրոսյան', cvs: [{ fixture: 'longTimeline' }] },
  // Access that ran out (paid 30 days ago): the CVs stay, the free PDF prints, the designed one asks to pay again.
  { email: 'paid@cv-builder.local', fullName: 'Լիլիթ Սարգսյան', pass: 'ended', cvs: [{ fixture: 'paidModern' }] },
]

const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue

const seedCv = async (userId: string, fixtureKey: FixtureKey): Promise<void> => {
  const fixture = fixtures[fixtureKey]
  const design = coerceDesign(fixture.design)
  const existing = await prisma.cv.findFirst({ where: { userId, title: fixture.title } })
  if (existing) return
  await prisma.cv.create({
    data: {
      userId,
      title: fixture.title,
      templateId: design.templateId,
      content: asJson(coerceContent(fixture.content)),
      design: asJson(design),
    },
  })
}

const DAY_MS = 24 * 60 * 60 * 1000

/** One mock pass, paid `daysAgo` days ago (21 days of full access from then). Once per account. */
const seedPass = async (userId: string, daysAgo: number): Promise<void> => {
  if (await prisma.payment.findFirst({ where: { userId, status: 'succeeded' } })) return
  const paidAt = new Date(Date.now() - daysAgo * DAY_MS)
  await prisma.payment.create({
    data: { userId, amount: PASS_PRICE_AMD, gateway: 'mock', status: 'succeeded', paidAt, createdAt: paidAt },
  })
}

const main = async (): Promise<void> => {
  const passwordHash = await hashPassword(PASSWORD)
  for (const seed of USERS) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      // Verified, so they can sign in; `update` also activates accounts seeded before verification existed.
      update: { emailVerifiedAt: new Date() },
      create: { email: seed.email, fullName: seed.fullName, passwordHash, emailVerifiedAt: new Date() },
    })
    for (const cv of seed.cvs) await seedCv(user.id, cv.fixture)
    if (seed.pass) await seedPass(user.id, seed.pass === 'running' ? 2 : 30)
    console.log(`[seed] ${seed.email} / ${PASSWORD} — ${seed.cvs.length} CV(s)`)
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
