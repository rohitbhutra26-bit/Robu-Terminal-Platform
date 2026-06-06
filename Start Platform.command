#!/bin/bash
# ============================================================
#  Robu Terminal — unified platform launcher
#  Valuation & Automated are NATIVE in the shell. This only needs
#  to start the two local engines, set up the DB, then the shell.
# ============================================================
cd "$(dirname "$0")"
mkdir -p .logs
# Make node / python tools findable when launched by double-click.
export PATH="/usr/local/bin:/opt/homebrew/bin:/Library/Frameworks/Python.framework/Versions/3.14/bin:$PATH"

# ---- EDIT THESE PATHS IF YOUR FOLDERS DIFFER ----
SHELL_DIR="$(pwd)"
DATA_DIR="$SHELL_DIR/data-server"   # bundled Valuation data engine (travels with the repo)

# Valuation & Automated are NATIVE in the shell now — no external folders needed.
# Charts (Kite) is still a separate repo; find it across both laptops' layouts.
CHARTS_DIR=""
for c in \
  "$HOME/Documents/Claude/Projects/Robu Terminal/Robu-Terminal-/core" \
  "$HOME/Documents/Robu-Terminal-/core" \
  "$HOME/Documents/Claude/Projects/Robu Terminal/Robu-Terminal-" \
  "$HOME/Documents/Robu-Terminal-"; do
  if [ -f "$c/app.py" ]; then CHARTS_DIR="$c"; break; fi
done
# --------------------------------------------------

start_py () {  # name dir cmd...
  local name="$1" dir="$2"; shift 2
  if [ -d "$dir" ]; then
    echo "  starting $name ..."
    ( cd "$dir" && "$@" >> "$SHELL_DIR/.logs/$name.log" 2>&1 & )
  else
    echo "  (skip $name — folder not found: $dir)"
  fi
}

echo "=================================================="
echo "   Robu Terminal — starting up"
echo "=================================================="

# 1) Kite Charts  (FastAPI -> port 8010)
start_py "charts" "$CHARTS_DIR" python3 -m uvicorn app:app --port 8010

# 2) Valuation data server (FastAPI -> port 8000) — feeds the native Valuation tab.
start_py "data-server" "$DATA_DIR" bash start.sh

# 3) Shell + native modules (Next -> port 3000)
echo "  preparing shell (installing deps if needed) ..."
npm install --no-audit --no-fund --loglevel=error
echo "  setting up local database (Automated System) ..."
npx prisma db push --skip-generate >> "$SHELL_DIR/.logs/db.log" 2>&1 \
  || npx prisma db push >> "$SHELL_DIR/.logs/db.log" 2>&1
# seed the 6 accounts (idempotent upsert) so the import screen always has accounts
npm run db:seed >> "$SHELL_DIR/.logs/db.log" 2>&1 || true
echo "  starting terminal on :3000 ..."
( sleep 6 && open "http://localhost:3000" ) &
echo ""
echo "Running. Logs are in the .logs folder."
echo "Keep this window open. Press Ctrl+C to stop."
echo ""
npm run dev
