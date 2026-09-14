# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev       # Dev server on port 8080 (proxies /api to localhost:3000)
bun run build     # TypeScript + Vite build → dist/
bun run compile   # TypeScript type-checking only
bun run pwa       # Build + preview PWA

cd backend
bun run dev           # API with watch mode on port 3000
bun run db:generate   # New migration from the drizzle schema
bun run db:migrate    # Apply migrations
bun run import        # Load a Firestore dump into Postgres
bun run user:create   # Create a login / reset a password

docker compose up -d --build   # Whole stack locally: postgres + api + nginx
```

## Tech Stack

- **React 18** with React Router v6 (lazy-loaded pages)
- **Zustand** for state management (stores: user, transaction, category, tag, stats, loading)
- **Backend**: Bun + Hono + Drizzle ORM over **Postgres 17** (`backend/`)
- **Tailwind CSS 3** with Radix UI primitives (shadcn/ui pattern)
- **Recharts** for statistics visualizations
- **Vite 5** with vite-plugin-pwa (Workbox service worker)
- **Bun** as package manager

## Architecture

### Data Flow

REST + SSE → Zustand stores → React components. The `DataBaseClient` in `src/api/db.ts` is still the single API layer; it now calls the backend instead of Firestore, keeping every signature it had. Real-time subscriptions use the same `getRT()` pattern: the server announces which collection changed over `/api/events`, and `getRT` re-reads that collection.

### Key Patterns

- **Transaction store** (`src/stores/transaction.ts`): auto-splits into `expenses[]` and `earnings[]`, handles sorting and deduplication
- **Categories** have a `type` field (expense/earning) and `excludeFromBudget` flag — budget calculations must respect this
- **Protected routes** redirect to `/login`; the session is checked once at boot by `checkUserIsLoggedIn` in `src/api/auth.ts`
- **Auth**: email + password, Argon2id, httpOnly session cookie. No signup route — accounts come from `bun run user:create`
- **Admin system**: `is_admin` column on the user row, surfaced as `AppUser.isAdmin`
- **Online-only for now**: writes go straight to the API and `trackWrite` (`src/stores/sync.ts`) counts them while in flight. The Firestore offline cache has no replacement yet — see MIGRATION.md, phase 2. The service worker still serves the SPA shell for any navigation

### Styling

- Theme colors: background `#eaefea` (mint), expense `#cf1322` (red), earning `#3f8600` (green)
- Font: Montserrat (loaded from `/public/fonts/`)
- UI components in `src/components/ui/` use `cn()` utility (clsx + tailwind-merge)

## Deployment

- **Production is the homelab mini PC** (`debian`, 192.168.15.131), serving `finance.davideghiotto.it` through a Cloudflare tunnel and Traefik. Dokploy project `finance`, compose service `finance`, file `docker-compose.dokploy.yml`: `postgres`, `api` (Bun), `web` (nginx serving `dist/` and proxying `/api`), plus a nightly `pg_dump` sidecar. The API applies migrations on boot.
- **Redeploys are manual.** Dokploy is only reachable on the LAN (`dokploy.homelab.davideghiotto.it`), so GitHub cannot call its webhook: deploy from the Dokploy UI, or `POST /api/compose.deploy` with an API key.
- GitHub Actions (`.github/workflows/ci.yml`) only lints, builds and type-checks. Nothing deploys from CI.
- Firebase is retired. `firebase.json`, `.firebaserc` and the `firestore.*` files are kept as an inert rollback path — nothing reads them.
- Migration runbook, backup and cutover: **MIGRATION.md**.
