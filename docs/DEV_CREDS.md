# Local test accounts

Created by `server/prisma/seed.ts` (runs on `pnpm install`, or `pnpm db:seed`). Local only —
never seeded into production. Every account uses the password **`rezyume-dev-1234`**.

| Email | State | Use it to test |
|---|---|---|
| `demo@rezyume.local` | No CVs | First run: empty dashboard, creating a CV |
| `ani@rezyume.local` | 3 CVs: Modern **paid**, Creative unpaid, Classic blank | Download of a paid CV; checkout of an unpaid one; editing a blank one |
| `gor@rezyume.local` | 1 long Timeline CV (2 pages), unpaid | Pagination, page-break guides, a multi-page PDF after paying |
| `paid@rezyume.local` | 1 Modern CV, **paid** | "Already paid" paths: instant download, checkout refused (4020) |

Payments in dev go through the mock bank (`PAYMENT_GATEWAY=mock`): **Վճարել** succeeds,
**Մերժել** declines. Password-reset links print to the API console instead of being emailed.

The seed never overwrites an existing row. To reset an account, delete it (or run
`npx prisma migrate reset` in `server/`, which drops everything and re-seeds). The CV
documents come from `server/prisma/fixtures/cvs.json`; regenerate it with
`npx tsx --tsconfig tsconfig.json scripts/build-seed-fixtures.ts` after changing the sample
CV or a template's defaults.

Not seedable: a Google-only account (it needs a real Google sign-in with credentials in
`server/.env`).
