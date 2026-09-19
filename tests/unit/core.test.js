import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  analyzeLineArtSubject,
  analyzePattern,
  analyzeSourceComplexity,
  assessPatternQuality,
  createCustomPalette,
  createPattern,
  deltaE2000,
  deserializePattern,
  fitPatternInsideBoard,
  generateBeadPattern,
  getPaletteProvider,
  gridForLongSide,
  hexToRgb,
  parsePattern,
  quantizePixels,
  recommendAutoHdSettings,
  recommendDocumentGrid,
  rgbToCielab,
  rgbToHex,
  rgbToOklab,
  serializePattern,
  validatePattern,
} from '../../packages/core/src/index.js';
import { decodePng } from '../helpers/png.js';

test('color math: hex, rgb, OKLab, and CIEDE2000 distances are accurate and bounded', () => {
  assert.deepEqual(hexToRgb('#FEAC4C'), [254, 172, 76]);
  assert.equal(rgbToHex(254, 172, 76), '#FEAC4C');

  const blackOklab = rgbToOklab([0, 0, 0]);
  const whiteOklab = rgbToOklab([255, 255, 255]);
  assert.ok(blackOklab[0] < 0.01, 'Black L value in OKLab is near 0');
  assert.ok(whiteOklab[0] > 0.99, 'White L value in OKLab is near 1');

  const c1 = rgbToCielab([255, 0, 0]);
  const c2 = rgbToCielab([255, 0, 0]);
  assert.equal(deltaE2000(c1, c2), 0, 'Identical colors have zero deltaE');

  const cDifferent = rgbToCielab([0, 255, 0]);
  assert.ok(deltaE2000(c1, cDifferent) > 50, 'Red vs Green deltaE is large');
});

test('palette: custom palette registration and validation', () => {
  const custom = createCustomPalette({
    id: 'test-palette-mini',
    name: 'Test Mini Palette',
    colors: [
      { code: 'T1', hex: '#FFFFFF', name: 'White' },
      { code: 'T2', hex: '#000000', name: 'Black' },
      { code: 'T3', hex: '#FF0000', name: 'Red' },
      { code: 'T4', hex: '#00FF00', name: 'Green' },
      { code: 'T5', hex: '#0000FF', name: 'Blue' },
    ],
    anchors: { white: 'T1', black: 'T2' },
  });

  assert.equal(custom.colors.length, 5);
  assert.equal(custom.anchors.white, 'T1');
  assert.equal(custom.anchors.black, 'T2');
  assert.ok(custom.colors[0].rgb, 'Color has computed RGB');
  assert.ok(custom.colors[0].lab, 'Color has computed OKLab');
  assert.ok(custom.colors[0].cieLab, 'Color has computed CIELAB');
});

test('quantize: deterministic output on identical inputs', () => {
  // Create a 16x16 gradient test image
  const width = 16;
  const height = 16;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = Math.round((x / width) * 255);
      data[idx + 1] = Math.round((y / height) * 255);
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  const payload = {
    data,
    width,
    height,
    cols: 8,
    rows: 8,
    maxColors: 16,
    processMode: 'cartoon',
  };

  const run1 = quantizePixels(payload);
  const run2 = quantizePixels(payload);

  assert.equal(run1.cells.length, 64);
  assert.deepEqual(Array.from(run1.cells), Array.from(run2.cells), 'Runs must produce identical cell arrays');
  assert.deepEqual(run1.selected, run2.selected, 'Runs must produce identical selected color palettes');
  assert.equal(run1.nonEmpty, run2.nonEmpty);
});

test('quantize: fixture rocket-badge.png produces valid pattern with expected properties', () => {
  const fixturePath = path.resolve('tests/fixtures/rocket-badge.png');
  const buffer = fs.readFileSync(fixturePath);
  const { data, width, height } = decodePng(buffer);

  assert.equal(width, 1024);
  assert.equal(height, 1024);

  const result = quantizePixels({
    data,
    width,
    height,
    cols: 24,
    rows: 24,
    maxColors: 16,
    processMode: 'cartoon',
    whiteMode: 'auto',
  });

  assert.equal(result.cells.length, 576);
  assert.ok(result.nonEmpty > 50, 'Rocket badge has significant bead coverage');
  assert.ok(result.selected.length <= 16, 'Color count does not exceed maxColors limit');
  assert.ok(result.diagnostics.backgroundPixels > 0, 'Auto whiteMode removed connected white background');
});

