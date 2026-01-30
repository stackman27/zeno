#!/usr/bin/env bash
set -euo pipefail

WORKFLOW="${WORKFLOW:-test}"
ENTRY="${ENTRY:-}"
SERVICE="${SERVICE:-all}"   # all|ui|api

NLTK_DATA="${NLTK_DATA:-/work/nltk_data}"
export NLTK_DATA
mkdir -p "$NLTK_DATA"

# Monorepo port wiring (container-side)
FRONT_EXPOSE_PORT="${FRONT_EXPOSE_PORT:-3001}"
FRONT_TARGET_PORT="${FRONT_TARGET_PORT:-3000}"
BACK_EXPOSE_PORT="${BACK_EXPOSE_PORT:-5001}"
BACK_TARGET_PORT="${BACK_TARGET_PORT:-5000}"

# Single-service (non-monorepo) wiring
EXPOSE_PORT="${EXPOSE_PORT:-5001}"
TARGET_PORT="${TARGET_PORT:-5000}"

cd /repo || { echo "/repo not mounted" >&2; exit 65; }


PROJECT_VENV="/work/venv"

ensure_project_venv() {
  python3 -m venv "$PROJECT_VENV"
  "$PROJECT_VENV/bin/python" -m pip install -U pip
}

run_monorepo_polyglot() {
  local want_ui=false
  local want_api=false
  case "$SERVICE" in
    all) want_ui=true; want_api=true ;;
    ui)  want_ui=true ;;
    api) want_api=true ;;
    *) echo "Unknown SERVICE: $SERVICE (expected all|ui|api)" >&2; exit 64 ;;
  esac

  # --- python backend ---
  if $want_api && [ -d python-server ]; then
    pushd python-server >/dev/null

    ensure_project_venv
    if [ -f requirements.txt ]; then
      "$PROJECT_VENV/bin/python" -m pip install -r requirements.txt
      "$PROJECT_VENV/bin/python" -m pip install "werkzeug<3"
    fi

"$PROJECT_VENV/bin/python" - <<'PY'
import nltk, os
nltk.download("punkt", download_dir=os.environ["NLTK_DATA"], quiet=True)
PY

    "$PROJECT_VENV/bin/python" -m main &
    BACK_PID=$!

    sleep 1
    if ! kill -0 "$BACK_PID" 2>/dev/null; then
      echo "backend exited immediately" >&2
      exit 1
    fi

    popd >/dev/null
  fi

# --- react frontend ---
if $want_ui && [ -d react-frontend ]; then
  pushd react-frontend >/dev/null

  # CRA bind + port inside container
  export HOST=0.0.0.0
  export PORT="${FRONT_EXPOSE_PORT:-3001}"

  # npm cache locations (avoid writing into repo mount)
  export NPM_CONFIG_PREFIX="/work/npm-global"
  export npm_config_cache="/work/.npm-cache"
  mkdir -p "$NPM_CONFIG_PREFIX" "$npm_config_cache"

  # Keep deps in /work, but present them as ./node_modules
mkdir -p /work/react-node_modules/node_modules
if [ ! -L node_modules ]; then
  rm -rf node_modules
  ln -s /work/react-node_modules/node_modules node_modules
fi

  # Install deps only if missing
  if [ ! -x node_modules/.bin/react-scripts ]; then
    rm -rf /work/react-node_modules/node_modules/*
    npm install
  fi

  # Watch reliability on bind mounts
  export CHOKIDAR_USEPOLLING=true
  export WATCHPACK_POLLING=true
  export CHOKIDAR_INTERVAL=300
  export WATCHPACK_POLLING_INTERVAL=300

 
export WDS_SOCKET_HOST=localhost
export WDS_SOCKET_PORT=$PORT
export WDS_SOCKET_PATH=/sockjs-node

  export FAST_REFRESH=true

  npm start &
  FRONT_PID=$!

  popd >/dev/null
fi




  # --- proxies (only for what we started) ---
#   if $want_ui; then
#     socat "TCP-LISTEN:${FRONT_EXPOSE_PORT},fork,reuseaddr" "TCP:127.0.0.1:${FRONT_TARGET_PORT}" &
#     FRONT_PROXY_PID=$!
#   fi

  if $want_api; then
    socat "TCP-LISTEN:${BACK_EXPOSE_PORT},fork,reuseaddr" "TCP:127.0.0.1:${BACK_TARGET_PORT}" &
    BACK_PROXY_PID=$!
  fi

  trap 'kill ${FRONT_PROXY_PID:-} ${BACK_PROXY_PID:-} ${FRONT_PID:-} ${BACK_PID:-} 2>/dev/null || true' INT TERM

  # Wait for whichever is supposed to be alive
  if $want_ui && [ "${FRONT_PID:-}" != "" ]; then
    wait "$FRONT_PID"
  elif $want_api && [ "${BACK_PID:-}" != "" ]; then
    wait "$BACK_PID"
  else
    echo "monorepo detected but requested service not started (SERVICE=$SERVICE)" >&2
    exit 65
  fi
}

pick_python_entry() {
  if [ -n "$ENTRY" ]; then echo "$ENTRY"; return; fi
  if [ -f server.py ]; then echo "server.py"; return; fi
  if [ -f app.py ]; then echo "app.py"; return; fi
  if [ -f main.py ]; then echo "main.py"; return; fi
  local first
  first="$(ls -1 *.py 2>/dev/null | head -n 1 || true)"
  if [ -n "$first" ]; then echo "$first"; return; fi
  echo ""
}

run_python() {
  if [ -f requirements.txt ]; then
    ensure_project_venv
    "$PROJECT_VENV/bin/python" -m pip install -r requirements.txt
  elif [ -f pyproject.toml ]; then
    # For now: require requirements.txt for run-mode repos, or implement pyproject installs later.
    ensure_project_venv
    "$PROJECT_VENV/bin/python" -m pip install -e .
  fi

  case "$WORKFLOW" in
    run)
      py_entry="$(pick_python_entry)"
      if [ -z "$py_entry" ]; then
        echo "No python entrypoint found. Set ENTRY=server.py (or app.py/main.py)." >&2
        exit 64
      fi

      "$PROJECT_VENV/bin/python" "$py_entry" &
      app_pid=$!

      socat "TCP-LISTEN:${EXPOSE_PORT},fork,reuseaddr" "TCP:127.0.0.1:${TARGET_PORT}" &
      proxy_pid=$!

      trap 'kill ${proxy_pid:-} ${app_pid:-} 2>/dev/null || true' INT TERM
      wait "$app_pid"
      ;;
    test)  "$PROJECT_VENV/bin/python" -m pytest -q ;;
    lint)  "$PROJECT_VENV/bin/python" -m ruff check . ;;
    build) "$PROJECT_VENV/bin/python" -m build ;;
    *) echo "Unknown WORKFLOW: $WORKFLOW" >&2; exit 64 ;;
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

# Monorepo polyglot layout: python-server + react-frontend
if [ "$WORKFLOW" = "run" ] && [ -d python-server ] && [ -d react-frontend ]; then
  run_monorepo_polyglot
  exit 0
fi

has_python=false
has_node=false
[[ -f pyproject.toml || -f requirements.txt || -f Pipfile ]] && has_python=true
[[ -f package.json ]] && has_node=true
if ls *.py >/dev/null 2>&1; then has_python=true; fi

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
