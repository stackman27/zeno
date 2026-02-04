# Zeno Electron App

A beautiful Electron UI built with React and Chakra UI for running Zeno Docker workflows.

## Setup

1. Install dependencies:
```bash
cd electron-app
npm install
```

2. Make sure the `zeno` binary is built in the parent directory:
```bash
cd ..
go build -o zeno .
```

## Running

The app uses React with Chakra UI and requires a build step. Start the Electron app:
```bash
cd electron-app
npm start
```

This will:
1. Build the React app (bundles JSX and dependencies)
2. Launch the Electron window

For development with DevTools:
```bash
npm run dev
```

For web version use 
```bash
npm run dev:web
```


## Building

The build process uses `esbuild` to bundle React and Chakra UI:
```bash
npm run build
```

This creates `renderer.bundle.js` which is loaded by the Electron app.

## Features

- **Repository Configuration**: Enter Git repository URL and branch/ref
- **Workflow Selection**: Choose from run, test, lint, or build workflows
- **Service Selection**: Run all services, UI only, or API only
- **Port Configuration**: Set custom ports or use auto-assigned ports
- **Real-time Output**: Stream stdout and stderr with color-coded output
- **Process Control**: Start and stop running processes
- **Timeout Configuration**: Set custom timeout values

## Usage

1. Fill in the repository URL (required)
2. Select workflow type (run/test/lint/build)
3. Choose service (all/ui/api) - only relevant for polyglot repos
4. Optionally configure ports, entry file, timeout, etc.
5. Click "Run" to start the process
6. Monitor output in real-time
7. Use "Stop" to cancel a running process

## Requirements

- Node.js and npm
- Electron
- The `zeno` Go binary must be built and available in the parent directory
- Docker must be installed and running
