import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '../../bin/bead-grid.mjs');
const fixturePath = path.resolve(__dirname, '../../tests/fixtures/rocket-badge.png');

console.log('Running Bead Grid CLI via subprocess...\n');
const result = spawnSync('node', [cliPath, fixturePath, '-w', '24', '-h', '24', '--format', 'ascii'], {
  encoding: 'utf8',
});

if (result.error) {
  console.error('CLI execution failed:', result.error);
  process.exit(1);
}

console.log(result.stdout);
if (result.stderr) console.error(result.stderr);
