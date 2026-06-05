#!/bin/bash
# ============================================================
#  Robu Terminal — unified platform launcher
#  Starts each existing app on its own port, then the shell.
#  It does NOT modify any of your apps — only launches them.
# ============================================================
cd "$(dirname "$0")"
mkdir -p .logs
# Make node / python tools findable when launched by double-click.
export PATH="/usr/local/bin:/opt/homebrew/bin:/Library/Frameworks/Python.framework/Versions/3.14/bin:$PATH"

# ---- EDIT THESE PATHS IF YOUR FOLDERS DIFFER ----
SHELL_DIR="$(pwd)"
CHARTS_DIR="$HOME/Documents/Robu-Terminal-/core"
DATA_DIR="$SHELL_DIR/data-server"   # bundled (deployed-latest) — travels with this repo
VALU_DIR="$HOME/Documents/Claude/Projects/Robu Terminal/robu-valuation-next"
AUTO_DIR="$HOME/Documents/Claude/Projects/Automated System for Trading"
# --------------------------------------------------

# Phase B: start only Charts + shell. Flip to true once the other
# tools are wired in (Phases C & D) to launch everything at once.
START_ALL=false

start_py () {  # name dir cmd
  local name="$1" dir="$2"; shift 2
  if [ -d "$dir" ]; then
    echo "  starting $name ..."
    ( cd "$dir" && "$@" >> "$SHELL_DIR/.logs/$name.log" 2>&1 & )
  else
    echo "  (skip $name — folder not found: $dir)"
  fi
}

start_node () {  # name dir port
  local name="$1" dir="$2" port="$3"
  if [ -d "$dir" ]; then
    echo "  starting $name on :$port ..."
    ( cd "$dir" && { [ -d node_modules ] || npm install; } >> "$SHELL_DIR/.logs/$name.log" 2>&1
      npm run dev -- -p "$port" >> "$SHELL_DIR/.logs/$name.log" 2>&1 & )
  else
    echo "  (skip $name — folder not found: $dir)"
  fi
}

echo "=================================================="
echo "   Robu Terminal — starting all modules"
echo "=================================================="

# 1) Kite Charts  (FastAPI -> port 8010)
start_py "charts" "$CHARTS_DIR" python3 -m uvicorn app:app --port 8010

# 2) Valuation data server (FastAPI -> port 8000)
#    The Valuation tab is now NATIVE in the shell; its API routes call this.
#    start.sh installs its Python deps (pandas, yfinance, ...) then runs on :8000.
start_py "data-server" "$DATA_DIR" bash start.sh

if [ "$START_ALL" = true ]; then
  # Automated System (Next -> port 3001) — wired in Phase D
  start_node "automated" "$AUTO_DIR" 3001
fi

# 6) The shell itself (Next -> port 3000)
echo "  preparing shell (installing deps if needed) ..."
npm install --no-audit --no-fund --loglevel=error
echo "  starting shell on :3000 ..."
( sleep 6 && open "http://localhost:3000" ) &
echo ""
echo "All modules launching. Logs are in the .logs folder."
echo "Keep this window open. Press Ctrl+C to stop the shell."
echo ""
npm run dev
