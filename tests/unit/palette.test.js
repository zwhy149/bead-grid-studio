import assert from 'node:assert/strict';
import test from 'node:test';
import { LEGACY_64_HEX, MARD_PALETTE_SOURCE, PALETTE } from '../../src/palettes/mard221.js';

test('base catalog has the exact nine-series 221-code shape', () => {
  const counts = Object.fromEntries('ABCDEFGHM'.split('').map((series) => [
    series,
    PALETTE.filter((color) => color.series === series).length,
  ]));
  assert.deepEqual(counts, { A: 26, B: 32, C: 29, D: 26, E: 24, F: 25, G: 21, H: 23, M: 15 });
  assert.equal(PALETTE.length, 221);
  assert.equal(new Set(PALETTE.map((color) => color.code)).size, 221);
});

test('transparent, white, and black anchors are explicit', () => {
  assert.equal(PALETTE.find((color) => color.code === 'H1').isTransparent, true);
  assert.equal(PALETTE.find((color) => color.code === 'H2').displayHex, '#FFFFFF');
  assert.equal(PALETTE.find((color) => color.code === 'H7').hex, '#000000');
});

test('catalog source and legacy migration data remain pinned', () => {
  assert.equal(MARD_PALETTE_SOURCE, 'maxcleme/beadcolors@94b99999652866f1a1879d6369fe735f811949e5');
  assert.equal(LEGACY_64_HEX.size, 64);
});
