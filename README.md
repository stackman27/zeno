# ZENO

`zeno` is a lightweight CLI utility that clones Git repositories and executes workflows within a hardened Docker "runner" environment.

---

## 🚀 Quickstart

### 1. Prepare the Docker Runner
Ensure a clean environment by removing old images and building the latest runner:
Note: only need to run this if Dockerfile or runner.sh changes
```bash
# Clean existing image
docker rmi zeno/runner-polyglot:latest

# Build the hardened runner
docker build -t zeno/runner-polyglot:latest -f runner-polyglot.Dockerfile .
```

### 2. Build the Zeno Binary
Compile the Go source code into an executable:

```bash
go build -o zeno .
```

### 3. Set Environment Variables
Zeno requires an OpenAI API key for workflow execution:

```bash
export OPENAI_API_KEY="your_api_key_here"
```

## 🛠 Usage Examples
The following examples utilize the chat-buddy repository for testing.

### Run Full Stack (UI + API)
To launch both services simultaneously:

```bash
./zeno run \
  --repo https://github.com/stackman27/chat-buddy \
  --workflow run \
  --service all \
  --publish-ui 0 \
  --publish-api 0
```

Expected Output: Zeno will provide dynamic local URLs upon a successful start:

```
[info] UI: http://localhost:XXXXX
[info] API: http://localhost:YYYYY
```

### Run Services Individually

#### UI Only:

```bash
./zeno run \
  --repo https://github.com/stackman27/chat-buddy \
  --workflow run \
  --service ui \
  --publish-ui 0
```

#### API Only:

```bash
./zeno run \
  --repo https://github.com/stackman27/chat-buddy \
  --workflow run \
  --service api \
  --publish-api 0
```

##  Verification
To verify the API is responding correctly, run:

```bash
curl -i http://localhost:YYYYY/
```

For the frontend, simply open the UI URL provided in the terminal in your preferred web browser.

---

## 🔧 How It Works

### High-Level Flow

1. Clone repo into a temp directory
2. Detect project type:
   - `python`
   - `node`
   - `polyglot` monorepo (`python-server/` + `react-frontend/`)
3. Ensure runner image exists (build if missing)
4. Run container with:
   - repo mounted read-only at `/input`
   - scratch directory mounted read-write at `/work`
   - required env vars for workflow + service selection
   - published ports for UI/API depending on `--service`

### Why Copy `/input` → `/work/repo`?

`/input` is mounted read-only, so installs (`pip`/`npm`) would fail.

`runner.sh` copies repo contents into `/work/repo` so dependencies can be installed without modifying the mount.

### Python Installs (PEP 668 / Permission Issues)

The runner creates a venv at:

```
/work/venv
```

Then installs requirements into that venv. This avoids:

- Debian "externally managed environment" (PEP 668) errors
- permission errors from writing to system site-packages

### Polyglot Ports and Proxying

Inside the container (typical):

- CRA dev server listens on `3000`
- Flask API listens on `5000`

To publish stable "exposed" ports, the runner uses `socat`:

- Frontend: `3001` → `3000`
- Backend: `5001` → `5000`

Then Docker publishes host ports dynamically to those exposed ports.

