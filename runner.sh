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
  if [ ! -d "$PROJECT_VENV" ] || [ ! -f "$PROJECT_VENV/bin/python" ]; then
    python3 -m venv "$PROJECT_VENV"
    "$PROJECT_VENV/bin/python" -m pip install -U pip --quiet
  fi
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
      # Check if requirements.txt changed
      NEED_PIP_INSTALL=false
      if [ ! -f /work/python-server/.requirements.hash ]; then
        NEED_PIP_INSTALL=true
      else
        CURRENT_REQ_HASH=$(md5sum requirements.txt 2>/dev/null | cut -d' ' -f1 || md5 -q requirements.txt 2>/dev/null || echo "")
        CACHED_REQ_HASH=$(cat /work/python-server/.requirements.hash 2>/dev/null || echo "")
        if [ "$CURRENT_REQ_HASH" != "$CACHED_REQ_HASH" ]; then
          NEED_PIP_INSTALL=true
        fi
      fi
      
      if [ "$NEED_PIP_INSTALL" = "true" ]; then
        "$PROJECT_VENV/bin/python" -m pip install -r requirements.txt --quiet
        "$PROJECT_VENV/bin/python" -m pip install "werkzeug<3" --quiet
        # Cache requirements.txt hash
        md5sum requirements.txt 2>/dev/null | cut -d' ' -f1 > /work/python-server/.requirements.hash || \
        md5 -q requirements.txt 2>/dev/null > /work/python-server/.requirements.hash || true
      fi
    fi

