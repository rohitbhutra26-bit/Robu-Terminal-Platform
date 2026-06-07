#!/bin/bash
# Installs a macOS launchd agent that runs the daily sync at ~6 AM
# (or when the Mac next wakes, if it was asleep). Run this ONCE on each laptop.
cd "$(dirname "$0")"
PLATFORM="$(pwd)"
SCRIPT="$PLATFORM/scripts/daily-sync.sh"
PLIST="$HOME/Library/LaunchAgents/com.robu.daily-sync.plist"

chmod +x "$SCRIPT" 2>/dev/null
mkdir -p "$HOME/Library/LaunchAgents" "$PLATFORM/.logs"

cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.robu.daily-sync</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>6</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>$PLATFORM/.logs/daily-sync.out.log</string>
  <key>StandardErrorPath</key><string>$PLATFORM/.logs/daily-sync.err.log</string>
</dict>
</plist>
PL

launchctl unload "$PLIST" 2>/dev/null
launchctl load "$PLIST" 2>/dev/null

echo "=================================================="
echo "  Daily 6 AM auto-sync INSTALLED on this laptop."
echo "=================================================="
echo "  - Pulls latest for the platform + charts repos, and refreshes"
echo "    Valuation, every morning at 6 AM (or on next wake if asleep)."
echo "  - Runs with no apps open and NO AI — works even if a usage limit is hit."
echo "  - Only acts when something actually changed on GitHub."
echo ""
echo "  Logs:        $PLATFORM/.logs/daily-sync.log"
echo "  Test it now: bash scripts/daily-sync.sh"
echo "  To remove:   launchctl unload \"$PLIST\" && rm \"$PLIST\""
echo ""
echo "You can close this window."
