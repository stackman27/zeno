const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Zeno development server...\n');
console.log('📦 Step 1/3: Building renderer bundle...');

let rendererBuilt = false;
let chatBuilt = false;
let serverReady = false;

function checkReady() {
  if (rendererBuilt && chatBuilt && serverReady) {
    console.log('\n✅ All ready!');
    console.log(`   Open in browser: http://localhost:${process.env.PORT || '3000'}\n`);
  }
}

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
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

rendererWatcher.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Done in')) {
    if (!rendererBuilt) {
      rendererBuilt = true;
      console.log('   ✓ Renderer bundle built');
      console.log('📦 Step 2/3: Building chat bundle...');
    }
  }
});

rendererWatcher.stderr.on('data', (data) => {
  // Suppress esbuild warnings in output
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
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

chatWatcher.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Done in')) {
    if (!chatBuilt) {
      chatBuilt = true;
      console.log('   ✓ Chat bundle built');
      console.log('🌐 Step 3/3: Starting web server...');
    }
  }
});

chatWatcher.stderr.on('data', (data) => {
  // Suppress esbuild warnings in output
});

// Start the web server
const server = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: process.env.PORT || '3000' },
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

server.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Zeno web server running')) {
    if (!serverReady) {
      serverReady = true;
      checkReady();
    }
  }
});

server.stderr.on('data', (data) => {
  // Only show errors, not all stderr
  const output = data.toString();
  if (output.includes('Error') || output.includes('error')) {
    process.stderr.write(data);
  }
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