test('high-level generateBeadPattern API returns structured pattern model', async () => {
  const fixturePath = path.resolve('tests/fixtures/rocket-badge.png');
  const buffer = fs.readFileSync(fixturePath);
  const imageData = decodePng(buffer);

  const pattern = await generateBeadPattern(imageData, {
    cols: 32,
    rows: 32,
    maxColors: 20,
    title: 'Rocket Badge 32x32',
  });

  assert.equal(pattern.schemaVersion, 1);
  assert.equal(pattern.type, 'bead-grid-studio');
  assert.equal(pattern.grid.cols, 32);
  assert.equal(pattern.grid.rows, 32);
  assert.equal(pattern.grid.cells.length, 1024);
  assert.ok(pattern.statistics.totalBeads > 0);
  assert.ok(pattern.statistics.usedColors <= 20);
  assert.equal(pattern.title, 'Rocket Badge 32x32');
  assert.ok(pattern.statistics.colors.length > 0);
  assert.ok(pattern.statistics.colors[0].count >= pattern.statistics.colors[1]?.count || 0);

  // Test serialization & round-trip parsing
  const json = serializePattern(pattern);
  assert.ok(typeof json === 'string');
  const restored = parsePattern(json);
  assert.equal(restored.grid.cols, 32);
  assert.equal(restored.grid.rows, 32);
  assert.equal(restored.statistics.totalBeads, pattern.statistics.totalBeads);
  assert.deepEqual(restored.grid.cells, pattern.grid.cells);
});

test('pattern: legacy version 1 migration maps correctly to MARD-compatible colors', () => {
  const legacyPattern = {
    type: 'bead-grid-studio',
    version: 1,
    palette: 'universal-screen-64-v1',
    grid: {
      cols: 4,
      rows: 4,
      cells: [
        'N01', 'N01', 'P01', 'P01',
        'N11', 'N11', 'P07', 'P07',
        null, null, 'N01', 'N01',
        null, null, null, null,
      ],
    },
  };

  const migrated = parsePattern(legacyPattern);
  assert.equal(migrated.grid.cols, 4);
  assert.equal(migrated.grid.rows, 4);
  assert.equal(migrated.metadata.migratedFromLegacy, true);
  assert.equal(migrated.statistics.emptyCells, 6);
  assert.equal(migrated.statistics.totalBeads, 10);
  // N01 should map to H2 (white)
  assert.equal(migrated.grid.cells[0], 'H2');
});

test('quantize handles edge case inputs gracefully without throwing', () => {
  const empty = quantizePixels({
    data: null,
    width: 0,
    height: 0,
    cols: 10,
    rows: 10,
  });
  assert.equal(empty.nonEmpty, 0);
  assert.equal(empty.cells.length, 100);

  const transparent = quantizePixels({
    data: new Uint8ClampedArray(4 * 4 * 4).fill(0), // all alpha 0
    width: 4,
    height: 4,
    cols: 4,
    rows: 4,
  });
  assert.equal(transparent.nonEmpty, 0);
});

test('pattern validation: validatePattern accurately validates conformant and non-conformant patterns', () => {
  const validPattern = {
    grid: {
      cols: 10,
      rows: 10,
      cells: new Array(100).fill(null),
    },
  };
  const validResult = validatePattern(validPattern);
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);

  const invalidPattern = {
    grid: {
      cols: 10,
      rows: 10,
      cells: new Array(50).fill(null), // Mismatched cell count
    },
  };
  const invalidResult = validatePattern(invalidPattern);
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.length > 0);

  // Test deserializePattern alias works identically to parsePattern
  const parsed = deserializePattern(validPattern);
  assert.equal(parsed.grid.cols, 10);
  assert.equal(parsed.grid.rows, 10);
});
