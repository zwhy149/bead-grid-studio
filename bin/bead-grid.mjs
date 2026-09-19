#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../tests/helpers/png.js';
import {
  generateBeadPattern,
  createCustomPalette,
  PALETTE_PROVIDERS,
  serializePattern,
} from '../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

function printHelp() {
  console.log(`
Bead Grid Studio CLI v${pkg.version}
Headless pattern generator for fuse beads, mini-mosaics, and pixel crafts.

Usage:
  bead-grid <input.png> [options]

Options:
  -w, --width <num>       Target grid columns (default: 48)
  -h, --height <num>      Target grid rows (default: same as width)
  -p, --palette <id|path> Built-in palette ID or JSON palette file path
                          (default: "mard-compatible-base-221")
  -m, --mode <mode>       Processing mode: cartoon | detail | document | photo | pixel
                          (default: "cartoon")
  -c, --max-colors <num>  Maximum active material colors (default: 32)
  --white-mode <mode>     White background handling: auto | keep (default: "auto")
  --merge <num>           Color merge strength threshold (default: 10)
  --no-protect-dark       Disable dark outline protection
  -o, --output <file>     Write pattern JSON output to file
  --format <fmt>          Output display format: summary | ascii | json (default: summary)
  -v, --version           Show version number
  --help                  Show this help message

Available Built-in Palettes:
${Object.values(PALETTE_PROVIDERS).map((p) => `  - ${p.id.padEnd(28)} ${p.name} (${p.colors.length} colors)`).join('\n')}

Examples:
  bead-grid image.png -w 29 -h 29
  bead-grid logo.png -w 32 -p mard-mini-12 -o pattern.json
  bead-grid sprite.png -w 48 --format ascii
`);
}

function parseArgs(args) {
  const options = {
    input: null,
    width: 48,
    height: null,
    palette: 'mard-compatible-base-221',
    mode: 'cartoon',
    maxColors: 32,
    whiteMode: 'auto',
    mergeStrength: 10,
    protectDark: true,
    output: null,
    format: 'summary',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || (arg === '-h' && args.length === 1)) {
      options.help = true;
      return options;
    }
    if (arg === '-v' || arg === '--version') {
      options.version = true;
      return options;
    }
    if (arg === '-w' || arg === '--width') {
      options.width = parseInt(args[++i], 10);
    } else if (arg === '-h' || arg === '--height') {
      options.height = parseInt(args[++i], 10);
    } else if (arg === '-p' || arg === '--palette') {
      options.palette = args[++i];
    } else if (arg === '-m' || arg === '--mode') {
      options.mode = args[++i];
    } else if (arg === '-c' || arg === '--max-colors') {
      options.maxColors = parseInt(args[++i], 10);
    } else if (arg === '--white-mode') {
      options.whiteMode = args[++i];
    } else if (arg === '--merge') {
      options.mergeStrength = parseFloat(args[++i]);
    } else if (arg === '--no-protect-dark') {
      options.protectDark = false;
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[++i];
    } else if (arg === '--format') {
      options.format = args[++i];
    } else if (!arg.startsWith('-') && !options.input) {
      options.input = arg;
    }
  }

  if (!options.height) {
    options.height = options.width;
  }

  return options;
}

function renderAsciiGrid(pattern) {
  const { cols, rows, cells } = pattern.grid;
  const colorMap = new Map();
  pattern.statistics.colors.forEach((c) => {
    colorMap.set(c.code, c.hex);
  });

  const lines = [];
  const border = '+' + '-'.repeat(cols * 2) + '+';
  lines.push(border);

  for (let y = 0; y < rows; y++) {
    let rowStr = '|';
    for (let x = 0; x < cols; x++) {
      const code = cells[y * cols + x];
      if (!code) {
        rowStr += '  ';
      } else {
        const hex = colorMap.get(code) || '#ffffff';
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        rowStr += `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
      }
    }
    rowStr += '|';
    lines.push(rowStr);
  }

  lines.push(border);
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.version) {
    console.log(`v${pkg.version}`);
    process.exit(0);
  }

  if (!options.input) {
    console.error('Error: Missing input image path.\n');
    printHelp();
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), options.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(inputPath);
  let imageData;
  try {
    imageData = decodePng(fileBuffer);
  } catch (err) {
    console.error(`Error: Failed to decode PNG file: ${err.message}`);
    process.exit(1);
  }

  let palette = options.palette;
  if (palette.endsWith('.json') || fs.existsSync(path.resolve(process.cwd(), palette))) {
    const palPath = path.resolve(process.cwd(), palette);
    const raw = JSON.parse(fs.readFileSync(palPath, 'utf8'));
    palette = createCustomPalette({
      id: raw.id || path.basename(palPath, '.json'),
      name: raw.name || path.basename(palPath, '.json'),
      colors: raw.colors,
    });
  }

  const pattern = await generateBeadPattern(imageData, {
    cols: options.width,
    rows: options.height,
    palette,
    processMode: options.mode,
    maxColors: options.maxColors,
    whiteMode: options.whiteMode,
    mergeStrength: options.mergeStrength,
    protectDark: options.protectDark,
    title: path.basename(inputPath, path.extname(inputPath)),
  });

  if (options.output) {
    const outPath = path.resolve(process.cwd(), options.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, serializePattern(pattern, 2), 'utf8');
    console.log(`Saved pattern to: ${outPath}`);
  }

  if (options.format === 'json') {
    if (!options.output) {
      console.log(serializePattern(pattern, 2));
    }
    return;
  }

  if (options.format === 'ascii') {
    console.log('\nPattern Preview:');
    console.log(renderAsciiGrid(pattern));
  }

  console.log('\n--- Pattern Summary ---');
  console.log(`Title:       ${pattern.title}`);
  console.log(`Dimensions:  ${pattern.grid.cols} x ${pattern.grid.rows}`);
  console.log(`Total Beads: ${pattern.statistics.totalBeads} beads`);
  console.log(`Empty Cells: ${pattern.statistics.emptyCells}`);
  console.log(`Used Colors: ${pattern.statistics.usedColors}`);
  console.log(`Fill Rate:   ${Math.round(pattern.statistics.density * 100)}%`);

  console.log('\nTop Material Usage:');
  const topColors = pattern.statistics.colors.slice(0, 15);
  for (const c of topColors) {
    const r = parseInt(c.hex.slice(1, 3), 16) || 0;
    const g = parseInt(c.hex.slice(3, 5), 16) || 0;
    const b = parseInt(c.hex.slice(5, 7), 16) || 0;
    const swatch = `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
    const sharePct = (c.share * 100).toFixed(1).padStart(5);
    console.log(`  ${swatch} ${c.code.padEnd(6)} ${c.name.padEnd(20)} ${String(c.count).padStart(5)} beads (${sharePct}%)`);
  }

  if (pattern.statistics.colors.length > 15) {
    console.log(`  ... and ${pattern.statistics.colors.length - 15} more colors.`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
