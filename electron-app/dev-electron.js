const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Electron development mode with hot reload...\n');

// Start esbuild watchers
const rendererWatcher = spawn('npx', [
  'esbuild',
  'renderer.js',
  '--bundle',
  '--outfile=renderer.bundle.js',
  '--platform=browser',
  '--target=es2020',
  '--format=iife',
  '--jsx=automatic',
  '--loader:.js=jsx',
  '--loader:.jsx=jsx',
  '--external:electron',
  '--watch=forever'
], {
  stdio: 'inherit',
  shell: true
});

const chatWatcher = spawn('npx', [
  'esbuild',
  'chat-renderer.js',
  '--bundle',
  '--outfile=chat.bundle.js',
  '--platform=browser',
  '--target=es2020',
  '--format=iife',
  '--jsx=automatic',
  '--loader:.js=jsx',
  '--loader:.jsx=jsx',
  '--external:electron',
  '--watch=forever'
], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for initial build, then start Electron
setTimeout(() => {
  const electron = spawn('npx', ['electron', '.', '--dev'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'inherit',
    shell: true
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping Electron development server...');
    rendererWatcher.kill();
    chatWatcher.kill();
    electron.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    rendererWatcher.kill();
    chatWatcher.kill();
    electron.kill();
    process.exit(0);
  });
}, 1000);
