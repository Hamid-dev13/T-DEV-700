
// Ensures required runtime deps are present in node_modules during container build.
// If missing, installs them (npm has internet in Docker build).

const { execSync } = require('node:child_process');
const required = [
  { name: 'react-router-dom', version: '6.26.x' },
  { name: 'recharts', version: '2.12.x' },
];

function has(dep) {
  try {
    require.resolve(dep);
    return true;
  } catch (e) {
    return false;
  }
}

const missing = required.filter(r => !has(r.name));
if (missing.length === 0) {
  console.log('[ensure-deps] All runtime deps present.');
  process.exit(0);
}

const toInstall = missing.map(m => `${m.name}@${m.version}`).join(' ');
console.log(`[ensure-deps] Installing missing deps: ${toInstall}`);
execSync(`npm install --no-audit --no-fund --prefer-online ${toInstall}`, {
  stdio: 'inherit'
});
console.log('[ensure-deps] Done.');
