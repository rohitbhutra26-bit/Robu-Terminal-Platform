#!/bin/bash
cd "$(dirname "$0")"

# This server's code needs Python 3.10+ syntax; its pinned libraries ship
# prebuilt wheels through ~3.12. Pick the newest suitable Python available.
PY=""
for c in python3.12 python3.11 python3.13 python3.10 python3.14 python3; do
  if command -v "$c" >/dev/null 2>&1 && \
     "$c" -c 'import sys; sys.exit(0 if sys.version_info[:2] >= (3,10) else 1)' 2>/dev/null; then
    PY="$c"; break
  fi
done

if [ -z "$PY" ]; then
  echo "ERROR: Valuation data-server needs Python 3.10-3.12."
  echo "Install Python 3.12 from https://www.python.org/downloads/ then run again."
  exit 1
fi
echo "Using $($PY --version)"

# Rebuild the isolated env if missing or built with a different Python.
WANT="$($PY -V 2>&1)"
if [ -x .venv/bin/python ] && [ "$(.venv/bin/python -V 2>&1)" = "$WANT" ]; then
  :
else
  rm -rf .venv
  "$PY" -m venv .venv
fi

.venv/bin/python -m pip install --upgrade pip setuptools wheel -q
.venv/bin/python -m pip install -r requirements.txt -q
.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
