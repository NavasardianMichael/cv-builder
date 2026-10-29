# Ռեզյումե — Armenian CV builder

Build an Armenian CV in the browser: 12 templates, 20 Armenian fonts, every text, colour,
background and font editable in place. Building is free; downloading a CV's PDF is a one-time
2,000 ֏ payment (Ameriabank vPOS), after which that CV is the user's forever.

## Quick start

Requirements: Node 24, pnpm 10, Docker.

```bash
pnpm install    # installs, creates missing env files from the examples, starts the Docker
                # Postgres (:5009) if it is down, applies pending migrations, seeds
pnpm dev        # http://localhost:7009 (web) · :9009 (api)
```

Run `pnpm install` again after pulling: it applies any new migrations.

Sign in with a seeded test account (`docs/DEV_CREDS.md`, password `rezyume-dev-1234`), or build as a guest. Payments use a
mock bank in dev — the checkout shows a fake page with **Վճարել** / **Մերժել**.

`pnpm verify` runs typecheck, lint, tests and the production build.

## Docs

- `CLAUDE.md` — architecture, where things live, the invariants
- `docs/PAYMENTS.md` — the purchase flow and Ameriabank setup
- `public/fonts/LICENSES.md` — where every font comes from and its licence

## Before launch

- Fill `server/.env` for production: `JWT_SECRET`, `CORS_ORIGIN`, `API_PUBLIC_URL`,
  `RENDER_ORIGIN`, Google OAuth, mail engine, Ameriabank credentials (`docs/PAYMENTS.md`).
- Have the Terms / Privacy / Refund pages (`src/constants/legal.ts`) reviewed by a lawyer.
- Replace the placeholder brand name (`src/constants/app.ts`) and `SUPPORT_EMAIL`.
