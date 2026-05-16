#!/Users/yiqi/.nvm/versions/node/v22.22.0/bin/node
const { spawn } = require('child_process');
const path = require('path');

const PROJECT = '/Users/yiqi/seeing-single-cell';
const NODE = '/Users/yiqi/.nvm/versions/node/v22.22.0/bin/node';
const NEXT = path.join(PROJECT, 'node_modules/next/dist/bin/next');

const env = Object.assign({}, process.env, {
  PATH: '/Users/yiqi/.nvm/versions/node/v22.22.0/bin:/usr/local/bin:/usr/bin:/bin',
  HOME: '/Users/yiqi',
});

// Clean old .next cache first
const fs = require('fs');
const cacheDir = path.join(PROJECT, '.next/cache');
try { fs.rmSync(cacheDir, { recursive: true, force: true }); } catch(e) {}

const child = spawn(NODE, [NEXT, 'dev', '--hostname', '127.0.0.1', '--port', '3000'], {
  cwd: PROJECT,
  env,
  stdio: ['pipe', process.stdout, process.stderr],
});

console.log(`🌐 Dev server starting on http://127.0.0.1:3000 (PID: ${child.pid})`);

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});
