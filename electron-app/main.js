const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let chatWindow = null;

// Watch for bundle file changes and reload window in development
if (process.argv.includes('--dev') || process.env.NODE_ENV === 'development') {
  const watchFiles = [
    path.join(__dirname, 'renderer.bundle.js'),
    path.join(__dirname, 'chat.bundle.js')
  ];
  
  watchFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.watchFile(file, { interval: 500 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime && mainWindow) {
          console.log(`🔄 Bundle changed, reloading window...`);
          mainWindow.reload();
        }
      });
    }
  });
}

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

// IPC handler for pushing to GitHub and creating PR
ipcMain.handle('push-to-github-pr', async (event, options) => {
  const { execSync } = require('child_process');
  const https = require('https');
  const path = require('path');
  
  try {
    const repoDir = options.repoDir || options.dir;
    if (!repoDir) {
      throw new Error('Repository directory not specified');
    }

    const absoluteRepoDir = path.isAbsolute(repoDir) 
      ? repoDir 
      : path.resolve(path.join(__dirname, '..'), repoDir);

    // Check if directory exists and is a git repo
    if (!fs.existsSync(absoluteRepoDir)) {
      throw new Error(`Repository directory does not exist: ${absoluteRepoDir}`);
    }

    const gitDir = path.join(absoluteRepoDir, '.git');
    if (!fs.existsSync(gitDir)) {
      throw new Error('Not a git repository');
    }

   
    // Always create PR in chat-buddy repository as specified
    const owner = 'stackman27';
    const repoName = 'chat-buddy';

    // Create branch name
    const branchName = `zeno-changes-${Date.now()}`;
    
    // Get GitHub token from environment (user should set this)
    // The token must belong to a collaborator (e.g., zenoAI-bot) with write access
    // and must have the 'repo' scope
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable not set. Please set it to create PRs.');
    }
    
    // Validate token format (GitHub tokens are typically 40+ characters, alphanumeric)
    // Trim any whitespace that might have been accidentally included
    const cleanToken = githubToken.trim();
    if (cleanToken.length < 20) {
      throw new Error('GITHUB_TOKEN appears to be invalid (too short). Please check your token.');
    }

    // Step 1: Check current branch and status
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: absoluteRepoDir,
      encoding: 'utf-8'
    }).trim();

    // Step 2: Check for uncommitted changes
    const status = execSync('git status --porcelain', {
      cwd: absoluteRepoDir,
      encoding: 'utf-8'
    }).trim();

    if (!status) {
      throw new Error('No changes to commit');
    }

    // Step 3: Create and checkout new branch
    execSync(`git checkout -b ${branchName}`, {
      cwd: absoluteRepoDir,
      stdio: 'inherit'
    });

    // Step 4: Add all changes
    execSync('git add -A', {
      cwd: absoluteRepoDir,
      stdio: 'inherit'
    });

    // Step 5: Commit changes
    const commitMessage = options.commitMessage || `Zeno: Automated changes from ${new Date().toISOString()}`;
    execSync(`git commit -m "${commitMessage}"`, {
      cwd: absoluteRepoDir,
      stdio: 'inherit'
    });

    // Step 6: Push to GitHub
    // Push to origin (which should be the fork - stackman27/chat-buddy)
    // The token must belong to the fork owner (stackman27) to have write access
   // --- FORCE a clean HTTPS remote and inject token exactly once ---

  
const remoteUrlWithToken = `https://${cleanToken}@github.com/stackman27/chat-buddy.git`;

execSync(`git remote set-url origin "${remoteUrlWithToken}"`, {
  cwd: absoluteRepoDir,
  shell: true
});

    // Push to origin (the fork) using zenoAI-bot token
    // Note: The token must belong to zenoAI-bot with write access and 'repo' scope
    try {
      execSync(`git push -u origin ${branchName}`, {
        cwd: absoluteRepoDir,
        stdio: 'inherit',
        env: { 
          ...process.env,
          GIT_ASKPASS: 'echo',
          GIT_TERMINAL_PROMPT: '0',
          // Disable all credential helpers via environment to force using token in URL
          // This only affects this specific command, not your global git config
          GIT_CREDENTIAL_HELPER: '',
          GIT_CREDENTIAL_HELPER_CACHE: '',
          GIT_CREDENTIAL_OSXKEYCHAIN: ''
        }
      });
    } catch (pushError) {
      throw pushError;
    }


    // Step 7: Create PR using GitHub API
    const prData = JSON.stringify({
      title: options.prTitle || `Zeno: Automated changes - ${new Date().toLocaleDateString()}`,
      body: options.prBody || `This PR contains automated changes generated by Zeno.\n\n**Branch:** ${branchName}\n**Base:** ${currentBranch}\n**Created:** ${new Date().toISOString()}`,
      head: branchName,
      base: currentBranch || 'main'
    });

    const prUrl = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repoName}/pulls`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': prData.length,
          'Authorization': `Bearer ${githubToken}`,
          'User-Agent': 'Zeno-Electron-App'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(data);
            resolve(response.html_url);
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(prData);
      req.end();
    });

    return {
      success: true,
      prUrl: prUrl,
      branchName: branchName,
      message: `Successfully created PR: ${prUrl}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
