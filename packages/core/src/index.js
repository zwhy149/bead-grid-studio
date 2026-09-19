import {
  clamp,
  cropSourceRect,
  fitGeometryMetrics,
  fitPatternInsideBoard,
  gridForLongSide,
  gridFromAspectAnchor,
  normalizeCrop,
  orientedSourceDimensions,
} from './geometry.js';

import {
  clamp01,
  deltaE2000,
  hexToRgb,
  labDistance,
  linearSrgb,
  preparePaletteColor,
  rgbToCielab,
  rgbToHex,
  rgbToOklab,
  srgbLinear,
  visiblyChromaticRgb,
} from './color.js';

import {
  DEFAULT_PALETTE_PROVIDER_ID,
  LEGACY_64_DATA,
  LEGACY_64_HEX,
  LEGACY_TO_MARD,
  MARD_221_DATA,
  MARD_PALETTE_SOURCE,
  MARD_SERIES,
  PALETTE,
  PALETTE_PROVIDERS,
  createCustomPalette,
  getPaletteProvider,
  registerPaletteProvider,
} from './palette.js';

import {
  analyzeLineArtSubject,
  analyzeSourceComplexity,
  recommendAutoHdSettings,
  recommendDocumentGrid,
} from './analysis.js';

import { quantizePixels } from './quantize.js';

import {
  analyzePattern,
  assessPatternQuality,
  createPattern,
  embedPatternGrid,
  occupiedBounds,
  parsePattern,
  serializePattern,
} from './pattern.js';

/**
 * End-to-end image to bead pattern generator pipeline.
 *
 * @param {{ data: Uint8Array | Uint8ClampedArray | number[], width: number, height: number }} imageData
 * @param {object} [options]
 * @param {number} [options.cols] - Target grid columns (default: 48)
 * @param {number} [options.rows] - Target grid rows (default: 48)
 * @param {number} [options.width] - Alias for cols
 * @param {number} [options.height] - Alias for rows
 * @param {string | object} [options.palette='mard-compatible-base-221'] - Palette provider id or instance
 * @param {number} [options.maxColors=32] - Max material colors
 * @param {'auto' | 'keep'} [options.whiteMode='auto'] - White background handling
 * @param {'cartoon' | 'detail' | 'document' | 'photo' | 'pixel'} [options.processMode='cartoon'] - Mode
 * @param {number} [options.mergeStrength=10] - Merge similarity strength
 * @param {boolean} [options.protectDark=true] - Protect neutral dark lines
 * @param {string} [options.title='Generated Pattern'] - Pattern title
 * @returns {Promise<ReturnType<typeof createPattern>>}
 */
export async function generateBeadPattern(imageData, options = {}) {
  if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
    throw new Error('generateBeadPattern requires an imageData object with { data, width, height }');
  }

  const cols = options.cols || options.width || 48;
  const rows = options.rows || options.height || 48;
  const paletteArg = options.palette || DEFAULT_PALETTE_PROVIDER_ID;
  const provider = typeof paletteArg === 'string' ? getPaletteProvider(paletteArg) : paletteArg;
  const allowedColors = provider.colors.filter((c) => !c.isTransparent);

  const result = quantizePixels({
    data: imageData.data,
    width: imageData.width,
    height: imageData.height,
    cols,
    rows,
    palette: allowedColors,
    maxColors: options.maxColors ?? 32,
    whiteMode: options.whiteMode ?? 'auto',
    processMode: options.processMode ?? 'cartoon',
    mergeStrength: options.mergeStrength ?? 10,
    protectDark: options.protectDark ?? true,
  });

  return createPattern({
    width: cols,
    height: rows,
    cells: result.cells,
    palette: provider,
    title: options.title || 'Generated Pattern',
    metadata: {
      processMode: options.processMode ?? 'cartoon',
      maxColors: options.maxColors ?? 32,
      whiteMode: options.whiteMode ?? 'auto',
      mergeStrength: options.mergeStrength ?? 10,
      protectDark: options.protectDark ?? true,
      diagnostics: result.diagnostics,
      nonEmpty: result.nonEmpty,
    },
  });
}

// Re-exports
export {
  // Geometry
  clamp,
  normalizeCrop,
  cropSourceRect,
  gridForLongSide,
  gridFromAspectAnchor,
  orientedSourceDimensions,
  fitGeometryMetrics,
  fitPatternInsideBoard,

  // Color
  clamp01,
  srgbLinear,
  linearSrgb,
  hexToRgb,
  rgbToHex,
  rgbToOklab,
  labDistance,
  rgbToCielab,
  deltaE2000,
  visiblyChromaticRgb,
  preparePaletteColor,

  // Palette
  MARD_PALETTE_SOURCE,
  MARD_SERIES,
  MARD_221_DATA,
  PALETTE,
  LEGACY_64_DATA,
  LEGACY_64_HEX,
  LEGACY_TO_MARD,
  DEFAULT_PALETTE_PROVIDER_ID,
  PALETTE_PROVIDERS,
  getPaletteProvider,
  registerPaletteProvider,
  createCustomPalette,

  // Analysis
  analyzeLineArtSubject,
  analyzeSourceComplexity,
  recommendDocumentGrid,
  recommendAutoHdSettings,

  // Quantize
  quantizePixels,

  // Pattern
  embedPatternGrid,
  occupiedBounds,
  assessPatternQuality,
  analyzePattern,
  createPattern,
  serializePattern,
  parsePattern,
};
