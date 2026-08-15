import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fitGeometryMetrics,
  fitPatternInsideBoard,
  gridForLongSide,
  gridFromAspectAnchor,
  orientedSourceDimensions,
} from '../../src/core/geometry.js';

test('long-side presets preserve a landscape image ratio', () => {
  assert.deepEqual(gridForLongSide(5560, 3992, 24), { cols: 24, rows: 17, ratioLimited: false });
  assert.deepEqual(gridForLongSide(5560, 3992, 60), { cols: 60, rows: 43, ratioLimited: false });
});

test('portrait and EXIF-oriented sources preserve orientation', () => {
  assert.deepEqual(gridForLongSide(1000, 1400, 24), { cols: 17, rows: 24, ratioLimited: false });
  assert.deepEqual(orientedSourceDimensions(
    { width: 4032, height: 3024 },
    { width: 3024, height: 4032 },
  ), { width: 3024, height: 4032, orientationSwapped: true });
});

test('extreme aspect ratios report the minimum-side limitation', () => {
  assert.deepEqual(gridForLongSide(4000, 100, 24), { cols: 24, rows: 4, ratioLimited: true });
  assert.deepEqual(gridFromAspectAnchor(4000, 100, 24, 'cols'), {
    cols: 24,
    rows: 4,
    ratioLimited: true,
  });
});

test('a compact pattern is centered inside a real board without stretching', () => {
  assert.deepEqual(fitPatternInsideBoard(5560, 3992, 52, 52), {
    cols: 52,
    rows: 37,
    offsetX: 0,
    offsetY: 7,
    blankLeft: 0,
    blankRight: 0,
    blankTop: 7,
    blankBottom: 8,
    aspectError: fitPatternInsideBoard(5560, 3992, 52, 52).aspectError,
  });
  assert.ok(fitPatternInsideBoard(5560, 3992, 52, 52).aspectError < 0.02);
});

test('contain and cover expose empty-space or crop cost explicitly', () => {
  const contain = fitGeometryMetrics(1400, 1000, 24, 24, 'contain');
  const cover = fitGeometryMetrics(1400, 1000, 24, 24, 'cover');
  assert.equal(contain.cropFraction, 0);
  assert.ok(contain.letterboxFraction > 0.28 && contain.letterboxFraction < 0.29);
  assert.equal(cover.letterboxFraction, 0);
  assert.ok(cover.cropFraction > 0.28 && cover.cropFraction < 0.29);
});
