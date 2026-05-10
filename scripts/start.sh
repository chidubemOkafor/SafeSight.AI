#!/usr/bin/env bash
# start.sh — Start the SafeSight.AI backend and frontend for local development.
# Both services are started; Ctrl+C stops everything cleanly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT/SafeSight_server"
CLIENT_DIR="$ROOT/SafeSight_client"
BACKEND_PORT=8000
FRONTEND_PORT=3000
BACKEND_LOG="$ROOT/.backend.log"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[start]${NC}  $*"; }
info() { echo -e "${CYAN}[start]${NC}  $*"; }
warn() { echo -e "${YELLOW}[start]${NC}  $*"; }
die()  { echo -e "${RED}[start]${NC}  $*" >&2; exit 1; }

# ── Cleanup on exit ───────────────────────────────────────────────────────────
BACKEND_PID=""

cleanup() {
  echo ""
  log "Shutting down…"
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  log "All services stopped."
}
trap cleanup EXIT INT TERM

# ── Pre-flight checks ─────────────────────────────────────────────────────────

echo ""
log "SafeSight.AI — start"
echo "────────────────────────────────────────"

[[ -d "$SERVER_DIR/venv" ]] \
  || die "Virtualenv not found. Run: make install"

[[ -d "$CLIENT_DIR/node_modules" ]] \
  || die "Node modules not found. Run: make install"

[[ -f "$SERVER_DIR/.env" ]] \
  || die "SafeSight_server/.env not found. Run: make install"

[[ -f "$CLIENT_DIR/.env.local" ]] \
  || die "SafeSight_client/.env.local not found. Run: make install"

# Check the backend URL configured in the client matches the port we'll use
CONFIGURED_URL=$(grep -E '^NEXT_PUBLIC_API_BASE_URL=' "$CLIENT_DIR/.env.local" | cut -d= -f2- || true)
if [[ -n "$CONFIGURED_URL" && "$CONFIGURED_URL" != *":$BACKEND_PORT"* ]]; then
  warn "SafeSight_client/.env.local has NEXT_PUBLIC_API_BASE_URL=$CONFIGURED_URL"
  warn "but the backend will start on port $BACKEND_PORT."
  warn "Update .env.local if they should match."
fi

if [[ ! -f "$SERVER_DIR/models/best.pt" ]]; then
  warn "⚠  SafeSight_server/models/best.pt not found — video inspection will fail."
fi

# ── Start backend ─────────────────────────────────────────────────────────────

log "Starting FastAPI backend on port ${BACKEND_PORT}…"
log "  Logs → $BACKEND_LOG"

(
  cd "$SERVER_DIR"
  venv/bin/uvicorn main:app \
    --host 127.0.0.1 \
    --port "$BACKEND_PORT" \
    --reload
) > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# ── Wait for backend health ───────────────────────────────────────────────────

log "Waiting for backend to become healthy…"
MAX_WAIT=60
WAITED=0

printf "  "
until curl -sf "http://127.0.0.1:$BACKEND_PORT/health" > /dev/null 2>&1; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo ""
    echo ""
    die "Backend process exited unexpectedly. See $BACKEND_LOG for details."
  fi
  if (( WAITED >= MAX_WAIT )); then
    echo ""
    echo ""
    die "Backend did not respond after ${MAX_WAIT}s. See $BACKEND_LOG for details."
  fi
  printf '.'
  sleep 1
  (( WAITED++ ))
done
echo ""
log "Backend is healthy (${WAITED}s)."

# ── Start frontend ────────────────────────────────────────────────────────────

log "Starting Next.js frontend on port ${FRONTEND_PORT}…"
echo ""

info "┌─────────────────────────────────────────────────────────┐"
info "│  SafeSight.AI is running                                │"
info "│                                                         │"
info "│  Frontend  →  http://localhost:${FRONTEND_PORT}                     │"
info "│  Backend   →  http://127.0.0.1:${BACKEND_PORT}                    │"
info "│  API Docs  →  http://127.0.0.1:${BACKEND_PORT}/docs               │"
info "│  Backend logs →  .backend.log                          │"
info "│                                                         │"
info "│  Press Ctrl+C to stop all services.                     │"
info "└─────────────────────────────────────────────────────────┘"
echo ""

# Run frontend in the foreground so output is visible in the terminal.
# When the user presses Ctrl+C, the trap cleanup() will kill the backend.
cd "$CLIENT_DIR"
exec npm run dev -- -p "$FRONTEND_PORT"
