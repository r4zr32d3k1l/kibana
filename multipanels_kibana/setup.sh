#!/usr/bin/env bash
#
# End-to-end setup for the "multipanels" Security demo: a real Kibana (this checkout) running in
# serverless Security mode against a local stateful Elasticsearch, cut down to AlertZero, Alerts
# and Agents, with fake data and a canned LLM. See multipanels_kibana/README.md.
#
#   multipanels_kibana/setup.sh all        # everything below, servers in tmux sessions
#   multipanels_kibana/setup.sh deps       # Node (.nvmrc) + pnpm + `kbn bootstrap`
#   multipanels_kibana/setup.sh es         # start Elasticsearch (foreground)
#   multipanels_kibana/setup.sh mock-llm   # start the canned OpenAI-compatible server (foreground)
#   multipanels_kibana/setup.sh kibana     # start Kibana (foreground)
#   multipanels_kibana/setup.sh seed       # fake alerts + AlertZero proposals (needs Kibana up)
#
# Login: elastic / changeme at http://localhost:5601 (lands on Alerts).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="$ROOT/multipanels_kibana"
ES_INSTALL_PATH="${ES_INSTALL_PATH:-$ROOT/.es/multipanels}"
ES_DATA_PATH="${ES_DATA_PATH:-$ROOT/.es/multipanels-data}"
ES_URL="${ES_URL:-http://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
MOCK_LLM_PORT="${MOCK_LLM_PORT:-18800}"
ES_JAVA_OPTS="${ES_JAVA_OPTS:--Xms2g -Xmx2g}"
TMUX_CONF="${TMUX_CONF:-}"
AUTH="elastic:changeme"

log() { printf '\n[multipanels] %s\n' "$*"; }

tmux_cmd() {
  if [ -n "$TMUX_CONF" ] && [ -f "$TMUX_CONF" ]; then tmux -f "$TMUX_CONF" "$@"; else tmux "$@"; fi
}

use_node() {
  # Prefer the nvm-managed Node from .nvmrc so a stray system Node does not shadow it.
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    nvm install >/dev/null
    nvm use >/dev/null
  fi
  local wanted
  wanted="$(tr -d 'v[:space:]' < "$ROOT/.nvmrc")"
  if [ "$(node -p 'process.versions.node')" != "$wanted" ]; then
    echo "Node $wanted is required (found $(node -v)); install it with nvm or pin PATH." >&2
    exit 1
  fi
}

cmd_deps() {
  use_node
  log "Node $(node -v) at $(command -v node)"
  corepack enable >/dev/null 2>&1 || true
  corepack prepare --activate >/dev/null 2>&1 || true
  log "pnpm $(pnpm --version)"
  log "Bootstrapping Kibana (this takes a while on a fresh checkout)"
  (cd "$ROOT" && node scripts/kbn bootstrap)
}

install_service_token() {
  # The dev CLI authenticates to a localhost Elasticsearch with the `elastic/kibana/kibana-dev`
  # service-account token in serverless mode. A stateful ES only knows about it through the
  # file-based token realm, so drop the token file into its config dir as soon as it exists; ES
  # reloads that file on change.
  local token_src="$ROOT/src/platform/packages/shared/kbn-es/src/serverless_resources/service_tokens"
  local attempts=0
  until [ -d "$ES_INSTALL_PATH/config" ]; do
    attempts=$((attempts + 1))
    if [ "$attempts" -gt 600 ]; then
      echo "Elasticsearch config dir never appeared at $ES_INSTALL_PATH/config" >&2
      return 1
    fi
    sleep 1
  done
  cp "$token_src" "$ES_INSTALL_PATH/config/service_tokens"
  log "Installed kibana-dev service token into $ES_INSTALL_PATH/config/service_tokens"
}

cmd_es() {
  use_node
  mkdir -p "$ES_DATA_PATH"
  install_service_token &
  log "Starting Elasticsearch snapshot (trial license, data in $ES_DATA_PATH)"
  cd "$ROOT"
  ES_JAVA_OPTS="$ES_JAVA_OPTS" exec node scripts/es snapshot \
    --license trial \
    --install-path "$ES_INSTALL_PATH" \
    -E xpack.security.authc.api_key.enabled=true \
    -E path.data="$ES_DATA_PATH" \
    --ready-timeout 5m
}

