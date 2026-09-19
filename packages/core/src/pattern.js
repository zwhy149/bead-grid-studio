import { fitGeometryMetrics } from './geometry.js';
import { getPaletteProvider, LEGACY_TO_MARD } from './palette.js';

export function embedPatternGrid(compact, patternCols, patternRows, boardCols, boardRows, offsetX, offsetY) {
  const board = new Int16Array(boardCols * boardRows).fill(-1);
  for (let y = 0; y < patternRows; y++) {
    for (let x = 0; x < patternCols; x++) {
      const bx = offsetX + x;
      const by = offsetY + y;
      if (bx >= 0 && by >= 0 && bx < boardCols && by < boardRows) {
        board[by * boardCols + bx] = compact[y * patternCols + x];
      }
    }
  }
  return board;
}

export function occupiedBounds(grid, cols, rows) {
  let minX = cols;
  let minY = rows;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y * cols + x] >= 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return { minX: 0, minY: 0, maxX: cols - 1, maxY: rows - 1, cols, rows, empty: true };
  return { minX, minY, maxX, maxY, cols: maxX - minX + 1, rows: maxY - minY + 1, empty: false };
}

export function assessPatternQuality({ width, height, cols, rows, fitMode = 'contain', analysis = null }) {
  const fit = fitGeometryMetrics(width, height, cols, rows, fitMode);
  const effectiveLong = Math.max(fit.contentCols, fit.contentRows);
  const effectiveCells = fit.contentCols * fit.contentRows;
  const isDocument = Boolean(analysis?.likelyDocument);
  const isPhoto = Boolean(analysis?.likelyPhoto);
  const isLineArt = Boolean(analysis?.likelyLineArt);
  const targetLong = Math.max(cols, rows);
  const lowDetail = isDocument ? effectiveLong < 100 : isPhoto ? effectiveLong < 64 : isLineArt ? targetLong <= 16 : effectiveLong < 32;
  const severeDetail = isDocument ? effectiveLong < 64 : isPhoto ? effectiveLong < 40 : isLineArt ? targetLong < 16 : effectiveLong < 20;
  const aspectWarning = fit.mismatch > 0.05;
  return {
    fit,
    effectiveLong,
    effectiveCells,
    isDocument,
    isPhoto,
    isLineArt,
    lowDetail,
    severeDetail,
    aspectWarning,
    hasWarning: lowDetail || aspectWarning,
  };
}

/**
 * Computes material usage, color counts, and distribution statistics for a pattern.
 */
export function analyzePattern(cells, palette = getPaletteProvider().colors) {
  const counts = new Map();
  const beadCounts = {};
  let totalBeads = 0;
  let emptyCells = 0;

  for (let i = 0; i < cells.length; i++) {
    const val = cells[i];
    if (val === -1 || val === null || val === undefined) {
      emptyCells++;
      continue;
    }

    const color = typeof val === 'number' ? palette[val] : palette.find((c) => c.code === val);
    if (!color) {
      emptyCells++;
      continue;
    }

    totalBeads++;
    counts.set(color.code, (counts.get(color.code) || 0) + 1);
  }

  const colors = [];
  for (const [code, count] of counts.entries()) {
    beadCounts[code] = count;
    const color = palette.find((c) => c.code === code);
    colors.push({
      code,
      name: color?.name || code,
      hex: color?.hex || '#000000',
      count,
      share: totalBeads > 0 ? count / totalBeads : 0,
    });
  }

  colors.sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return {
    totalBeads,
    emptyCells,
    usedColors: colors.length,
    density: cells.length > 0 ? totalBeads / cells.length : 0,
    colors,
    beadCounts,
  };
}

/**
 * Creates a structured pattern exchange model conforming to schema/pattern.schema.json.
 */
export function createPattern({
  width,
  height,
  cells,
  palette = getPaletteProvider(),
  title = 'Untitled Pattern',
  metadata = {},
}) {
  const paletteObj = typeof palette === 'string' ? getPaletteProvider(palette) : palette;
  const colorList = paletteObj.colors || paletteObj;
  const colorCodes = new Array(width * height);
  const rawIndices = new Int16Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const val = cells[i];
    if (val === -1 || val === null || val === undefined) {
      colorCodes[i] = null;
      rawIndices[i] = -1;
    } else if (typeof val === 'number') {
      rawIndices[i] = val;
      colorCodes[i] = val >= 0 && colorList[val] ? colorList[val].code : null;
    } else {
      colorCodes[i] = String(val);
      const idx = colorList.findIndex((c) => c.code === val);
      rawIndices[i] = idx >= 0 ? idx : -1;
    }
  }

  const stats = analyzePattern(colorCodes, colorList);

  return {
    schemaVersion: 1,
    type: 'bead-grid-studio',
    version: 2,
    appVersion: '1.2.0',
    title,
    createdAt: new Date().toISOString(),
    grid: {
      cols: width,
      rows: height,
      cells: colorCodes,
    },
    palette: {
      id: paletteObj.id || 'mard-compatible-base-221',
      name: paletteObj.name || paletteObj.id || 'MARD-Compatible Base 221',
      source: paletteObj.source || 'maxcleme/beadcolors',
    },
    statistics: {
      totalBeads: stats.totalBeads,
      emptyCells: stats.emptyCells,
      usedColors: stats.usedColors,
      density: stats.density,
      beadCounts: stats.beadCounts,
      colors: stats.colors,
    },
    rawIndices,
    metadata,
  };
}

