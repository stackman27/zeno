const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());

// Disable caching in development for hot reload
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
}

// Watch for bundle file changes and notify clients
if (process.env.NODE_ENV !== 'production') {
  const watchFiles = [
    path.join(__dirname, 'renderer.bundle.js'),
    path.join(__dirname, 'chat.bundle.js')
  ];
  
  watchFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.watchFile(file, { interval: 500 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          // Notify clients to reload
          io.emit('reload');
          console.log(`📦 ${path.basename(file)} rebuilt - reloading clients...`);
        }
      });
    }
  });
}

// Serve web-api.js
app.get('/web-api.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-api.js'));
});

// Serve index.html for all routes (SPA)
// Add cache busting for bundle files in development
app.get('*.bundle.js', (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
}, express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket/HTTP API to replace Electron IPC
let currentProcess = null;

// HTTP endpoint for running zeno command
app.post('/api/run-zeno', async (req, res) => {
  const options = req.body;
  
  // Kill any existing process
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
  }

  // Build command arguments
  const args = ['run'];
  
  if (options.repo) {
    args.push('--repo', options.repo);
  }
  if (options.ref) {
    args.push('--ref', options.ref);
  }
  if (options.workflow) {
    args.push('--workflow', options.workflow);
  }
  if (options.service) {
    args.push('--service', options.service);
  }
  if (options.publishUI !== undefined && options.publishUI !== '') {
    args.push('--publish-ui', options.publishUI.toString());
  }
  if (options.publishAPI !== undefined && options.publishAPI !== '') {
    args.push('--publish-api', options.publishAPI.toString());
  }
  if (options.entry) {
    args.push('--entry', options.entry);
  }
  
  // Handle directory path
  let dirPath = options.dir;
  if (!dirPath && options.repo) {
    const repoName = path.basename(options.repo).replace(/\.git$/, '');
    dirPath = path.join('repos', repoName);
  }
  
  if (dirPath) {
    dirPath = path.isAbsolute(dirPath) 
      ? dirPath 
      : path.resolve(path.join(__dirname, '..'), dirPath);
    args.push('--dir', dirPath);
  }
  
  if (options.timeout) {
    args.push('--timeout', options.timeout);
  }

  // Get the zeno binary path
  const zenoPath = path.join(__dirname, '..', 'zeno');
  const workingDir = path.join(__dirname, '..');
  
  // Spawn the process
  currentProcess = spawn(zenoPath, args, {
    cwd: workingDir,
    env: { ...process.env }
  });

  const result = {
    exitCode: null,
    stdout: '',
    stderr: ''
  };

  // Stream output via WebSocket
  currentProcess.stdout.on('data', (data) => {
    const text = data.toString();
    result.stdout += text;
    io.emit('zeno-output', { type: 'stdout', data: text });
  });

  currentProcess.stderr.on('data', (data) => {
    const text = data.toString();
    result.stderr += text;
    io.emit('zeno-output', { type: 'stderr', data: text });
  });

  currentProcess.on('close', (code) => {
    result.exitCode = code;
    io.emit('zeno-complete', result);
    currentProcess = null;
  });

  currentProcess.on('error', (error) => {
    result.error = error.message;
    io.emit('zeno-error', { error: error.message });
    currentProcess = null;
  });

  res.json({ success: true, message: 'Process started' });
});

// Endpoint to stop the process
app.post('/api/stop-zeno', (req, res) => {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
    res.json({ success: true, message: 'Process stopped' });
  } else {
    res.json({ success: false, message: 'No process running' });
  }
});

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Zeno web server running!`);
  console.log(`   Open in browser: http://localhost:${PORT}`);
});
