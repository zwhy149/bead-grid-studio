import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../../tests/helpers/png.js';
import {
  generateBeadPattern,
  getPaletteProvider,
  serializePattern,
} from '../../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const imagePath = path.resolve(__dirname, '../../tests/fixtures/rocket-badge.png');
  console.log(`Loading image from: ${imagePath}`);

  const buffer = fs.readFileSync(imagePath);
  const imageData = decodePng(buffer);

  console.log(`Decoded PNG: ${imageData.width}x${imageData.height}`);

  // Generate 29x29 bead pattern with standard MARD-221 palette
  const pattern = await generateBeadPattern(imageData, {
    cols: 29,
    rows: 29,
    palette: getPaletteProvider('mard-compatible-base-221'),
    processMode: 'cartoon',
    maxColors: 16,
    whiteMode: 'auto',
    title: 'Node.js Demo Pattern',
  });

  console.log('\n--- Generation Successful ---');
  console.log(`Title: ${pattern.title}`);
  console.log(`Dimensions: ${pattern.grid.cols}x${pattern.grid.rows}`);
  console.log(`Total Beads: ${pattern.statistics.totalBeads}`);
  console.log(`Colors Used: ${pattern.statistics.usedColors}`);

  console.log('\nTop 5 Required Materials:');
  pattern.statistics.colors.slice(0, 5).forEach((color) => {
    console.log(`  - [${color.code}] ${color.name}: ${color.count} beads (${(color.share * 100).toFixed(1)}%)`);
  });

  const outPath = path.join(__dirname, 'output-pattern.json');
  fs.writeFileSync(outPath, serializePattern(pattern, 2), 'utf8');
  console.log(`\nWrote JSON pattern conforming to schema to: ${outPath}`);
}

run().catch((err) => {
  console.error('Error in node-cli demo:', err);
  process.exit(1);
});
