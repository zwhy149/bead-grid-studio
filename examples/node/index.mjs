import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../../src/adapters/png.js';
import {
  generateBeadPattern,
  getPaletteProvider,
  serializePattern,
  validatePattern,
} from '../../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const imagePath = path.resolve(__dirname, '../../tests/fixtures/rocket-badge.png');
  const buffer = fs.readFileSync(imagePath);
  const imageData = decodePng(buffer);

  // Generate 29x29 bead pattern
  const pattern = await generateBeadPattern(imageData, {
    cols: 29,
    rows: 29,
    palette: getPaletteProvider('mard-compatible-base-221'),
    processMode: 'cartoon',
    maxColors: 16,
  });

  // Validate conforming to open pattern schema
  const validation = validatePattern(pattern);
  if (!validation.valid) {
    throw new Error(`Pattern validation failed: ${validation.errors.join(', ')}`);
  }

  console.log(`Generated Pattern: ${pattern.title}`);
  console.log(`Grid: ${pattern.grid.cols}x${pattern.grid.rows}, Total Beads: ${pattern.statistics.totalBeads}`);
  console.log(`JSON length: ${serializePattern(pattern).length} characters`);
}

main().catch(console.error);
