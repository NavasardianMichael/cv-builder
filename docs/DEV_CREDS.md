# Local test accounts

Created by `server/prisma/seed.ts` (runs on `pnpm install`, or `pnpm db:seed`). Local only —
never seeded into production. Every account uses the password **`cv-builder-dev-1234`**.

| Email | State | Use it to test |
|---|---|---|
| `demo@cv-builder.local` | No CVs | First run: empty dashboard, creating a CV |
| `ani@cv-builder.local` | 3 CVs; **full access running** (paid 2 days ago) | Designed PDF of any CV in any template; the editor's days-left chip; buying more days on top |
| `gor@cv-builder.local` | 1 long Timeline CV (2 pages), never bought | Pagination, page-break guides; the checkout; a multi-page PDF after paying |
| `paid@cv-builder.local` | 1 Modern CV; **access ran out** (paid 30 days ago) | The "ended" banner; free PDF still works; designed PDF asks to pay again |

Payments in dev go through the mock bank (`PAYMENT_GATEWAY=mock`): **Վճարել** succeeds,
**Մերժել** declines. Password-reset links print to the API console instead of being emailed.

The seed never overwrites an existing row. To reset an account, delete it (or run
`npx prisma migrate reset` in `server/`, which drops everything and re-seeds). The CV
documents come from `server/prisma/fixtures/cvs.json`; regenerate it with
`npx tsx --tsconfig tsconfig.json scripts/build-seed-fixtures.ts` after changing the sample
CV or a template's defaults.

Not seedable: a Google-only account (it needs a real Google sign-in with credentials in
`server/.env`).
