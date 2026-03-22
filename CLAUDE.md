# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev       # Dev server on port 8080
bun run build     # TypeScript + Vite build → dist/
bun run compile   # TypeScript type-checking only
bun run pwa       # Build + preview PWA
```

## Tech Stack

- **React 18** with React Router v6 (lazy-loaded pages)
- **Zustand** for state management (stores: user, transaction, category, tag, stats, loading)
- **Firebase 9**: Auth (Google OAuth), Firestore (real-time), Analytics, Hosting
- **Tailwind CSS 3** with Radix UI primitives (shadcn/ui pattern)
- **Recharts** for statistics visualizations
- **Vite 5** with vite-plugin-pwa (Workbox service worker)
- **Bun** as package manager

## Architecture

### Data Flow
Firestore `onSnapshot()` → Zustand stores → React components. The `DataBaseClient` in `src/api/db.ts` is the single API layer for all Firestore CRUD operations. Real-time subscriptions use the `getRT()` pattern which returns an unsubscribe function for cleanup.

### Key Patterns
- **Transaction store** (`src/stores/transaction.ts`): auto-splits into `expenses[]` and `earnings[]`, handles sorting and deduplication
- **Categories** have a `type` field (expense/earning) and `excludeFromBudget` flag — budget calculations must respect this
- **Protected routes** redirect to `/login` via `onAuthStateChanged` listener in `src/api/auth.ts`
- **Admin system**: hardcoded UID list in `useUserStore`

### Styling
- Theme colors: background `#eaefea` (mint), expense `#cf1322` (red), earning `#3f8600` (green)
- Font: Montserrat (loaded from `/public/fonts/`)
- UI components in `src/components/ui/` use `cn()` utility (clsx + tailwind-merge)

## Deployment

- Firebase Hosting to `finance-davide-ghiotto` site
- GitHub Actions (`.github/workflows/deploy-prod.yml`): push to main → build with bun → deploy
- Firebase config loaded via `VITE_*` env vars (single `ENV_FILE` GitHub secret writes `.env` at build time)
- Firestore rules/indexes managed via `firestore.rules` and `firestore.indexes.json`
