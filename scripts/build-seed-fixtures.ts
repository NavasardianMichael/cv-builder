/**
 * Writes server/prisma/fixtures/cvs.json — the CV documents the dev seed gives its test users —
 * from the web's own factory and template catalogue, so the seed shows exactly what the editor
 * would create. Re-run after changing sampleContent or a template's defaults:
 *   npx tsx scripts/build-seed-fixtures.ts
 */
import { writeFileSync } from 'node:fs'
import { templateDesign } from '../src/constants/templates'
import { blankContent, sampleContent } from '../src/helpers/cvFactory'

const long = sampleContent()
const experience = long.sections.find((section) => section.type === 'experience')
if (experience) {
  experience.entries = [...experience.entries, ...experience.entries, ...experience.entries].map((entry, index) => ({
    ...entry,
    id: `long${index}`,
  }))
}

const fixtures = {
  paidModern: { title: 'Դիզայներ — Ժամանակակից', content: sampleContent(), design: templateDesign('modern') },
  unpaidCreative: { title: 'Դիզայներ — Ստեղծագործական', content: sampleContent(), design: templateDesign('creative') },
  blankClassic: { title: 'Նոր ռեզյումե', content: blankContent(), design: templateDesign('classic') },
  longTimeline: { title: 'Երկար ռեզյումե (2 էջ)', content: long, design: templateDesign('timeline') },
}

writeFileSync('server/prisma/fixtures/cvs.json', `${JSON.stringify(fixtures, null, 2)}\n`)
console.log('[fixtures] server/prisma/fixtures/cvs.json')
