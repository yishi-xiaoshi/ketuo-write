const { spawn } = require('child_process');
const path = require('path');

const projectDir = 'C:\\Users\\penglishi\\WorkBuddy\\Claw\\ketuo-write-system';
const viteBin = path.join(projectDir, 'node_modules', 'vite', 'bin', 'vite.js');
const nodeBin = 'C:\\Program Files\\nodejs\\node.exe';

const vite = spawn(nodeBin, [viteBin, 'preview', '--port', '3456', '--host', '0.0.0.0'], {
  cwd: projectDir,
  stdio: 'inherit'
});

vite.on('error', (err) => {
  console.error('Failed to start vite:', err);
  process.exit(1);
});
