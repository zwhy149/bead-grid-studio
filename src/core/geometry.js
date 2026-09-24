/**
 * Pure grid geometry bridge for the web application.
 * Delegates to the standalone @bead-grid/core geometry engine.
 */

import {
  clamp as coreClamp,
  cropSourceRect as coreCropSourceRect,
  fitGeometryMetrics as coreFitGeometryMetrics,
  fitPatternInsideBoard as coreFitPatternInsideBoard,
  gridForLongSide as coreGridForLongSide,
  gridFromAspectAnchor as coreGridFromAspectAnchor,
  normalizeCrop as coreNormalizeCrop,
  orientedSourceDimensions as coreOrientedSourceDimensions,
} from '../../packages/core/src/geometry.js';

export function clamp(value, min, max) {
  return coreClamp(value, min, max);
}

export function normalizeCrop(crop) {
  return coreNormalizeCrop(crop);
}

export function cropSourceRect(width, height, crop) {
  return coreCropSourceRect(width, height, crop);
}

export function gridForLongSide(width, height, longSide, minSide = 4, maxSide = 160) {
  return coreGridForLongSide(width, height, longSide, minSide, maxSide);
}

export function gridFromAspectAnchor(width, height, value, axis = 'cols', minSide = 4, maxSide = 160) {
  return coreGridFromAspectAnchor(width, height, value, axis, minSide, maxSide);
}

export function orientedSourceDimensions(raw, decoded) {
  return coreOrientedSourceDimensions(raw, decoded);
}

export function fitGeometryMetrics(sourceWidth, sourceHeight, cols, rows, fitMode = 'contain') {
  return coreFitGeometryMetrics(sourceWidth, sourceHeight, cols, rows, fitMode);
}

export function fitPatternInsideBoard(sourceWidth, sourceHeight, boardCols, boardRows) {
  return coreFitPatternInsideBoard(sourceWidth, sourceHeight, boardCols, boardRows);
}

export const STANDARD_PEGBOARD_PRESETS = Object.freeze([
  { id: 'small-16', label: '16x16 Small Square', cols: 16, rows: 16, beadSizeMm: 5.0 },
  { id: 'standard-28', label: '28x28 Mini Square (2.6mm)', cols: 28, rows: 28, beadSizeMm: 2.6 },
  { id: 'medium-29', label: '29x29 Standard Square', cols: 29, rows: 29, beadSizeMm: 5.0 },
  { id: 'interlocking-58', label: '58x58 2x2 Large Assembly', cols: 58, rows: 58, beadSizeMm: 5.0 },
]);

export function findPegboardPreset(id) {
  return STANDARD_PEGBOARD_PRESETS.find(p => p.id === id) || null;
}
