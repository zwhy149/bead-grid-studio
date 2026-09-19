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
