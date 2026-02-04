const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting development server with hot reload...\n');

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

// Start the web server
const server = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: process.env.PORT || '3000' },
  stdio: 'inherit',
  shell: true
});

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  rendererWatcher.kill();
  chatWatcher.kill();
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  rendererWatcher.kill();
  chatWatcher.kill();
  server.kill();
  process.exit(0);
});
