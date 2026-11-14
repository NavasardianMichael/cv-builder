# Backups to Google Drive

Every night, the server dumps the production database to Google Drive, into a folder
`cv-builder-backups`. Dumps are kept 22 days. The database is the app's only state — CVs and
their photos, accounts, payments — so the dump is the whole backup.

**Already in place:** rclone is on the server, with the remote `gdrive` connected to the backup
Google account (set up once for Crossword, in its `docs/PRODUCTION_SETUP.md` step 8), and
`michael` is in the `docker` group. Check both:

```bash
rclone lsd gdrive:      # lists the Drive folders, e.g. crossword-backups
groups                  # lists docker
```

Run every command below as `michael`, never with `sudo` (except the one `chown`): root has no
`gdrive` remote.

## 1. Install the script **[SRV]** (once)

Paste [backup-db.sh](../deployment/backup-db.sh) into:

```bash
nano /home/michael/apps/cv-builder/shared/backup-db.sh
```

Make `michael` its owner. If `shared/` or the file was created as root, the script fails with
`Permission denied` without this; if `michael` already owns it, the command changes nothing:

```bash
sudo chown michael:michael /home/michael/apps/cv-builder/shared/backup-db.sh
```

Then make it executable and run it once, without `sudo`:

```bash
chmod 700 /home/michael/apps/cv-builder/shared/backup-db.sh
/home/michael/apps/cv-builder/shared/backup-db.sh
rclone ls gdrive:cv-builder-backups
```

The run creates the Drive folder and should print `ok: cv-builder-<date>.dump (<size> bytes)`,
and the dump should be listed.

If it fails:

- `didn't find section in config file ("gdrive")`: it ran as root. Run it without `sudo`.
- `Permission denied` on the script: root owns the file. Run the `chown` above, then
  `chmod 700` again.
- `permission denied … docker.sock`: `michael` is not in the `docker` group. Run
  `sudo usermod -aG docker michael`, then log out and in again.

## 2. Schedule it **[SRV]** (once)

Nightly at 04:00 server time, 15 minutes after Millionaire's backup (Crossword's runs at 03:30):

```bash
crontab -e
```

Add this line under the existing ones, then save and exit:

```text
0 4 * * * /home/michael/apps/cv-builder/shared/backup-db.sh >> /home/michael/apps/cv-builder/shared/backup.log 2>&1
```

Check it with `crontab -l`. The next morning, `tail /home/michael/apps/cv-builder/shared/backup.log`
should end with an `ok:` line.

Optional: to be emailed when a night is missed, create a free check at https://healthchecks.io
(period 1 day, grace 2 hours) and put its ping URL in the script's `PING_URL="…"` line.

## 3. Restore drill **[SRV]** (any time)

Do it once now, to know the backups work. It never touches the real database: it restores the
newest dump into a scratch database `cv_builder_restore` next to it, lists its tables, and
drops it again. Paste the block as it is — it picks the newest dump itself:

```bash
docker exec cv-builder-postgres-prod sh -c 'dropdb -U "$POSTGRES_USER" --if-exists cv_builder_restore'
FILE=$(rclone lsf gdrive:cv-builder-backups --max-depth 1 --include 'cv-builder-*.dump' | sort | tail -n 1); echo "$FILE"
[ -n "$FILE" ] && rclone cat "gdrive:cv-builder-backups/$FILE" | docker exec -i cv-builder-postgres-prod sh -c 'createdb -U "$POSTGRES_USER" cv_builder_restore && pg_restore -U "$POSTGRES_USER" -d cv_builder_restore --no-owner'
docker exec cv-builder-postgres-prod sh -c 'psql -U "$POSTGRES_USER" -d cv_builder_restore -c "\dt+"'
docker exec cv-builder-postgres-prod sh -c 'dropdb -U "$POSTGRES_USER" cv_builder_restore'
```

`NOTICE: database "cv_builder_restore" does not exist, skipping` on the first line is normal.
The restore line prints nothing when it works; the table list should show the tables, with
none at zero size once there are users.

## Real restore **[SRV]** (only after data loss)

⚠ **This replaces the live database** and takes the API down while it runs. To check that the
backups work, use the drill above instead.

First list the dumps and set `FILE` to the one to go back to, keeping the quotes. Dump names are
UTC times:

```bash
rclone lsl gdrive:cv-builder-backups --max-depth 1
FILE='cv-builder-YYYY-MM-DDTHHMMZ.dump'
rclone lsf "gdrive:cv-builder-backups/$FILE"
```

The last line must print the file name back. If it prints an error, fix `FILE` before going on.
Then take a dump of the current state first, so the restore itself can be undone, and restore:

```bash
/home/michael/apps/cv-builder/shared/backup-db.sh
sudo systemctl stop cv-builder-api
[ -n "$FILE" ] && rclone cat "gdrive:cv-builder-backups/$FILE" | docker exec -i cv-builder-postgres-prod sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner'
sudo systemctl start cv-builder-api
systemctl is-active cv-builder-api
```

The last line should print `active`. Everything after the restored dump is undone, which has two
consequences to settle by hand:

- **Payments** made since then are gone from the database but not from the bank: put those
  buyers' access back from the bank's records (`docs/PAYMENTS.md`).
- **Accounts and CVs deleted** since then are back. The privacy policy says a deleted account is
  gone, so delete them again.

## Keeping it up

- Before a deploy whose commit adds a migration under `server/prisma/migrations/`, run the script
  by hand once: migrations do not roll back.
- If `backup-db.sh` changes in the repo, paste it again (empty the file first with
  `truncate -s 0 <path>`). Keep your `PING_URL` value.
- Drive's free 15 GB is shared with the other apps' backups. CV photos live in the database, so
  the dumps grow with the number of CVs. Check the usage with `rclone about gdrive:`.
