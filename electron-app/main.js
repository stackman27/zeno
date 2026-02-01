const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let chatWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,  // Enable webview tag
      enableRemoteModule: false,
      sandbox: false
    },
    backgroundColor: '#f0f1f2',
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handler for running zeno command
let currentProcess = null;

ipcMain.handle('run-zeno', async (event, options) => {
  return new Promise((resolve, reject) => {
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
    
    // Handle directory path - always use absolute path for Docker
    let dirPath = options.dir;
    if (!dirPath && options.repo) {
      // Auto-generate default path from repo URL (like Go code does)
      const repoName = path.basename(options.repo).replace(/\.git$/, '');
      dirPath = path.join('repos', repoName);
    }
    
    if (dirPath) {
      // Convert relative paths to absolute paths (Docker requires absolute paths)
      dirPath = path.isAbsolute(dirPath) 
        ? dirPath 
        : path.resolve(path.join(__dirname, '..'), dirPath);
      args.push('--dir', dirPath);
    }
    
    if (options.timeout) {
      args.push('--timeout', options.timeout);
    }

    // Get the zeno binary path (assuming it's in the parent directory)
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

    // Stream stdout
    currentProcess.stdout.on('data', (data) => {
      const text = data.toString();
      result.stdout += text;
      event.sender.send('zeno-output', { type: 'stdout', data: text });
    });

    // Stream stderr
    currentProcess.stderr.on('data', (data) => {
      const text = data.toString();
      result.stderr += text;
      event.sender.send('zeno-output', { type: 'stderr', data: text });
    });

    // Handle process exit
    currentProcess.on('close', (code) => {
      result.exitCode = code;
      currentProcess = null;
      resolve(result);
    });

    // Handle errors
    currentProcess.on('error', (error) => {
      currentProcess = null;
      reject(error);
    });
  });
});

// IPC handler for stopping the process
ipcMain.handle('stop-zeno', async () => {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
    return { success: true };
  }
  return { success: false, message: 'No process running' };
});

// IPC handler for opening external browser
ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
  return { success: true };
});

// Chat window management
function createChatWindow() {
  if (chatWindow) {
    chatWindow.focus();
    return;
  }

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  chatWindow = new BrowserWindow({
    width: Math.floor(width * 0.4), // 40% of screen width
    height: Math.floor(height * 0.7), // 70% of screen height
    minWidth: 400,
    minHeight: 500,
    x: width - Math.floor(width * 0.4) - 20, // Position at top right
    y: 20,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: false,
      sandbox: false
    },
    backgroundColor: '#fafbfb',
    titleBarStyle: 'default',
    frame: true,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false
  });

  chatWindow.loadFile('chat.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    chatWindow.webContents.openDevTools();
  }

  chatWindow.on('closed', () => {
    chatWindow = null;
  });
}

ipcMain.handle('open-chat-window', async () => {
  createChatWindow();
  return { success: true };
});

ipcMain.handle('close-chat-window', async () => {
  if (chatWindow) {
    chatWindow.close();
    chatWindow = null;
  }
  return { success: true };
});

ipcMain.handle('is-chat-window-open', async () => {
  return { isOpen: chatWindow !== null && !chatWindow.isDestroyed() };
});
