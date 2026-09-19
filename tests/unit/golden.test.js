import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../../src/adapters/png.js';
import { generateBeadPattern } from '../../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '../fixtures');

const GOLDEN_BASELINES = [
  {
    file: 'small-icon.png',
    cols: 16,
    rows: 16,
    mode: 'pixel',
    expectedBeads: 256,
    expectedColors: 2,
    expectedHash: 'fcc16435167e962b',
    expectedTopColor: 'C10',
  },
  {
    file: 'high-saturation.png',
    cols: 24,
    rows: 24,
    mode: 'cartoon',
    expectedBeads: 576,
    expectedColors: 4,
    expectedHash: 'c7adfa93568f8c16',
    expectedTopColor: 'B1',
  },
  {
    file: 'low-color-mono.png',
    cols: 20,
    rows: 20,
    mode: 'cartoon',
    expectedBeads: 400,
    expectedColors: 3,
    expectedHash: '979c2826cfb349a0',
    expectedTopColor: 'H7',
  },
  {
    file: 'transparent-badge.png',
    cols: 24,
    rows: 24,
    mode: 'cartoon',
    expectedBeads: 275,
    expectedColors: 1,
    expectedHash: 'ecd20b174be29c70',
    expectedTopColor: 'A14',
  },
  {
    file: 'extreme-aspect.png',
    cols: 32,
    rows: 8,
    mode: 'cartoon',
    expectedBeads: 256,
    expectedColors: 3,
    expectedHash: '5b93de5747aaed67',
    expectedTopColor: 'D6',
  },
  {
    file: 'monochrome-solid.png',
    cols: 16,
    rows: 16,
    mode: 'cartoon',
    expectedBeads: 256,
    expectedColors: 1,
    expectedHash: 'e32acf98f92b8763',
    expectedTopColor: 'D3',
  },
  {
    file: 'gradient-smooth.png',
    cols: 24,
    rows: 24,
    mode: 'photo',
    expectedBeads: 576,
    expectedColors: 32,
    expectedHash: 'c52ad477f933c851',
    expectedTopColor: 'B6',
  },
  {
    file: 'high-contrast-edge.png',
    cols: 20,
    rows: 20,
    mode: 'cartoon',
    expectedBeads: 400,
    expectedColors: 2,
    expectedHash: '7a542d8c215d5058',
    expectedTopColor: 'H7',
  },
  {
    file: 'rocket-badge.png',
    cols: 29,
    rows: 29,
    mode: 'cartoon',
    expectedBeads: 383,
    expectedColors: 9,
    expectedHash: '0440354d44da9ef7',
    expectedTopColor: 'H2',
  },
];

for (const golden of GOLDEN_BASELINES) {
  test(`golden fixture: ${golden.file} matches exact checksum and bead metrics`, async () => {
    const fixturePath = path.join(fixturesDir, golden.file);
    assert.ok(fs.existsSync(fixturePath), `Fixture file exists: ${golden.file}`);

    const buffer = fs.readFileSync(fixturePath);
    const imageData = decodePng(buffer);

    // Run conversion
    const pattern = await generateBeadPattern(imageData, {
      cols: golden.cols,
      rows: golden.rows,
      processMode: golden.mode,
      palette: 'mard-compatible-base-221',
    });

    assert.equal(pattern.grid.cols, golden.cols, 'Grid cols match');
    assert.equal(pattern.grid.rows, golden.rows, 'Grid rows match');
    assert.equal(pattern.statistics.totalBeads, golden.expectedBeads, 'Total beads match golden baseline');
    assert.equal(pattern.statistics.usedColors, golden.expectedColors, 'Colors count match golden baseline');
    assert.equal(pattern.statistics.colors[0].code, golden.expectedTopColor, 'Top color code matches');

    const hash = crypto.createHash('sha256').update(JSON.stringify(pattern.grid.cells)).digest('hex').slice(0, 16);
    assert.equal(hash, golden.expectedHash, 'SHA-256 cells checksum matches golden baseline');
  });

  test(`determinism: ${golden.file} produces bitwise identical output over 3 consecutive runs`, async () => {
    const fixturePath = path.join(fixturesDir, golden.file);
    const buffer = fs.readFileSync(fixturePath);
    const imageData = decodePng(buffer);

    let previousHash = null;
    let previousCells = null;

    for (let run = 1; run <= 3; run++) {
      const pattern = await generateBeadPattern(imageData, {
        cols: golden.cols,
        rows: golden.rows,
        processMode: golden.mode,
        palette: 'mard-compatible-base-221',
      });

      const currentHash = crypto.createHash('sha256').update(JSON.stringify(pattern.grid.cells)).digest('hex');
      if (previousHash !== null) {
        assert.equal(currentHash, previousHash, `Run ${run} checksum must equal previous run`);
        assert.deepEqual(pattern.grid.cells, previousCells, `Run ${run} cells must be bitwise identical`);
      }
      previousHash = currentHash;
      previousCells = pattern.grid.cells;
    }
  });
}
