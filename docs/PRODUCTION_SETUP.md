# Production setup

The one-time, app-specific steps to run the CV builder on the server, in order. Assumed to be
in place already, so nothing here creates a user or installs them:

- the existing `michael` user, with sudo
- Node 24, and pnpm in `/home/michael/.local/bin`
- Docker, with `michael` in the `docker` group: the deploy runs `docker compose` as `michael`,
  without sudo, to create the database (`groups michael` lists `docker`)
- nginx and certbot

How the pipeline works is in [DEPLOYMENT.md](DEPLOYMENT.md).

Nothing is downloaded on the server by hand: the deploy itself fetches Chrome. Each step links
the files from this repo's `deployment/` folder, each followed by the command that creates and
opens it on the server. Open the repo file, copy all of it, run the command, paste into nano
(right-click, or `Ctrl+Shift+V`), then save with `Ctrl+O`, `Enter` and exit with `Ctrl+X`.
Then run that step's commands.

To update a file that is already there, empty it first, then open and paste as above:
`sudo truncate -s 0 <path>`.

**[DNS]** DNS provider · **[PC]** your machine, repo root · **[SRV]** server, as `michael` ·
**[GH]** GitHub repo settings · **[EXT]** an outside service's console

Each step is marked **(once)**, done once for the app, or **(any time)**, safe to repeat. A
deploy never touches the files these steps put on the server, so when one of them changes in
the repo, its step says what to redo.

## Environment: two layers

The app (Next.js) and the server (Express API) each have their own settings, in development and
in production:

|            | Development                                                   | Production                                                                                         |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **App**    | `.env.local` in the repo root, from [.env.example](../.env.example)         | one GitHub secret per key (step 8), built into the bundle by the pipeline. No file on the server. |
| **Server** | `server/.env`, from [server/.env.example](../server/.env.example) | `server/.env.production.local` on your PC → `ENV_API_BASE64` (steps 6–8) → the pipeline writes `/home/michael/apps/cv-builder/shared/.env.api` |

The app's values are public: both `NEXT_PUBLIC_*` values end up in the browser bundle. The
server's are secret: the database password, the session signing key, the Google and bank
credentials.

## 1. DNS **[DNS]** (once)

| Type  | Name                        | Value                   | Serves                                      |
| ----- | --------------------------- | ----------------------- | ------------------------------------------- |
| A     | `cv-builder.eapps.site`     | `<SERVER_IPV4>`         | the app (HTTP → HTTPS)                      |
| AAAA  | `cv-builder.eapps.site`     | `<SERVER_IPV6>`         | the app (HTTP → HTTPS)                      |
| CNAME | `www.cv-builder.eapps.site` | `cv-builder.eapps.site` | redirect to `https://cv-builder.eapps.site` |
| A     | `api.cv-builder.eapps.site` | `<SERVER_IPV4>`         | the API, HTTPS only                         |
| AAAA  | `api.cv-builder.eapps.site` | `<SERVER_IPV6>`         | the API, HTTPS only                         |

The IPv6 address must really reach the server: Let's Encrypt checks over IPv6 first, so a wrong
AAAA record makes certbot fail. If the zone is on Cloudflare, set every record to **DNS only**.

## 2. Chrome's system libraries and sandbox **[SRV]** (once)

The PDFs are printed by headless Chrome. The deploy downloads Chrome itself (into
`~/.cache/puppeteer`), but Chrome needs a few system libraries a server without a desktop does
not have. Check your release first:

```bash
lsb_release -ds
```

Ubuntu 24.04 or newer, or Debian 13 (package names end in `t64`):

```bash
sudo apt install -y libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2t64
```

Ubuntu 22.04 or Debian 12:

```bash
sudo apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
```

You do not have to get this list exactly right: every deploy checks Chrome against the host's
libraries before it switches anything over, and if one is missing it stops and names it.
Install that one and re-run the deploy.

Then the sandbox. Chrome isolates each page in a sandbox built on user namespaces, which
Ubuntu 23.10 and newer allow only to programs AppArmor names. Check:

```bash
sysctl kernel.apparmor_restrict_unprivileged_userns
```

If it prints `= 0`, or `cannot stat`, the restriction is off and the sandbox needs nothing:
go to step 3. If it prints `= 1`, name Chrome to AppArmor:

```bash
sudo nano /etc/apparmor.d/cv-builder-chrome
```

Paste this, then save and exit:

```text
abi <abi/4.0>,
include <tunables/global>

profile cv-builder-chrome /home/michael/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome flags=(unconfined) {
  userns,
}
```

And load it:

```bash
sudo apparmor_parser -r /etc/apparmor.d/cv-builder-chrome
```

The `*` covers every Chrome version a later Puppeteer upgrade downloads, and the profile can be
loaded before Chrome is there.

