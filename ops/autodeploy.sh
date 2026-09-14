#!/bin/sh
# Watches a branch on GitHub and asks Dokploy to redeploy when it moves.
#
# Dokploy on this host is only reachable from the LAN, so GitHub cannot call
# its webhook: the polling has to happen from inside. Refs are read from the
# git dumb-HTTP endpoint rather than the REST API, which has no rate limit to
# trip over (the unauthenticated API allows 60 requests an hour, and a one
# minute poll would sit exactly on that ceiling).
set -eu

: "${DOKPLOY_URL:?set DOKPLOY_URL}"
: "${DOKPLOY_API_KEY:?set DOKPLOY_API_KEY}"
: "${COMPOSE_ID:?set COMPOSE_ID}"
REPO="${REPO:-davide97g/finance-davide-ghiotto}"
BRANCH="${BRANCH:-main}"
INTERVAL="${INTERVAL:-60}"
STATE_FILE="${STATE_FILE:-/state/last-deployed-sha}"

log() { echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') $*"; }

remote_sha() {
	curl -fsS --max-time 20 \
		"https://github.com/${REPO}.git/info/refs?service=git-upload-pack" |
		grep -o "[0-9a-f]\{40\} refs/heads/${BRANCH}\$" | head -1 | cut -d' ' -f1
}

trigger_deploy() {
	curl -fsS --max-time 60 -X POST \
		-H "x-api-key: ${DOKPLOY_API_KEY}" \
		-H 'content-type: application/json' \
		-d "{\"composeId\":\"${COMPOSE_ID}\"}" \
		"${DOKPLOY_URL}/api/compose.deploy"
}

mkdir -p "$(dirname "$STATE_FILE")"
[ -f "$STATE_FILE" ] || : > "$STATE_FILE"

log "watching ${REPO}@${BRANCH} every ${INTERVAL}s (last deployed: $(cat "$STATE_FILE" | cut -c1-7))"

while true; do
	# A failed poll must never kill the watcher: the network comes back.
	sha="$(remote_sha || true)"
	if [ -z "$sha" ]; then
		log "could not read ${BRANCH} from GitHub, retrying"
	elif [ "$sha" != "$(cat "$STATE_FILE")" ]; then
		log "${BRANCH} moved to $(echo "$sha" | cut -c1-7), deploying"
		if trigger_deploy >/dev/null; then
			echo "$sha" > "$STATE_FILE"
			log "deploy queued for $(echo "$sha" | cut -c1-7)"
		else
			# Leave the state file alone so the next tick retries this commit.
			log "deploy request failed, will retry"
		fi
	fi
	sleep "$INTERVAL"
done
