const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du backend Inovexa...');

const tsNode = spawn('npx', ['ts-node', 'src/main.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

tsNode.on('error', (err) => {
  console.error('Erreur:', err);
});

tsNode.on('close', (code) => {
  console.log(`Processus terminé avec code ${code}`);
});
