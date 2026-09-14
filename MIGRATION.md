# Firestore → Postgres migration

Everything below lives on the `feat/postgres-migration` branch. `main` keeps
deploying the Firestore version to Firebase Hosting, unchanged.

## What the app looked like before

- React 18 + Vite PWA, no backend at all: the browser talked to Firestore
  directly through `src/api/db.ts`.
- Firebase Auth (Google) for login, admin decided by a hardcoded uid list.
- Offline-first came free from Firestore's `persistentLocalCache`.
- Deployed by GitHub Actions on push to `main` → Firebase Hosting site
  `finance-davide-ghiotto` (project `test-davide-ghiotto`,
  `finance.davideghiotto.it`).

Collections: `transactions`, `categories`, `tags`, `recurring`, `stats`,
`groceries`, `todo`, `users`, and the singleton `settings/categoryUsage`.

## What it looks like now

```
browser ──► nginx (web) ──► /api ──► Bun/Hono API ──► Postgres
                     └────► static React build (unchanged UI)
```

- **Frontend**: same components, same stores, same pages. `src/api/db.ts` keeps
  every method signature it had, so nothing above it changed. Only the login
  page differs, because auth moved from Google to email + password.
- **Backend** (`backend/`): Bun + Hono + Drizzle. REST for CRUD, SSE at
  `/api/events` for the change feed that replaces `onSnapshot`.
- **Auth**: email + password, Argon2id hashes, session in an httpOnly cookie.
  No signup route — accounts are created from the CLI.
- **Offline**: not replicated yet (deliberate, phase 2). The app needs the
  network; `SyncStatus` still shows the online/offline state.

### Schema notes

- Ids stay `text` and keep their original Firestore values, so every reference
  already stored in prod data survives the import.
- `stats.categorySummary` became the `stats_categories` table.
- `settings` is a key → jsonb table.
- Foreign keys are real now: a category still used by a transaction cannot be
  deleted (the API answers 409 instead of silently orphaning rows).
- `stats` gained a unique `(year, month, type)` key Firestore never enforced.

## Runbook

### 1. Back up Firestore

Get a service account key: Firebase console → Project settings → Service
accounts → Generate new private key.

```bash
cd scripts
bun install
GOOGLE_APPLICATION_CREDENTIALS=/abs/path/key.json bun run export
```

Writes `backup/<timestamp>/<collection>.json` plus a `manifest.json` with the
document counts, and points `backup/latest.json` at it. The dump is also the
cold backup: plain JSON, one file per collection.

### 2. Load it into Postgres

```bash
cd backend
bun install
cp .env.example .env      # set DATABASE_URL and SESSION_SECRET
bun run db:migrate
bun run import            # add --allow-orphans after reading the report
```

The import is idempotent — re-run it after a fresh export to re-sync the
replica. It reports, rather than hides, rows that cannot satisfy the new
constraints: references to deleted categories, unparseable dates or amounts,
duplicate stats periods (the freshest `lastUpdate` wins).

### 3. Create the logins

Imported Firebase users arrive with an unusable password hash. Give each one a
real password:

```bash
bun run user:create davide@example.com '<password>' --name "Davide" --admin
bun run user:create partner@example.com '<password>' --name "..."
```

The same command resets the password of an existing account.

### 4. Run it

Local, against the containers:

```bash
cp .env.example .env      # repo root: POSTGRES_PASSWORD, SESSION_SECRET, ...
docker compose up -d --build
# http://localhost:8080
```

Local, in dev mode: `bun run dev` (frontend, proxies `/api` to
`http://localhost:3000`) plus `cd backend && bun run dev`.

## Dokploy deploy on the mini PC

1. Dokploy → **Create Application → Compose**, point it at this repo and the
   `feat/postgres-migration` branch, compose path `docker-compose.yml`.
2. Set the environment variables from `.env.example`: `POSTGRES_PASSWORD`,
   `SESSION_SECRET` (`openssl rand -hex 32`), `CORS_ORIGINS` (the public URL),
   `SECURE_COOKIES=true` once it is behind HTTPS.
3. Expose the `web` service through Dokploy's Traefik and give it a domain.
   `api` and `postgres` stay on the internal network — the browser only ever
   talks to `web`, which proxies `/api`.
4. Deploy. The API applies its migrations on boot.
5. Seed the data: run the export on your machine, copy `backup/` to the mini
   PC, then `docker compose exec api bun src/scripts/import-firestore-dump.ts`,
   followed by `user:create` for each account.

### Backups

The `backup` service runs `pg_dump` nightly into `./backup/postgres`, keeping 7
daily, 4 weekly and 6 monthly copies. Restore one with:

```bash
gunzip -c backup/postgres/daily/finance-<date>.sql.gz \
  | docker compose exec -T postgres psql -U finance -d finance
```

Point that directory at whatever the mini PC already backs up off-site.

## Decisions taken on the real data

- **178 transaction documents held nothing but their id.** Verified against
  live Firestore: they exist with zero fields and no subcollections. Skipped.
- **Two categories carried `type: "nail"`** ("Gel", "semipermanente"), a type
  the app never supported. Nothing referenced them — no transaction, no stats
  row — so they are dropped, and the enum stays expense/earning. The importer
  reports them under "dropped by design" on every run.
- Everything else imported: 2434 transactions, 23 categories, 18 tags, 88
  stats (619 category rows), 231 groceries, 16 todos, 1 setting. Per-year and
  per-type totals reconcile with the Firestore dump to the cent.

## Cutover — done

`finance.davideghiotto.it` now resolves to the mini PC. What changed at the
moment of the switch:

- The Cloudflare tunnel serves the domain from Traefik on the mini PC instead
  of Firebase Hosting.
- `.github/workflows/deploy-prod.yml` is gone, replaced by `ci.yml`, which
  only lints, builds and type-checks. Nothing deploys to Firebase any more.
- Firestore still holds the original data, untouched and no longer written to.
  The JSON dump under `backup/` is the portable copy of it.

### Rolling back

Firebase Hosting still has the last Firestore-based release, and
`firebase.json` / `.firebaserc` are still in the repo. To go back: point the
DNS record at Firebase again and redeploy the pre-migration commit
(`6b4c76c`, the last one before this work). Anything entered in Postgres after
the cutover would need re-entering — the export only runs Firestore to
Postgres, not the other way.

## Left for phase 2

- Offline writes: an IndexedDB outbox replaying on reconnect, restoring what
  Firestore did for free. `useSyncStore` already has the shape for it.
- Stats could become a Postgres view instead of frozen rows the client writes.
- The old `firestore.rules` in the repo is the expired 2020 starter template;
  the live rules were only ever edited in the console. Nothing depends on them
  after the cutover.