/**
 * Serializes a pattern to JSON string conforming to the open pattern exchange format.
 */
export function serializePattern(pattern, space = 2) {
  return JSON.stringify(pattern, null, space);
}

/**
 * Parses and validates an open pattern exchange format JSON or object.
 * Transparently supports migration from version 1 universal-screen-64 to mard221.
 */
export function parsePattern(input, options = {}) {
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Pattern must be a valid object or JSON string');
  }

  if (raw.type && raw.type !== 'bead-grid-studio') {
    throw new Error(`Unsupported pattern type: ${raw.type}`);
  }

  const cols = raw.grid?.cols || raw.width;
  const rows = raw.grid?.rows || raw.height;
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 4 || cols > 160 || rows < 4 || rows > 160) {
    throw new Error(`Invalid pattern dimensions: ${cols}x${rows}`);
  }

  const cells = raw.grid?.cells || raw.cells;
  if (!Array.isArray(cells) || cells.length !== cols * rows) {
    throw new Error(`Cells array length (${cells?.length}) does not match grid dimensions (${cols}x${rows} = ${cols * rows})`);
  }

  const provider = getPaletteProvider(options.paletteId || raw.palette?.id || raw.palette || 'mard-compatible-base-221');
  const palette = provider.colors;
  const colorByCode = new Map(palette.map((color) => [color.code, color.index]));

  const legacy = raw.version === 1 && (raw.palette === 'universal-screen-64-v1' || raw.palette?.id === 'universal-screen-64-v1');
  const rawIndices = new Int16Array(cols * rows);
  const normalizedCodes = new Array(cols * rows);

  for (let i = 0; i < cells.length; i++) {
    const val = cells[i];
    if (val === null || val === -1 || val === undefined) {
      rawIndices[i] = -1;
      normalizedCodes[i] = null;
      continue;
    }
    const code = String(val);
    if (legacy) {
      if (!LEGACY_TO_MARD.has(code)) {
        throw new Error(`Unknown legacy color code at index ${i}: ${code}`);
      }
      const mappedIdx = LEGACY_TO_MARD.get(code);
      rawIndices[i] = mappedIdx;
      normalizedCodes[i] = palette[mappedIdx].code;
    } else {
      if (!colorByCode.has(code)) {
        if (options.lenient) {
          rawIndices[i] = -1;
          normalizedCodes[i] = null;
          continue;
        }
        throw new Error(`Unknown color code at index ${i}: ${code} for palette ${provider.id}`);
      }
      rawIndices[i] = colorByCode.get(code);
      normalizedCodes[i] = code;
    }
  }

  return createPattern({
    width: cols,
    height: rows,
    cells: normalizedCodes,
    palette: provider,
    title: raw.title || 'Imported Pattern',
    metadata: {
      ...raw.metadata,
      migratedFromLegacy: legacy,
      importedAt: new Date().toISOString(),
    },
  });
}

/**
 * Validates whether an object conforms to schema/pattern.schema.json.
 * @param {any} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePattern(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Pattern must be an object'] };
  }

  const cols = input.grid?.cols ?? input.width;
  const rows = input.grid?.rows ?? input.height;
  if (!Number.isInteger(cols) || cols < 4 || cols > 160) {
    errors.push(`Invalid cols: ${cols}. Must be integer between 4 and 160.`);
  }
  if (!Number.isInteger(rows) || rows < 4 || rows > 160) {
    errors.push(`Invalid rows: ${rows}. Must be integer between 4 and 160.`);
  }

  const cells = input.grid?.cells ?? input.cells;
  if (!Array.isArray(cells)) {
    errors.push('cells must be an array.');
  } else if (cols && rows && cells.length !== cols * rows) {
    errors.push(`cells length ${cells.length} does not match ${cols}x${rows} (${cols * rows}).`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const deserializePattern = parsePattern;
