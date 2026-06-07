#!/bin/bash
# ============================================================
#  Robu Terminal — daily auto-sync
#  Runs via launchd at ~6 AM (or when the Mac next wakes if asleep).
#  Pulls the latest for the platform + charts repos and refreshes the
#  Valuation module. Pure bash + git — NO AI / Cowork dependency, so it
#  keeps working regardless of any usage limits.
#  Auth comes from the saved GitHub token (macOS Keychain credential helper).
# ============================================================
export PATH="/opt/homebrew/bin:/usr/local/bin:/Library/Frameworks/Python.framework/Versions/3.14/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Self-locate the platform folder (this script lives in <platform>/scripts/).
PLATFORM="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$PLATFORM/.logs/daily-sync.log"
mkdir -p "$PLATFORM/.logs"
exec >> "$LOG" 2>&1
echo ""
echo "===== $(date '+%Y-%m-%d %H:%M:%S') — daily sync ====="

pull_if_changed() {   # <dir> <label>
  local dir="$1" label="$2"
  [ -d "$dir/.git" ] || { echo "$label: no git repo at $dir — skip"; return; }
  cd "$dir" || return
  if ! git fetch origin >/dev/null 2>&1; then echo "$label: fetch failed (offline?)"; return; fi
  local L R; L=$(git rev-parse @ 2>/dev/null); R=$(git rev-parse '@{u}' 2>/dev/null)
  if [ -z "$R" ]; then echo "$label: no upstream set — skip"; return; fi
  if [ "$L" = "$R" ]; then
    echo "$label: already up to date"; return 1
  fi
  echo "$label: new changes found — pulling"
  git pull --no-rebase --autostash 2>&1 | tail -4
  return 0
}

# 1) Platform repo (shell, design system, charts UI, automated, valuation)
if pull_if_changed "$PLATFORM" "platform"; then
  echo "platform: installing deps / syncing db after update"
  cd "$PLATFORM"
  npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1
  npx prisma db push --skip-generate >/dev/null 2>&1
fi

# 2) Charts engine repo (Kite) — find it across both laptops' layouts
for c in \
  "$HOME/Documents/Claude/Projects/Robu Terminal/Robu-Terminal-" \
  "$HOME/Documents/Robu-Terminal-"; do
  [ -d "$c/.git" ] && { pull_if_changed "$c" "charts"; break; }
done

# 3) Valuation module — self-healing sync (won't apply a broken upstream)
cd "$PLATFORM"
bash "Update Valuation.command" 2>&1 | tail -3

echo "done $(date '+%H:%M:%S')"