# Only download NLTK data if not already cached
"$PROJECT_VENV/bin/python" - <<'PY'
import nltk, os
nltk_data_dir = os.environ["NLTK_DATA"]
punkt_path = os.path.join(nltk_data_dir, "tokenizers", "punkt")
if not os.path.exists(punkt_path):
    nltk.download("punkt", download_dir=nltk_data_dir, quiet=True)
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

  # Check if we need to reinstall (missing deps or package.json changed)
  NEED_INSTALL=false
  if [ ! -x node_modules/.bin/react-scripts ] 2>/dev/null; then
    NEED_INSTALL=true
  elif [ -f package.json ]; then
    # Compare package.json hash
    CURRENT_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1 || md5 -q package.json 2>/dev/null || echo "")
    CACHED_HASH=$(cat /work/react-node_modules/.package.json.hash 2>/dev/null || echo "")
    if [ -z "$CACHED_HASH" ] || [ "$CURRENT_HASH" != "$CACHED_HASH" ]; then
      NEED_INSTALL=true
    fi
  else
    NEED_INSTALL=true
  fi

  if [ "$NEED_INSTALL" = "true" ]; then
    echo "Installing React dependencies..." >&2
    npm install --silent
    # Cache package.json hash
    if [ -f package.json ]; then
      md5sum package.json 2>/dev/null | cut -d' ' -f1 > /work/react-node_modules/.package.json.hash || \
      md5 -q package.json 2>/dev/null > /work/react-node_modules/.package.json.hash || true
    fi
  else
    echo "Using cached React dependencies" >&2
  fi

  # Watch reliability on bind mounts
  export CHOKIDAR_USEPOLLING=true
  export WATCHPACK_POLLING=true
  export CHOKIDAR_INTERVAL=300
  export WATCHPACK_POLLING_INTERVAL=300

 
  unset WDS_SOCKET_HOST
  unset WDS_SOCKET_PATH
  export WDS_SOCKET_PORT=0
 
  export FAST_REFRESH=true

  # Disable ESLint and treat warnings as non-fatal
  export DISABLE_ESLINT_PLUGIN=true
  export ESLINT_NO_DEV_ERRORS=true
  export CI=false

  # Use 'dev' script if available, otherwise fall back to 'start'
  if node -e "p=require('./package.json');process.exit(!(p.scripts&&p.scripts.dev))" 2>/dev/null; then
    npm run dev &
  else
    npm start &
  fi
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

  # Give services a moment to start and verify they're running
  sleep 2
  
  # Verify processes are still alive
  if $want_ui && [ -n "${FRONT_PID:-}" ] && ! kill -0 "$FRONT_PID" 2>/dev/null; then
    echo "Frontend process exited immediately" >&2
    exit 1
  fi
  if $want_api && [ -n "${BACK_PID:-}" ] && ! kill -0 "$BACK_PID" 2>/dev/null; then
    echo "Backend process exited immediately" >&2
    exit 1
  fi

  # Services are running - log status
  if $want_ui && $want_api; then
    echo "Services running (monitoring frontend and backend)..." >&2
  elif $want_ui; then
    echo "Frontend service running..." >&2
  elif $want_api; then
    echo "Backend service running..." >&2
  fi

  # Wait for whichever is supposed to be alive
  # If both are running, wait for either to exit (which indicates an error)
  if $want_ui && $want_api && [ -n "${FRONT_PID:-}" ] && [ -n "${BACK_PID:-}" ]; then
    # Poll both processes - exit if either dies
    while kill -0 "$FRONT_PID" 2>/dev/null && kill -0 "$BACK_PID" 2>/dev/null; do
      sleep 1
    done
    # One of them exited - check which and get exit code
    if ! kill -0 "$FRONT_PID" 2>/dev/null; then
      wait "$FRONT_PID" || true
      EXIT_CODE=$?
      kill ${BACK_PID:-} ${BACK_PROXY_PID:-} 2>/dev/null || true
      exit ${EXIT_CODE:-1}
    elif ! kill -0 "$BACK_PID" 2>/dev/null; then
      wait "$BACK_PID" || true
      EXIT_CODE=$?
      kill ${FRONT_PID:-} ${FRONT_PROXY_PID:-} 2>/dev/null || true
      exit ${EXIT_CODE:-1}
    fi
  elif $want_ui && [ -n "${FRONT_PID:-}" ]; then
    wait "$FRONT_PID"
  elif $want_api && [ -n "${BACK_PID:-}" ]; then
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
    # Check if requirements.txt changed
    NEED_PIP_INSTALL=false
    if [ ! -f /work/.requirements.hash ]; then
      NEED_PIP_INSTALL=true
    else
      CURRENT_REQ_HASH=$(md5sum requirements.txt 2>/dev/null | cut -d' ' -f1 || md5 -q requirements.txt 2>/dev/null || echo "")
      CACHED_REQ_HASH=$(cat /work/.requirements.hash 2>/dev/null || echo "")
      if [ "$CURRENT_REQ_HASH" != "$CACHED_REQ_HASH" ]; then
        NEED_PIP_INSTALL=true
      fi
    fi
    
    if [ "$NEED_PIP_INSTALL" = "true" ]; then
      echo "Installing Python dependencies..." >&2
      "$PROJECT_VENV/bin/python" -m pip install -r requirements.txt --quiet
      # Cache requirements.txt hash
      md5sum requirements.txt 2>/dev/null | cut -d' ' -f1 > /work/.requirements.hash || \
      md5 -q requirements.txt 2>/dev/null > /work/.requirements.hash || true
    else
      echo "Using cached Python dependencies" >&2
    fi
  elif [ -f pyproject.toml ]; then
    # For now: require requirements.txt for run-mode repos, or implement pyproject installs later.
    ensure_project_venv
    # Check if pyproject.toml changed
    NEED_PIP_INSTALL=false
    if [ ! -f /work/.pyproject.hash ]; then
      NEED_PIP_INSTALL=true
    else
      CURRENT_HASH=$(md5sum pyproject.toml 2>/dev/null | cut -d' ' -f1 || md5 -q pyproject.toml 2>/dev/null || echo "")
      CACHED_HASH=$(cat /work/.pyproject.hash 2>/dev/null || echo "")
      if [ "$CURRENT_HASH" != "$CACHED_HASH" ]; then
        NEED_PIP_INSTALL=true
      fi
    fi
    
    if [ "$NEED_PIP_INSTALL" = "true" ]; then
      echo "Installing Python dependencies..." >&2
      "$PROJECT_VENV/bin/python" -m pip install -e . --quiet
      # Cache pyproject.toml hash
      md5sum pyproject.toml 2>/dev/null | cut -d' ' -f1 > /work/.pyproject.hash || \
      md5 -q pyproject.toml 2>/dev/null > /work/.pyproject.hash || true
    else
      echo "Using cached Python dependencies" >&2
    fi
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
  # npm cache locations (avoid writing into repo mount)
  export NPM_CONFIG_PREFIX="/work/npm-global"
  export npm_config_cache="/work/.npm-cache"
  mkdir -p "$NPM_CONFIG_PREFIX" "$npm_config_cache"

  # Keep deps in /work, but present them as ./node_modules
  mkdir -p /work/node_modules_cache/node_modules
  if [ ! -L node_modules ]; then
    rm -rf node_modules
    ln -s /work/node_modules_cache/node_modules node_modules
  fi

  # Check if we need to reinstall (missing deps or package files changed)
  NEED_INSTALL=false
  # Check if node_modules exists and has content (follow symlink)
  if [ ! -d /work/node_modules_cache/node_modules ] || [ ! "$(ls -A /work/node_modules_cache/node_modules 2>/dev/null)" ]; then
    NEED_INSTALL=true
  elif [ -f package.json ]; then
    # Check if package.json or lock files changed
    CURRENT_PKG_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1 || md5 -q package.json 2>/dev/null || echo "")
    CACHED_PKG_HASH=$(cat /work/node_modules_cache/.package.json.hash 2>/dev/null || echo "")
    
    LOCK_FILE=""
    LOCK_HASH=""
    if [ -f pnpm-lock.yaml ]; then
      LOCK_FILE="pnpm-lock.yaml"
      LOCK_HASH=$(md5sum pnpm-lock.yaml 2>/dev/null | cut -d' ' -f1 || md5 -q pnpm-lock.yaml 2>/dev/null || echo "")
    elif [ -f yarn.lock ]; then
      LOCK_FILE="yarn.lock"
      LOCK_HASH=$(md5sum yarn.lock 2>/dev/null | cut -d' ' -f1 || md5 -q yarn.lock 2>/dev/null || echo "")
    elif [ -f package-lock.json ]; then
      LOCK_FILE="package-lock.json"
      LOCK_HASH=$(md5sum package-lock.json 2>/dev/null | cut -d' ' -f1 || md5 -q package-lock.json 2>/dev/null || echo "")
    fi
    
    CACHED_LOCK_HASH=$(cat /work/node_modules_cache/.lock.hash 2>/dev/null || echo "")
    
    if [ -z "$CACHED_PKG_HASH" ] || [ "$CURRENT_PKG_HASH" != "$CACHED_PKG_HASH" ]; then
      NEED_INSTALL=true
    elif [ -n "$LOCK_FILE" ] && ([ -z "$CACHED_LOCK_HASH" ] || [ "$LOCK_HASH" != "$CACHED_LOCK_HASH" ]); then
      NEED_INSTALL=true
    fi
  else
    NEED_INSTALL=true
  fi

  if [ "$NEED_INSTALL" = "true" ]; then
    echo "Installing Node dependencies..." >&2
    if [ -f pnpm-lock.yaml ]; then
      pnpm install --frozen-lockfile --silent
    elif [ -f yarn.lock ]; then
      yarn install --frozen-lockfile --silent
    elif [ -f package-lock.json ]; then
      npm ci --silent
    else
      npm install --silent
    fi
    # Cache package.json and lock file hashes
    if [ -f package.json ]; then
      md5sum package.json 2>/dev/null | cut -d' ' -f1 > /work/node_modules_cache/.package.json.hash || \
      md5 -q package.json 2>/dev/null > /work/node_modules_cache/.package.json.hash || true
    fi
    if [ -n "$LOCK_FILE" ] && [ -f "$LOCK_FILE" ]; then
      md5sum "$LOCK_FILE" 2>/dev/null | cut -d' ' -f1 > /work/node_modules_cache/.lock.hash || \
      md5 -q "$LOCK_FILE" 2>/dev/null > /work/node_modules_cache/.lock.hash || true
    fi
  else
    echo "Using cached Node dependencies" >&2
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

