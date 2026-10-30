# Ռեզյումե (Rezyume)

An Armenian-only CV builder. Users pick one of 12 templates, edit the CV **in place** (text,
colours, backgrounds and fonts per section), and pay once per CV (2,000 ֏) to download its
designed PDF; a plain black-and-white PDF of the same text is free. Neither needs an account. Next.js App Router frontend + an Express/Prisma API in `server/`, one pnpm workspace.
Modelled on `../bookie` — same stack and conventions, smaller.

**Stack:** Next.js 16 · React 19 · TypeScript · Ant Design 6 · Tailwind 4 · Zustand (immer) ·
next-intl (one locale, `hy`) · pnpm · Express 5 + Prisma 6 + PostgreSQL · Puppeteer (PDF)

## Commands

```bash
pnpm install        # + Prisma generate; locally also creates missing env files, starts the
                    # Docker Postgres (:5009) if down, applies pending migrations, seeds.
                    # Skipped when CI / NODE_ENV=production / SKIP_DB_SETUP (scripts/postinstall.mjs)
pnpm db:up          # Postgres in Docker on :5009, by hand
pnpm dev            # web :7009 + api :9009
pnpm verify         # typecheck → typecheck:server → lint → test → build — run before calling anything done
pnpm test           # vitest (tests/unit)
pnpm fonts:css      # public/fonts/manifest.json -> public/fonts/cv-fonts.css
```

Seeded test accounts (all `rezyume-dev-1234`): `docs/DEV_CREDS.md`. In dev `PAYMENT_GATEWAY=mock`: the
checkout opens a fake bank page served by the API with Pay / Decline buttons.

The API's `dev` script is `node --watch-path=src --import tsx`, **not** `tsx watch`: under
`concurrently` on Windows `tsx watch` never starts the child, and plain `--watch` restarts the
process whenever a lazily loaded file in `node_modules` is first read (which also wipes the
mock bank's in-memory payments).

## Path alias

`@*` → `./src/*` (not `@/`): `@helpers/cvStyle`, `@store/cvs/single/store`. `@test/*` → `./tests/*`.

## Where things live

| Looking for | Go to |
|---|---|
| The CV document type | `src/store/cvs/single/types.ts` — twin of `server/src/services/cvDocument.ts` |
| Templates (names, layouts, default palettes/fonts) | `src/constants/templates.ts` |
| Template markup | `src/components/cv/templates/*.tsx`, composed from `src/components/cv/blocks/` |
| Template styling | `src/components/cv/cv.css` — reads only `--cv-*` variables (`src/helpers/cvStyle.ts`) |
| Fonts (20, self-hosted) | `src/constants/fonts.ts` · files in `public/fonts/` · provenance `public/fonts/LICENSES.md` · rebuild `scripts/fonts/` |
| Section types, default titles, level words | `src/constants/sections.ts` |
| In-place editing | `src/components/cv/Editable.tsx` + `CvEditContext.tsx`; the editor's controls in `src/components/editor/` |
| Editor state, undo/redo | `src/store/cvs/single/store.ts` · autosave `src/components/editor/useAutosave.ts` |
| Guest drafts (localStorage) | `src/helpers/localDraft.ts` — imported on sign-in by `EditorShell` |
| Buying without an account | `server/src/lib/guest.ts` (guest-key cookie) · `services/guestCvs.ts` (moved to the account on sign-in) · `CheckoutModal` · `docs/PAYMENTS.md` |
| PDF | `server/src/services/pdf.ts` prints the web's `/render` page (`src/app/render/`) in headless Chrome |
| Payments | `docs/PAYMENTS.md` · `server/src/services/payments.ts` · `server/src/services/gateways/` |
| Free black-and-white PDF | `server/src/services/basicCv.ts` (prints) · twin `BASIC_DESIGN` in `templates.ts` + `src/helpers/basicCv.ts` (previews) |
| Auth (password + Google) | `server/src/routes/identity.ts`, `identity-google.ts` · `src/components/auth/` |
| SEO / GEO | `src/helpers/metadata.ts`, `src/linkedDataSchema/site.ts`, `src/app/{sitemap,robots}.ts`, `src/app/llms.txt/`, `next.config.ts#htmlLimitedBots` |
| Copy | `src/messages/hy.json` (UI) · `src/constants/legal.ts` (draft legal pages) |
| App design tokens | `src/styles/tokens.ts` → `theme.ts` → `globals.css` |

## Architecture facts that are easy to get wrong

- **One renderer for everything.** `CvDocument` draws the editor canvas, every preview and the
  PDF. The editor turns it editable by wrapping it in `CvEditProvider`, which also injects the
  toolbars through slots — CV components never import the editor. Keep it that way: a control
  rendered by a template would land in the PDF.
- **CV colours are document data**, so hex values live in `templates.ts` / `palettes.ts`, not
  `tokens.ts`. App-chrome hex values live only in `tokens.ts`.
- **The API coerces, it does not reject**, every CV write (`coerceContent`/`coerceDesign`):
  autosave runs on every pause. Colours must be `#rrggbb` (they reach `style`), fonts and
  templates must be in the catalogue, the photo a small base64 image data URL.
- **Twins, pinned by `tests/unit/server/twins.spec.ts`:** template ids, font slugs, section
  types, the price, the free PDF's design, the default title, the guest cookie's name, error codes, and the paths the server links to. Change both sides together.
- **Print mechanics** live in `CvPage.tsx`: `@page { margin: 0 }`, a table whose empty
  `thead`/`tfoot` repeat the page padding on every page, and a sidebar strip that is
  `position: fixed` in print so it repeats too. Entries are `break-inside: avoid`.
- **A CV is owned by an account or a guest key**, never both: every `/cvs` route scopes by
  `cvOwnerOf(req)` (`requireCvOwner`), which is also the Prisma `where`. Never filter CVs by
  `userId` alone.
- **Payment is settled only from the gateway's own record** (`settlePayment`), never from the
  return URL; reading an unpaid CV reconciles its recent pending payments.
- **Server Components cannot import `@ant-design/icons`** (it reads context): import icons
  from `@components/ui/icons` there.
- **Unlayered CSS beats Tailwind utilities.** Element defaults in `globals.css` are in
  `@layer base`; custom utilities use `@utility`.

## Working rules

Same as bookie: named inline exports (default only where Next requires it), explicit types,
endpoints only in `src/api/<domain>/endpoints.ts`, stores `create<S & A>()(immer(combine(…)))`,
every async failure shown with translated copy (`ErrorAlert`/`ErrorState`, dev details
underneath), never a server message. Read an antd prop's type before using it — v6
deprecates many (`Alert.title` not `message`, `destroyOnHidden`, `Space orientation`).

## Env files

Never read or print `.env*` files except `*.env.example`. A missing env file is created by
copying its `.env.example`.
