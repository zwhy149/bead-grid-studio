import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../../tests/helpers/png.js';
import {
  generateBeadPattern,
  createCustomPalette,
  registerPaletteProvider,
  serializePattern,
} from '../../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('--- Custom Palette Integration Demo ---\n');

  // 1. Define a custom palette (e.g., retro GameBoy 4-color palette or starter kit)
  const retroPalette = createCustomPalette({
    id: 'gameboy-classic-4',
    name: 'GameBoy Classic 4-Color',
    source: 'retro-craft-starter',
    colors: [
      { code: 'GB-01', name: 'Darkest Green', hex: '#0F380F' },
      { code: 'GB-02', name: 'Dark Green', hex: '#306230' },
      { code: 'GB-03', name: 'Light Green', hex: '#8BAC0F' },
      { code: 'GB-04', name: 'Lightest Green', hex: '#9BBC0F' },
    ],
    anchors: {
      black: 'GB-01',
      white: 'GB-04',
    },
  });

  // 2. Register with the global provider registry so any module can reference it by ID
  registerPaletteProvider(retroPalette);
  console.log(`Registered custom palette "${retroPalette.name}" with ${retroPalette.colors.length} shades.`);

  // 3. Load sample image
  const imagePath = path.resolve(__dirname, '../../tests/fixtures/rocket-badge.png');
  const buffer = fs.readFileSync(imagePath);
  const imageData = decodePng(buffer);

  // 4. Quantize using our custom palette
  const pattern = await generateBeadPattern(imageData, {
    cols: 24,
    rows: 24,
    palette: retroPalette,
    processMode: 'pixel',
    title: 'Retro Rocket in GameBoy Palette',
  });

  console.log(`\nGenerated pattern: ${pattern.title}`);
  console.log(`Grid: ${pattern.grid.cols}x${pattern.grid.rows}`);
  console.log(`Palette ID: ${pattern.palette.id}`);
  console.log(`Total Beads: ${pattern.statistics.totalBeads}`);

  console.log('\nMaterial Breakdown:');
  pattern.statistics.colors.forEach((c) => {
    console.log(`  - [${c.code}] ${c.name} (${c.hex}): ${c.count} beads`);
  });

  // 5. Also demonstrate loading a palette from an external JSON file
  const jsonPalettePath = path.resolve(__dirname, '../palettes/monochrome-8.json');
  const externalJson = JSON.parse(fs.readFileSync(jsonPalettePath, 'utf8'));
  const monochromePalette = createCustomPalette(externalJson);

  const monoPattern = await generateBeadPattern(imageData, {
    cols: 20,
    rows: 20,
    palette: monochromePalette,
    title: 'Monochrome Rocket',
  });

  console.log(`\nSuccessfully generated monochrome pattern using external JSON palette: ${monoPattern.statistics.usedColors} colors used.`);
}

run().catch((err) => {
  console.error('Error in custom-palette demo:', err);
  process.exit(1);
});
