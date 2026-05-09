#!/usr/bin/env bash
# install.sh — Set up SafeSight.AI for local development.
# Run from any directory; the script resolves the repo root from its own path.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT/SafeSight_server"
CLIENT_DIR="$ROOT/SafeSight_client"

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[install]${NC} $*"; }
warn() { echo -e "${YELLOW}[install]${NC} $*"; }
die()  { echo -e "${RED}[install]${NC} $*" >&2; exit 1; }

echo ""
log "SafeSight.AI — install"
echo "────────────────────────────────────────"

# ── 1. Check system dependencies ─────────────────────────────────────────────

log "Checking system dependencies…"

command -v python3 >/dev/null 2>&1 || die "python3 not found. Install Python 3.11+."
command -v node    >/dev/null 2>&1 || die "node not found. Install Node.js 18+."
command -v npm     >/dev/null 2>&1 || die "npm not found."

PYTHON_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
NODE_VER=$(node --version)
NPM_VER=$(npm --version)

log "  python3 ${PYTHON_VER}  |  node ${NODE_VER}  |  npm ${NPM_VER}"

# Warn if Python < 3.11
PYTHON_MAJOR=$(python3 -c 'import sys; print(sys.version_info.major)')
PYTHON_MINOR=$(python3 -c 'import sys; print(sys.version_info.minor)')
if (( PYTHON_MAJOR < 3 || (PYTHON_MAJOR == 3 && PYTHON_MINOR < 11) )); then
  warn "Python 3.11+ is recommended (found ${PYTHON_VER}). Some packages may not install correctly."
fi

# ── 2. Backend environment file ───────────────────────────────────────────────

log "Checking SafeSight_server/.env…"
if [[ ! -f "$SERVER_DIR/.env" ]]; then
  cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
  log "  Created SafeSight_server/.env from .env.example"
  warn "  ⚠  Open SafeSight_server/.env and set your HF_TOKEN before starting."
else
  log "  SafeSight_server/.env already exists — skipping."
fi

# ── 3. Frontend environment file ─────────────────────────────────────────────

log "Checking SafeSight_client/.env.local…"
if [[ ! -f "$CLIENT_DIR/.env.local" ]]; then
  cp "$CLIENT_DIR/.env.example" "$CLIENT_DIR/.env.local"
  log "  Created SafeSight_client/.env.local from .env.example"
  log "  NEXT_PUBLIC_API_BASE_URL → http://127.0.0.1:8000"
else
  log "  SafeSight_client/.env.local already exists — skipping."
fi

# ── 4. Python virtualenv ──────────────────────────────────────────────────────

log "Setting up Python virtualenv in SafeSight_server/venv…"
if [[ ! -d "$SERVER_DIR/venv" ]]; then
  python3 -m venv "$SERVER_DIR/venv"
  log "  Virtualenv created."
else
  log "  Virtualenv already exists."
fi

# ── 5. Python dependencies ────────────────────────────────────────────────────

log "Installing Python dependencies (this may take a few minutes)…"
"$SERVER_DIR/venv/bin/pip" install --upgrade pip --quiet
"$SERVER_DIR/venv/bin/pip" install -r "$SERVER_DIR/requirements.txt" --quiet
log "  Python dependencies installed."

# ── 6. Node dependencies ──────────────────────────────────────────────────────

log "Installing Node dependencies…"
(cd "$CLIENT_DIR" && npm install --silent)
log "  Node dependencies installed."

# ── 7. Data directories ───────────────────────────────────────────────────────

log "Ensuring server data directories exist…"
mkdir -p \
  "$SERVER_DIR/storage/uploads" \
  "$SERVER_DIR/storage/inspections" \
  "$SERVER_DIR/frames" \
  "$SERVER_DIR/events" \
  "$SERVER_DIR/uploads" \
  "$SERVER_DIR/models" \
  "$SERVER_DIR/.ultralytics"

# Ensure .gitkeep files exist so the directories are tracked in git
for gitkeep in \
  "$SERVER_DIR/storage/uploads/.gitkeep" \
  "$SERVER_DIR/storage/inspections/.gitkeep" \
  "$SERVER_DIR/frames/.gitkeep" \
  "$SERVER_DIR/events/.gitkeep" \
  "$SERVER_DIR/uploads/.gitkeep"; do
  [[ -f "$gitkeep" ]] || touch "$gitkeep"
done

# ── 8. YOLO model check ───────────────────────────────────────────────────────

if [[ -f "$SERVER_DIR/models/best.pt" ]]; then
  log "YOLO model found: SafeSight_server/models/best.pt ✓"
else
  warn "⚠  YOLO model not found at SafeSight_server/models/best.pt"
  warn "   Place your trained model there before running inspections."
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}✅  Installation complete.${NC}"
echo ""
echo "  Required before first run:"
echo "    1. Edit  SafeSight_server/.env  — set your HF_TOKEN"
echo "    2. Place SafeSight_server/models/best.pt  (YOLO model)"
echo ""
echo "  Start the application:"
echo "    make start           # backend + frontend (local dev)"
echo "    make docker-start    # via Docker Compose"
echo ""