cmd_mock_llm() {
  use_node
  log "Starting mock LLM on port $MOCK_LLM_PORT"
  exec node "$DEMO_DIR/mock_llm_server.mjs" "$MOCK_LLM_PORT"
}

cmd_kibana() {
  use_node
  log "Starting Kibana in serverless Security mode with the demo config"
  cd "$ROOT"
  exec node scripts/kibana --dev --serverless=security --no-uiam \
    --config "$DEMO_DIR/kibana.multipanels.yml"
}

wait_for_http() {
  local url="$1" label="$2" attempts=0 max="${3:-600}"
  until curl -s -o /dev/null -u "$AUTH" "$url"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -gt "$max" ]; then
      echo "$label did not come up at $url" >&2
      return 1
    fi
    sleep 2
  done
}

wait_for_kibana() {
  log "Waiting for Kibana at $KIBANA_URL"
  local attempts=0
  until curl -s -u "$AUTH" "$KIBANA_URL/api/status" | grep -q '"level":"available"'; do
    attempts=$((attempts + 1))
    if [ "$attempts" -gt 900 ]; then
      echo "Kibana never reported status 'available'" >&2
      return 1
    fi
    sleep 2
  done
}

cmd_seed() {
  use_node
  wait_for_kibana
  cd "$ROOT"
  log "Opening the Alerts page once so the detection alert indices exist"
  curl -s -o /dev/null -u "$AUTH" -H 'kbn-xsrf: true' -X POST "$KIBANA_URL/api/detection_engine/index" || true

  log "Generating endpoint events, cloud/SaaS audit events and honest detection alerts"
  node x-pack/solutions/security/plugins/security_solution/scripts/data/generate_cli.js \
    -n 150 -h 6 -u 6 --start-date 2d --end-date now \
    --packs okta,aws-iam,kubernetes,github-actions --fp-count 1 \
    --alert-mode preview \
    --kibanaUrl "$KIBANA_URL" --elasticsearchUrl "$ES_URL"

  log "Indexing the AlertZero hand-labelled eval alerts (critical/high Defend alerts)"
  node x-pack/solutions/security/plugins/alertzero/scripts/index_eval_alerts.js \
    --es "$ES_URL" --kibana "$KIBANA_URL"

  log "Seeding AlertZero proposals + their Agent Builder conversations"
  KIBANA_URL="$KIBANA_URL" ES_URL="$ES_URL" \
    bash x-pack/solutions/security/plugins/alertzero/scripts/seed_proposal_attachments.sh

  log "Seeded. Open $KIBANA_URL (elastic / changeme)."
}

start_in_tmux() {
  local session="$1" command="$2"
  if tmux_cmd has-session -t "=$session" 2>/dev/null; then
    log "tmux session '$session' already exists, leaving it alone"
    return
  fi
  tmux_cmd new-session -d -s "$session" -c "$ROOT" -- bash -lc "$command; echo; echo '[exited] press enter to close'; read -r"
  log "Started '$session' in tmux (attach with: tmux attach -t $session)"
}

cmd_all() {
  cmd_deps
  start_in_tmux multipanels-es "$DEMO_DIR/setup.sh es"
  start_in_tmux multipanels-mock-llm "$DEMO_DIR/setup.sh mock-llm"
  log "Waiting for Elasticsearch at $ES_URL"
  wait_for_http "$ES_URL/_cluster/health" "Elasticsearch" 300
  start_in_tmux multipanels-kibana "$DEMO_DIR/setup.sh kibana"
  cmd_seed
}

case "${1:-all}" in
  all) cmd_all ;;
  deps) cmd_deps ;;
  es) cmd_es ;;
  mock-llm) cmd_mock_llm ;;
  kibana) cmd_kibana ;;
  seed) cmd_seed ;;
  *)
    sed -n '2,14p' "${BASH_SOURCE[0]}"
    exit 1
    ;;
esac
