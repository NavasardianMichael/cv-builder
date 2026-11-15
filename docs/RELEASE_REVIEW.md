# Pre-release review — 2026-11-15

A plan, not yet done. Source: the guests app's whole-app review (`../guests/docs/RELEASE_REVIEW.md`,
commit `8a717d0`). Each of its findings was checked against this repo at `37cc528`. Below is
only what applies here and is worth doing. Most of it is a port of code guests already has,
so it is named as such. What was left out and why is in [Not taken](#not-taken).

Priorities: **P0** before launch (money, data, legal) · **P1** launch week (real users hit
it) · **P2** soon after (hardening, polish).

Size: **S** under an hour · **M** a few hours.

## Status (2026-11-15)

Everything below is done, except the optional **Check configuration** job in item 3, which was
left out. Verified:
- `pnpm verify` passes: 146 tests, including new ones for `clientAddress`, the PDF queue
  dropping a client that hung up, and consent by region.
- Against a local API:
  - `/health` checks the database and sends `nosniff`.
  - Two saves from the same copy: the first is 200, the second 409 `cvChangedElsewhere`.
  - The 41st login from one address with varied emails gets 429.
- The new migration (`User.lastActiveAt` index) is applied locally, and the seed still runs
  against the local database.

Not tested:
- On a real deploy (nothing is pushed): the deploy changes (rollback, re-run side directory,
  dump before migrating, the literal env read) and the graceful shutdown. SIGTERM can't be sent
  on Windows.
- In a browser: the consent banner, the storage-blocked screen, and lazy previews. See
  [Manual steps](#manual-steps).

## P0 — before launch

### 1. Production config fails closed · S
- `server/src/config.ts:20`: `jwtSecret` falls back to the public `dev-secret-change-me`. With
  that secret anyone can forge a session.
- `services/gateways/ameria.ts:31`: `chargeOf` applies `AMERIA_AMOUNT_OVERRIDE` even with
  `AMERIA_TEST_MODE="false"`. If the line is left in after go-live, every pass sells for 10 ֏,
  and the bank's check accepts that as paid.
- **Do:** port guests' `config.ts` changes:
  - In production, refuse to boot with a missing, short or example `JWT_SECRET`, or with the
    override beside the live terminal.
  - Log a loud boot warning while production runs on the test terminal (`index.ts`).
  - `env-to-base64.mjs` already warns about both; make those two errors, not warnings.

### 2. Paid but never credited · S
- `services/payments.ts:234`: pending payments are re-checked only when the owner comes back
  (access read, print, new checkout), and only the last 5. A buyer who paid, lost the redirect
  and never returns stays charged with no pass, and nobody is told.
- **Do:** port `services/paymentSweep.ts` and `settleStalePayments` from guests. The sweep
  runs hourly and its first run is 5 minutes after boot. It settles every pending payment
  whose bank page has timed out, up to 30 days back. Settling is already compare-and-set, so
  the admin mail goes out once.

### 3. Deploy safety · M
In `.github/workflows/deploy.yml`:
- **A re-run deletes the live release.** `rm -rf "$NEW"` (`:504`, `:584`) removes what
  `current` points to when the same commit is deployed again, for example a re-run after a
  flaky `check_pdf`. Extract into a side directory, then `mv`.
- **Secrets left in `/tmp`.** The API env file is written to `/tmp/env.api` with the default
  umask (`:330`). It is copied to the server's `/tmp` and removed only on success (`:600`).
  Use `umask 077` and remove it in `trap … EXIT`.
- **No rollback.** The symlink flips before the health wait and `check_pdf`. Remember the old
  `readlink current` and restore it if either fails.
- **No dump before migrating** (`:573`). Run `backup-db.sh` (already on the server) or a plain
  `pg_dump` before `prisma migrate deploy`.
- **The env file is sourced as shell** (`:571`, `set -a; . .env.api`). An unquoted `&` in
  `DATABASE_URL` (`?schema=public&connection_limit=5`) would background the assignment, and
  the migration would see no URL. Read it literally, as guests does.
- Optional, same PR: guests' **Check configuration** first job
  (`scripts/check-deploy-config.mjs` + `tests/unit/deployConfig.spec.ts`). It checks every
  secret in seconds instead of failing halfway through the deploy.

### 4. Analytics consent where the law asks for it · M
- GA4 loads on the first page for everyone (`components/analytics/Analytics.tsx`). The site
  also targets Armenians abroad, many in the EU.
- **Do:** port guests' consent module, Armenian copy only:
  - `constants/consent.ts`, `helpers/consent.ts`, `ConsentBanner`, `ConsentSettingsLink` (in
    the footer), `AnalyticsConsentDefaults`, and the test.
  - The banner shows only in the EU/EEA, UK and Switzerland, told by the device's time zone.
    Armenia and everywhere else keep today's behaviour.
  - Closing the banner counts as accepting.
  - Update privacy §5 in `constants/legal.ts`.

## P1 — launch week

### 5. Rate limits a phone cannot dodge · S
- Every limiter keys on raw `req.ip`. Over IPv6 one client owns a whole /64 and rotates
  through it, getting unlimited free PDFs, guest CVs and sign-ups.
- Login is limited per `ip:email` only (`routes/identity.ts:93`). Changing the email gives
  unlimited argon2 runs.
- **Do:**
  - Port `clientAddress` (`lib/request.ts`) and its test, and use it in every limiter.
  - Add a plain per-address login limit (guests: 40 per 15 minutes).

### 6. One client can hold the only printer · S
- `services/pdf.ts`: one print slot and 8 waiting, so one script can fill the queue in front of
  paying customers. A queued print also runs after its client has hung up.
- **Do:** port guests' changes: at most 2 prints per address printing or queued, and drop a
  queued job on `req.on('close')`.

### 7. Graceful shutdown and a real `/health` · S
- Every deploy kills in-flight prints, autosaves and bank settles (`index.ts` has no SIGTERM
  handler; systemd allows 30 s).
- `/health` (`app.ts:39`) is green with Postgres down, so the deploy's health wait passes and
  an uptime monitor stays quiet.
- **Do:**
  - Port guests' `index.ts`: `server.close()`, 25 s grace, stop the sweeps, then
    `prisma.$disconnect()`.
  - Add `SELECT 1` in `/health`, returning 503 when it fails.

### 8. Editor and payment dead ends · S
- **Storage-blocked loop.** `NewCvClient.tsx:34` ignores `writeLocalDraft`'s `false`, and
  `EditorShell.tsx:85` sends a guest without a draft back to `/editor/new`. With storage
  blocked (some private modes) the two pages redirect forever. Show a translated screen
  instead.
- **Autosave retries forever.** `useAutosave.ts:61` retries every 5 s on any error, 401, 404
  and 413 included. That floods Sentry and keeps the leave guard asking. Retry only network
  errors and 5xx; on a 4xx, stop with translated copy.
- **"Full access until ." with no date.** `PaymentResultClient.tsx:134`: `until` is empty when
  the access read fails or the payment was made in another browser. Use a dateless success
  text.
- **Pending page, after polling stops.** It now says it is unconfirmed, but offers nothing to
  do. Add a "Check again" button.

## P2 — soon after

- **Two tabs overwrite each other.** Autosave from tab B silently replaces tab A's work. Send
  `updatedAt` with the save, answer 409 on a mismatch (`updateMany where {id, updatedAt}`), and
  show "Changed elsewhere — Reload". Port from guests (`routes/lists.ts`, `useAutosave`, store
  types). **M**
- **Headers.**
  - API: `X-Content-Type-Options: nosniff` and `cors({ maxAge: 7200 })`. Without `maxAge`,
    almost every autosave pays a preflight.
  - nginx: HSTS on both hosts, and gzip on the API (`GET /cvs` returns full documents
    uncompressed). The nginx files then need re-pasting on the server by hand.
  - `next.config.ts`: a basic CSP (`frame-ancestors`, `base-uri`, `object-src`,
    `form-action`). **S**
- **Seed refuses a non-local database.** `prisma/seed.ts` would create the known
  `cv-builder-dev-1234` accounts against any `DATABASE_URL`. **S**
- **Index on `User.lastActiveAt`** for the retention sweep (one migration). **S**
- **Faster PDF start.** `pdf.ts:73` waits for `networkidle0`; `data-cv-ready` and
  `fonts.ready` already wait for what matters. Use `load`. Measure one print before and after.
  **S**
- **Previews lay out only near the screen.** `CvPreview` draws every CV at once: about 42 on
  `/templates`, each pulling its fonts. Gate it on an `IntersectionObserver` (rootMargin about
  300 px). **S**
- **`cv-fonts.css` is cached `immutable` for a year under a fixed URL** (`next.config.ts:25`).
  A font change would not reach returning visitors. Add `?v=<hash>` from `pnpm fonts:css`, as
  guests' `sheetFontsVersion.ts` does. **S**
- **CI on pushes.** `ci.yml` runs only on `pull_request`. Check that a push touching only
  tests still runs `verify` (deploy's `paths-ignore` may skip it); if not, add `push` to CI.
  **S**

## Not taken

- **`returnTo` cleaning** (guests' `safeReturnPath`): `isSafeReturnPath` here refuses anything
  odd, which is already safe. Cleaning it instead is only nicer.
- **Bottom-bar label wrapping:** the bar here has 4 tabs, not 7, so labels fit.
- **Gemini cost, photo quota:** there is no AI here.
- **Template JSON-LD `isAccessibleForFree`:** true is accurate here, since editing any template
  and its black-and-white PDF are free.
- **Already declined in guests, same reasons here:**
  - Logout revocation, because it would sign out every device.
  - Actions pinned by SHA, because Dependabot is the better tool.
  - SSH host key as a secret, because `ssh-keyscan` is used, as in crossword.
  - A warm Chrome, because one per print isolates crashes.
- **Sentry on the API:** journald plus uptime monitors are enough at this scale.
- **DB-path unit tests** (settle, sweep, retention): they need a Prisma mock or a test
  database. They are worth having, but are a project of their own.

## Manual steps

**[PC]** your machine, repo root · **[SRV]** the server, as `michael` · **[GH]** GitHub → the
repo → Settings · **[EXT]** a third-party console · **[WEB]** a browser.

### Before pushing

1. **Check the production env file** **[PC]**: open `server/.env.production.local` in the
   editor. In production the API now refuses to start, and so the deploy fails, on either of
   the first two:
   - `JWT_SECRET` must have at least 32 characters and must not start with `change-me`. To
     make a new one, run `openssl rand -hex 64` in Git Bash and paste it as
     `JWT_SECRET="…"`. A new secret signs everyone out once.
   - With `AMERIA_TEST_MODE="false"`, delete the `AMERIA_AMOUNT_OVERRIDE` line. While the
     test terminal is on, leave both lines as they are.
2. **If you changed that file, re-encode it**:
   - **[PC]** `pnpm env:base64 production | clip`. It also prints a warning for each problem
     above.
   - **[GH]** Secrets and variables → Actions → `ENV_API_BASE64` → Update, and paste.
3. **Review the diff, commit, push to `master`.** The deploy then:
   - dumps the database to `/home/michael/apps/cv-builder/backups/` before migrating;
   - rolls back by itself if the new release fails its health wait or the PDF check.

### On the server, after the deploy is green

4. **nginx: HSTS on both hosts, gzip on the API** **[SRV]**. Empty each conf, paste the repo
   file into it (the comment after each command names it), then test and reload:
   ```bash
   sudo truncate -s 0 /etc/nginx/sites-available/cv-builder.eapps.site.conf
   sudo nano /etc/nginx/sites-available/cv-builder.eapps.site.conf        # deployment/cv-builder.eapps.site.conf
   sudo truncate -s 0 /etc/nginx/sites-available/api.cv-builder.eapps.site.conf
   sudo nano /etc/nginx/sites-available/api.cv-builder.eapps.site.conf    # deployment/api.cv-builder.eapps.site.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```
   Then check from **[PC]** (PowerShell). Each command should print what follows it:
   ```powershell
   curl.exe -sI https://cv-builder.eapps.site/ | findstr /i strict
   # Strict-Transport-Security: max-age=31536000
   curl.exe -sI https://api.cv-builder.eapps.site/health | findstr /i strict
   # Strict-Transport-Security: max-age=31536000
   curl.exe -s -o NUL -w "%{http_code}" https://api.cv-builder.eapps.site/health
   # 200
   ```
   HSTS has no `includeSubDomains`, because other apps share `eapps.site`. Once a browser
   has seen it, that browser refuses plain HTTP to these two hosts for a year. Nothing here
   serves HTTP, so nothing breaks.
5. **Test terminal still on?** **[SRV]**
   ```bash
   journalctl -u cv-builder-api -n 100 --no-pager | grep -i "TEST terminal"
   ```
   A line means anyone with Ameria's public test cards gets real passes. Switch to the live
   terminal (step 1) as soon as the bank signs off.

### Outside the code

6. **Uptime alerts** **[EXT]**: two UptimeRobot HTTP(s) monitors, every 5 minutes:
   - `https://api.cv-builder.eapps.site/health`, with the keyword `"status":"ok"`. It now
     fails when the database is down.
   - `https://cv-builder.eapps.site/`.
7. **Legal review** **[EXT]**: have a lawyer review the terms, privacy and refund texts in
   `src/constants/legal.ts`. Privacy §5 now describes the consent banner.

### Check by hand on the live site

8. **Consent banner** **[WEB]**. It shows only where an opt-in is needed (EU/EEA, UK,
   Switzerland, by the device's time zone):
   - From Armenia: a private window shows no banner and sets `_ga*` cookies at once
     (DevTools → Application → Cookies).
   - The EU case: DevTools → ⋮ → More tools → Sensors → Location → Berlin (it overrides the
     time zone), then reload in a fresh private window. The banner shows, and there is no
     `_ga*` cookie until you click **Accept** or the **×** (closing counts as accepting).
     **Decline** keeps it cookieless.
   - Footer → **Քուքի ֆայլերի կարգավորումներ** reopens the banner. It never shows in the
     editor.
9. **Two tabs** **[WEB]**: sign in and open the same CV in two tabs. Edit in tab A and wait
   for "Saved", then edit in tab B. Tab B should show **Reload** with a message, and must not
   overwrite tab A.
10. **A real payment on the test terminal** **[WEB]**: pay, then close the tab on the bank page
    before it redirects. Within about an hour the payment should settle by itself: the access
    shows up, and the admin mail says "settled by the hourly check".