If a PDF still fails with "No usable sandbox" in `journalctl -u cv-builder-api`, the fallback is
to run Chrome without its sandbox: add `PUPPETEER_NO_SANDBOX="true"` in step 6. That is
acceptable here because Chrome only ever opens this app's own `/render` page and aborts every
other request (`server/src/services/pdf.ts`), but the AppArmor profile is better.

## 3. systemd units **[SRV]** (once)

Paste [cv-builder-web.service](../deployment/cv-builder-web.service) into:

```bash
sudo nano /etc/systemd/system/cv-builder-web.service
```

Paste [cv-builder-api.service](../deployment/cv-builder-api.service) into:

```bash
sudo nano /etc/systemd/system/cv-builder-api.service
```

`sudo nano` creates them owned by `root`, mode `644`. Then load them and start them on every
boot:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cv-builder-web cv-builder-api
```

Then let the deploy workflow restart the two services, and nothing else, without a password.
Open the rule file in nano through `visudo`, which checks the syntax on save and creates the
file with the mode `440` that sudo requires:

```bash
sudo EDITOR=nano visudo -f /etc/sudoers.d/cv-builder-deploy
```

Paste this line, then save and exit as above:

```text
michael ALL=(root) NOPASSWD: /usr/bin/systemctl restart cv-builder-web, /usr/bin/systemctl restart cv-builder-api
```

The path must be where `systemctl` really is; `command -v systemctl` prints it, and
`/usr/bin/systemctl` is the usual one. Check the rule works (no password prompt):

```bash
sudo -n systemctl restart cv-builder-api
```

Before the first deploy that restart fails because the service has nothing to run yet; what
matters is that sudo does not ask for a password.

If a `.service` file changes in the repo later, paste it again, then run
`sudo systemctl daemon-reload && sudo systemctl restart <that unit>`.

## 4. Certificates, auto-renewing **[SRV]** (once)

The vhosts in step 5 reference these certificates, so issue them first. There are two: one for
the app that also covers `www`, and one for the API. `certonly --nginx` lets certbot answer
Let's Encrypt's check through nginx by itself and only fetches the certificate: it never edits
a vhost file.

certbot's nginx plugin is needed. If `sudo certbot plugins` does not list `nginx`, install it
with `sudo apt install python3-certbot-nginx`.

```bash
sudo certbot certonly --nginx -d cv-builder.eapps.site -d www.cv-builder.eapps.site --deploy-hook "systemctl reload nginx"
sudo certbot certonly --nginx -d api.cv-builder.eapps.site --deploy-hook "systemctl reload nginx"
```

Each certificate renews by itself: certbot's timer renews it before it expires, the same way it
was issued, and the `--deploy-hook`, saved in each renewal config, reloads nginx afterwards.
The timer is one for the whole server, shared with the other apps' certificates, so there is
nothing to set up for it here.

Check these two certificates only. The dry run asks for test certificates and changes nothing;
each should end with "all simulated renewals succeeded":

```bash
sudo certbot renew --dry-run --cert-name cv-builder.eapps.site
sudo certbot renew --dry-run --cert-name api.cv-builder.eapps.site
```

## 5. nginx **[SRV]** (once)

Paste [cv-builder.eapps.site.conf](../deployment/cv-builder.eapps.site.conf) into:

```bash
sudo nano /etc/nginx/sites-available/cv-builder.eapps.site.conf
```

Paste [api.cv-builder.eapps.site.conf](../deployment/api.cv-builder.eapps.site.conf) into:

```bash
sudo nano /etc/nginx/sites-available/api.cv-builder.eapps.site.conf
```

`sudo nano` creates them owned by `root`, mode `644`. Then enable them:

```bash
sudo ln -sf /etc/nginx/sites-available/cv-builder.eapps.site.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.cv-builder.eapps.site.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Run the reload only if `nginx -t` says `syntax is ok` and `test is successful`.

If a `.conf` file changes in the repo later, paste it again, then run
`sudo nginx -t && sudo systemctl reload nginx`.

## 6. Server environment **[PC]** + **[EXT]** (once)

Everything in this step runs on **your PC**, in the repo root, never on the server. Any
terminal works: PowerShell, Command Prompt, Git Bash, or the VS Code terminal.

Two random values first. Generate each once and keep it in your password manager. The
commands are Node only, so they are the same in every terminal.

The **database password**, 64 hex characters. The first deploy creates the database (a
Postgres 16 container on `127.0.0.1:5009`) from `DATABASE_URL`, so this becomes its password.
Changing it later does not change the password of the database already created.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The **session key**, `JWT_SECRET`, 128 hex characters. It signs every login; changing it later
signs everyone out.

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then the outside services:

- **Google sign-in** (optional; empty hides the button): Google Cloud console → APIs & Services
  → Credentials → Create OAuth client ID → Web application. Authorized redirect URI, exactly:
  `https://api.cv-builder.eapps.site/identity/google/callback`. Scopes: email, profile.
- **Mail engine** (password-reset links and the contact form): `MAIL_API_URL` and
  `MAIL_API_KEY` of the engine the app uses (`server/src/lib/mail.ts`). Empty in production,
  both answer with an error.
