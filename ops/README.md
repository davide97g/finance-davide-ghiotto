# ops

## Auto-deploy on push to main

Dokploy on the mini PC answers only on the LAN, so GitHub cannot reach its
webhook. Instead a small container on the host polls the branch and asks
Dokploy to redeploy when it moves.

Install once, on the mini PC:

```bash
mkdir -p ~/finance-autodeploy && cd ~/finance-autodeploy
# copy ops/autodeploy.sh and ops/docker-compose.autodeploy.yml here
cat > .env <<'ENV'
DOKPLOY_URL=http://172.17.0.1:3000
DOKPLOY_API_KEY=<a Dokploy API key>
COMPOSE_ID=<the compose service id>
ENV
chmod 600 .env
docker compose -f docker-compose.autodeploy.yml up -d
```

Then every push to `main` is picked up within a minute and deployed. Check on
it with:

```bash
docker logs -f finance-autodeploy-autodeploy-1
```

Notes:

- The API key lives only in `~/finance-autodeploy/.env` on the host, never in
  the repo.
- The last deployed commit is kept in a docker volume, so a restart does not
  re-trigger a deploy for a commit already shipped.
- `restart: unless-stopped` brings the watcher back after a reboot or a power
  cut, like the app itself.
- To deploy by hand anyway: `POST /api/compose.deploy` with `{"composeId": …}`
  and the `x-api-key` header, or the Deploy button in the Dokploy UI.