run_electron() {
  if [ ! -d electron-app ]; then
    echo "electron-app directory not found" >&2
    exit 65
  fi

  pushd electron-app >/dev/null

  # npm cache locations (avoid writing into repo mount)
  export NPM_CONFIG_PREFIX="/work/npm-global"
  export npm_config_cache="/work/.npm-cache"
  mkdir -p "$NPM_CONFIG_PREFIX" "$npm_config_cache"
  
  # Electron cache directory (Electron tries to write to /.cache by default)
  export ELECTRON_CACHE="/work/.cache/electron"
  export ELECTRON_GET_USE_PROXY="0"
  # Set HOME to /work to avoid permission issues with ~/.cache
  export HOME="/work"
  mkdir -p "$ELECTRON_CACHE" "$HOME/.cache"

  # Keep deps in /work, but present them as ./node_modules
  mkdir -p /work/electron-node_modules/node_modules
  if [ ! -L node_modules ]; then
    rm -rf node_modules
    ln -s /work/electron-node_modules/node_modules node_modules
  fi

  # Check if we need to reinstall (missing deps or package files changed)
  NEED_INSTALL=false
  # Check if node_modules exists and has electron binary (follow symlink)
  if [ ! -d /work/electron-node_modules/node_modules/.bin ] || [ ! -f /work/electron-node_modules/node_modules/.bin/electron ]; then
    NEED_INSTALL=true
  elif [ -f package.json ]; then
    # Check if package.json or lock files changed
    CURRENT_PKG_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1 || md5 -q package.json 2>/dev/null || echo "")
    CACHED_PKG_HASH=$(cat /work/electron-node_modules/.package.json.hash 2>/dev/null || echo "")
    
    LOCK_FILE=""
    LOCK_HASH=""
    if [ -f pnpm-lock.yaml ]; then
      LOCK_FILE="pnpm-lock.yaml"
      LOCK_HASH=$(md5sum pnpm-lock.yaml 2>/dev/null | cut -d' ' -f1 || md5 -q pnpm-lock.yaml 2>/dev/null || echo "")
    elif [ -f yarn.lock ]; then
      LOCK_FILE="yarn.lock"
      LOCK_HASH=$(md5sum yarn.lock 2>/dev/null | cut -d' ' -f1 || md5 -q yarn.lock 2>/dev/null || echo "")
    elif [ -f package-lock.json ]; then
      LOCK_FILE="package-lock.json"
      LOCK_HASH=$(md5sum package-lock.json 2>/dev/null | cut -d' ' -f1 || md5 -q package-lock.json 2>/dev/null || echo "")
    fi
    
    CACHED_LOCK_HASH=$(cat /work/electron-node_modules/.lock.hash 2>/dev/null || echo "")
    
    if [ -z "$CACHED_PKG_HASH" ] || [ "$CURRENT_PKG_HASH" != "$CACHED_PKG_HASH" ]; then
      NEED_INSTALL=true
    elif [ -n "$LOCK_FILE" ] && ([ -z "$CACHED_LOCK_HASH" ] || [ "$LOCK_HASH" != "$CACHED_LOCK_HASH" ]); then
      NEED_INSTALL=true
    fi
  else
    NEED_INSTALL=true
  fi

  if [ "$NEED_INSTALL" = "true" ]; then
    echo "Installing Electron dependencies..." >&2
    if [ -f pnpm-lock.yaml ]; then
      pnpm install --frozen-lockfile --silent
    elif [ -f yarn.lock ]; then
      yarn install --frozen-lockfile --silent
    elif [ -f package-lock.json ]; then
      npm ci --silent
    else
      npm install --silent
    fi
    # Cache package.json and lock file hashes
    if [ -f package.json ]; then
      md5sum package.json 2>/dev/null | cut -d' ' -f1 > /work/electron-node_modules/.package.json.hash || \
      md5 -q package.json 2>/dev/null > /work/electron-node_modules/.package.json.hash || true
    fi
    if [ -n "$LOCK_FILE" ] && [ -f "$LOCK_FILE" ]; then
      md5sum "$LOCK_FILE" 2>/dev/null | cut -d' ' -f1 > /work/electron-node_modules/.lock.hash || \
      md5 -q "$LOCK_FILE" 2>/dev/null > /work/electron-node_modules/.lock.hash || true
    fi
  else
    echo "Using cached Electron dependencies" >&2
  fi

  case "$WORKFLOW" in
    run)
      # Run as web server with hot reload (accessible via browser)
      # Use PORT from environment or default to 3000
      export PORT="${FRONT_EXPOSE_PORT:-3000}"
      npm run dev:web &
      WEB_SERVER_PID=$!

      trap 'kill ${WEB_SERVER_PID:-} ${VNC_PID:-} ${XVFB_PID:-} 2>/dev/null || true' INT TERM

      # Wait for web server
      wait "$WEB_SERVER_PID"
      EXIT_CODE=$?

      # Cleanup
      kill ${WEB_SERVER_PID:-} ${VNC_PID:-} ${XVFB_PID:-} 2>/dev/null || true
      exit $EXIT_CODE
      ;;
    test)  npm test --silent ;;
    lint)  npm run lint --silent ;;
    build) npm run build --silent ;;
    *) echo "Unknown WORKFLOW: $WORKFLOW" >&2; exit 64 ;;
  esac

  popd >/dev/null
}

# Electron app detection: electron-app directory
if [ -d electron-app ] && [ -f electron-app/package.json ] && [ -f electron-app/main.js ]; then
  run_electron
  exit 0
fi

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