- **Ameriabank vPOS** (paid PDFs): the steps and the test-then-live sequence are in
  [PAYMENTS.md](PAYMENTS.md). Until the bank's credentials are here nobody can pay: the mock
  bank is refused in production. The free black-and-white PDF works without it.

`server/.env.production.local` (git-ignored). Put the database password after `cv-builder:`:

```dotenv
DATABASE_URL="postgresql://cv-builder:<database password>@127.0.0.1:5009/cv-builder?schema=public"
JWT_SECRET="<session key>"
CORS_ORIGIN="https://cv-builder.eapps.site"
API_PUBLIC_URL="https://api.cv-builder.eapps.site"

MAIL_API_URL=""
MAIL_API_KEY=""

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://api.cv-builder.eapps.site/identity/google/callback"

PAYMENT_GATEWAY="ameria"
AMERIA_CLIENT_ID=""
AMERIA_USERNAME=""
AMERIA_PASSWORD=""
AMERIA_TEST_MODE="false"
AMERIA_ORDER_ID_OFFSET="0"
```

The first four are required. While the bank is still testing you, use its test values
instead: `AMERIA_TEST_MODE="true"` and `AMERIA_AMOUNT_OVERRIDE="10"` ([PAYMENTS.md](PAYMENTS.md)).
Add `PUPPETEER_NO_SANDBOX="true"` only if step 2 sent you here. Leave out `NODE_ENV`, `PORT`,
`HOST` and `RENDER_ORIGIN`: the pipeline sets them itself.

Generate the `ENV_API_BASE64` value from it, straight to the clipboard. `clip` is Windows and
works in PowerShell, Command Prompt and Git Bash alike (on macOS use `| pbcopy`):

```bash
pnpm env:base64 production | clip
```

It prints only the base64 to the clipboard, and lists the key names (never values) and any
warnings in the terminal: a dev password, a key the deploy owns, the bank's test mode, an
`http://` origin. Read them before pasting.

If this file changes later, run the command again, update the `ENV_API_BASE64` secret and
redeploy (step 9's **Run workflow**).

## 7. Google consent screen and the bank's pages **[EXT]** (once)

- Google Cloud console → OAuth consent screen: add `eapps.site` to the authorized domains, and
  `https://cv-builder.eapps.site/privacy` and `/terms` as the privacy-policy and terms links.
- Ameriabank needs no return address from you: the API builds its BackURL from
  `API_PUBLIC_URL` (`/payments/return/ameria`). The bank does ask for the Terms, Privacy and
  Refund pages to be live: `/terms`, `/privacy`, `/refund-policy` — their text is a draft
  (`src/constants/legal.ts`), so have it reviewed first.

## 8. GitHub secrets **[GH]** (once)

Settings → Secrets and variables → Actions → **Secrets** tab → **Repository secrets** → **New
repository secret**. Every value below goes there: not in the Variables tab, and not under
Settings → Environments, whose secrets the deploy jobs cannot read (a value there arrives
empty, and the build stops with "NEXT_PUBLIC_API_URL is empty").

| Name                   | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| `SSH_HOST`             | `<SERVER_IPV4>`                                          |
| `SSH_USER`             | `michael`                                                |
| `SSH_KEY`              | your existing private key (its public half is already in `/home/michael/.ssh/authorized_keys`), BEGIN to END lines |
| `APP_DIR`              | `/home/michael/apps/cv-builder`                          |
| `ENV_API_BASE64`       | output of step 6                                         |
| `NEXT_PUBLIC_API_URL`  | `https://api.cv-builder.eapps.site`                      |
| `NEXT_PUBLIC_SITE_URL` | `https://cv-builder.eapps.site` (must equal `CORS_ORIGIN` in step 6) |

A saved secret cannot be viewed again, and logs show it as `***`. To check or fix one, overwrite
it with the right value.

The two `NEXT_PUBLIC_*` secrets are built into the bundle: change one, then redeploy the web
(re-run **Deploy to Production**).

## 9. First deploy **[GH]** (once)

Actions → **Deploy to Production** → **Run workflow** (deploys both sides). The first run takes
longer: it downloads Chrome and creates the database. After that, every merge to `master`
deploys automatically, and every pull request runs **CI** first.

The deploy ends by printing a real PDF. If that step fails, its log says why: a missing library
(step 2), "No usable sandbox" (step 2's AppArmor profile), or a 403 (`CORS_ORIGIN` is not
exactly `https://cv-builder.eapps.site`).

Check it (any time):

```powershell
curl.exe -s  https://api.cv-builder.eapps.site/health    # "status":"ok", "payments":true once Ameria is set
curl.exe -sI https://cv-builder.eapps.site/              # 200
curl.exe -sI https://www.cv-builder.eapps.site           # 301 -> https://cv-builder.eapps.site
```

Then in a browser: make a CV without signing in, download the free black-and-white PDF, sign
up, and (once the bank is live) buy one.
