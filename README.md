# finance-davide-ghiotto

![GitHub repo size](https://img.shields.io/github/repo-size/davide97g/finance-davide-ghiotto)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/davide97g/finance-davide-ghiotto/ci.yml?branch=main)

## Personal Finance Website

Live website [finance.davideghiotto.it](https://finance.davideghiotto.it) — self-hosted.

## Technology Stack

![](https://img.shields.io/static/v1?label=react&message=webapp&color=blue&logo=react)
![](https://img.shields.io/static/v1?label=bun%20%2B%20hono&message=api&color=black&logo=bun)
![](https://img.shields.io/static/v1?label=postgres&message=database&color=336791&logo=postgresql)
![](https://img.shields.io/static/v1?label=docker&message=homelab&color=2496ed&logo=docker)

React 18 PWA, Bun + Hono + Drizzle API, Postgres 17. Runs as a Compose stack
on a homelab mini PC behind Traefik, managed by Dokploy.

It used to be a Firebase app (Firestore + Auth + Hosting); the move off it,
including the data export and import, is written up in [MIGRATION.md](MIGRATION.md).
