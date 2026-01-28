#!/usr/bin/env bash
set -euo pipefail

WORKFLOW="${WORKFLOW:-test}"
ENTRY="${ENTRY:-}"   # NEW: optional python/node entry (e.g. server.py)
EXPOSE_PORT="${EXPOSE_PORT:-5001}"
TARGET_PORT="${TARGET_PORT:-5000}"


# /input is the mounted repo (read-only)
# /work is a writable scratch volume (mounted)
mkdir -p /work/repo
tar -C /input -cf - . | tar -C /work/repo -xf -
cd /work/repo

pick_python_entry() {
  if [ -n "$ENTRY" ]; then
    echo "$ENTRY"
    return
  fi
  if [ -f server.py ]; then echo "server.py"; return; fi
  if [ -f app.py ]; then echo "app.py"; return; fi
  if [ -f main.py ]; then echo "main.py"; return; fi
  # fallback: first .py in root
  local first
  first="$(ls -1 *.py 2>/dev/null | head -n 1 || true)"
  if [ -n "$first" ]; then echo "$first"; return; fi
  echo ""
}

run_python() {
  if [ -f requirements.txt ]; then
    python -m pip install -U pip
    python -m pip install -r requirements.txt
  elif [ -f pyproject.toml ]; then
    python -m pip install -e .
  fi

  case "$WORKFLOW" in
    run)
        local py_entry
        py_entry="$(pick_python_entry)"
        if [ -z "$py_entry" ]; then
            echo "No python entrypoint found. Set ENTRY=server.py (or app.py/main.py)." >&2
            exit 64
        fi

        # Run app as-is (it may bind to 127.0.0.1)
        python "$py_entry" &
        app_pid=$!

        # Proxy: 0.0.0.0:$EXPOSE_PORT  ->  127.0.0.1:$TARGET_PORT
        # Requires socat installed in the runner image
       socat TCP-LISTEN:${EXPOSE_PORT},fork,reuseaddr TCP:127.0.0.1:${TARGET_PORT} &
        proxy_pid=$!

        trap 'kill $proxy_pid $app_pid 2>/dev/null || true' INT TERM
        wait $app_pid
    ;;
  esac
}

run_node() {
  if [ -f pnpm-lock.yaml ]; then
    pnpm install --frozen-lockfile
  elif [ -f yarn.lock ]; then
    yarn install --frozen-lockfile
  elif [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi

  case "$WORKFLOW" in
    run)
      # Prefer npm run start if present; else try node ENTRY
      if node -e "p=require('./package.json');process.exit(!(p.scripts&&p.scripts.start))" 2>/dev/null; then
        npm run start --silent
      else
        if [ -z "$ENTRY" ]; then
          echo "No node start script and ENTRY not set. Set ENTRY=path/to/index.js" >&2
          exit 64
        fi
        node "$ENTRY"
      fi
      ;;
    test)  npm test --silent ;;
    lint)  npm run lint --silent ;;
    build) npm run build --silent ;;
    *) echo "Unknown WORKFLOW: $WORKFLOW" >&2; exit 64 ;;
  esac
}

has_python=false
has_node=false

[[ -f pyproject.toml || -f requirements.txt || -f Pipfile ]] && has_python=true
[[ -f package.json ]] && has_node=true

# fallback for script-style repos
if ls *.py >/dev/null 2>&1; then
  has_python=true
fi

if $has_python && $has_node; then
  run_node
  run_python
elif $has_python; then
  run_python
elif $has_node; then
  run_node
else
  echo "Could not detect project type (no package.json / pyproject.toml / requirements.txt)" >&2
  exit 65
fi
