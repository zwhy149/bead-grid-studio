import { deltaE2000, hexToRgb, rgbToCielab } from './color.js';
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
 * Creates a structured pattern exchange model conforming to schemas/pattern.schema.json.
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
    appVersion: '1.5.0',
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
 * Validates whether an object conforms to schemas/pattern.schema.json.
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

/**
 * Removes isolated stray beads by replacing them with the dominant neighboring color.
 * Significantly reduces single-bead clutter and purchasing burden for crafters.
 * @param {ArrayLike<number>} grid Array of palette color indices (-1 for empty)
 * @param {number} cols Grid columns
 * @param {number} rows Grid rows
 * @param {{ minNeighbors?: number, iterations?: number }} [options]
 * @returns {{ cells: Int16Array, changedCount: number }}
 */
export function despeckleGrid(grid, cols, rows, { minNeighbors = 1, iterations = 1 } = {}) {
  let current = new Int16Array(grid);
  let totalChanged = 0;

  for (let it = 0; it < iterations; it++) {
    const next = new Int16Array(current);
    let passChanged = 0;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        const color = current[idx];
        if (color < 0) continue;

        let sameColorNeighbors = 0;
        const neighborCounts = new Map();

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
              const nColor = current[ny * cols + nx];
              if (nColor >= 0) {
                if (nColor === color) {
                  sameColorNeighbors++;
                } else {
                  neighborCounts.set(nColor, (neighborCounts.get(nColor) || 0) + 1);
                }
              }
            }
          }
        }

        if (sameColorNeighbors < minNeighbors && neighborCounts.size > 0) {
          let bestNeighbor = -1;
          let maxCount = -1;
          for (const [nColor, count] of neighborCounts.entries()) {
            if (count > maxCount) {
              maxCount = count;
              bestNeighbor = nColor;
            }
          }

          if (bestNeighbor >= 0 && bestNeighbor !== color) {
            next[idx] = bestNeighbor;
            passChanged++;
          }
        }
      }
    }

    current = next;
    totalChanged += passChanged;
    if (passChanged === 0) break;
  }

  return { cells: current, changedCount: totalChanged };
}

/**
 * Replaces all occurrences of a specific color index with another in the pattern grid.
 * @param {ArrayLike<number>} grid
 * @param {number} sourceColor
 * @param {number} targetColor
 * @returns {{ cells: Int16Array, replacedCount: number }}
 */
export function replaceGridColor(grid, sourceColor, targetColor) {
  const cells = new Int16Array(grid);
  let replacedCount = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === sourceColor) {
      cells[i] = targetColor;
      replacedCount++;
    }
  }
  return { cells, replacedCount };
}

function resolveColorLab(color) {
  if (color.cieLab) return color.cieLab;
  const rgb = color.rgb || hexToRgb(color.hex);
  return rgbToCielab(rgb);
}

/**
 * Matches a CSS HEX color or palette code to the closest palette color using CIEDE2000.
 * @param {string} token Hex string (#RRGGBB) or palette code
 * @param {readonly object[]} [palette]
 * @param {{ includeTransparent?: boolean }} [options]
 * @returns {{ color: object, deltaE: number } | null}
 */
export function findNearestPaletteColor(token, palette = getPaletteProvider().colors, { includeTransparent = false } = {}) {
  const raw = String(token || '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const exact = palette.find((c) => c.code.toUpperCase() === upper);
  if (exact && (includeTransparent || !exact.isTransparent)) {
    return { color: exact, deltaE: 0 };
  }

  const hexMatch = /^#?[0-9A-F]{6}$/.test(upper);
  if (!hexMatch) return null;
  const hex = upper.startsWith('#') ? upper : `#${upper}`;
  const targetLab = rgbToCielab(hexToRgb(hex));

  let bestColor = null;
  let bestDistance = Infinity;
  for (const color of palette) {
    if (!includeTransparent && color.isTransparent) continue;
    const dE = deltaE2000(targetLab, resolveColorLab(color));
    if (dE < bestDistance) {
      bestDistance = dE;
      bestColor = color;
    }
  }
  return bestColor ? { color: bestColor, deltaE: Math.round(bestDistance * 100) / 100 } : null;
}

/**
 * Converts a character matrix or 2D array of tokens into a validated schema-compliant PatternModel.
 * Ideal for AI pixel-art generation, programmatic patterns, and ASCII templates.
 * @param {{
 *   matrix: string[] | (string | null)[][],
 *   colorMap?: Record<string, string>,
 *   palette?: any,
 *   title?: string,
 *   metadata?: Record<string, any>
 * }} config
 */
export function createPatternFromMatrix({
  matrix,
  colorMap = {},
  palette = getPaletteProvider(),
  title = 'Matrix Pattern',
  metadata = {},
}) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error('matrix must be a non-empty array of row strings or arrays');
  }
  const paletteObj = typeof palette === 'string' ? getPaletteProvider(palette) : palette;
  const colorList = paletteObj.colors || paletteObj;
  const normalizedRows = matrix.map((row) => (typeof row === 'string' ? [...row] : Array.isArray(row) ? row : []));
  const rawCols = Math.max(...normalizedRows.map((r) => r.length), 0);
  const cols = Math.max(4, Math.min(160, rawCols));
  const rows = Math.max(4, Math.min(160, normalizedRows.length));

  const tokenCache = new Map();
  const resolveToken = (rawToken) => {
    if (rawToken === null || rawToken === undefined) return -1;
    const key = String(rawToken);
    if (key === '' || key === '.' || key === ' ' || key === '_') return -1;
    if (tokenCache.has(key)) return tokenCache.get(key);

    const mapped = colorMap[key] ?? colorMap[key.toUpperCase()] ?? key;
    if (mapped === null || mapped === '' || mapped === '.' || mapped === ' ') {
      tokenCache.set(key, -1);
      return -1;
    }
    const matched = findNearestPaletteColor(mapped, colorList, { includeTransparent: true });
    const idx = matched ? matched.color.index ?? colorList.indexOf(matched.color) : -1;
    tokenCache.set(key, idx);
    return idx;
  };

  const cells = new Array(cols * rows).fill(-1);
  for (let y = 0; y < Math.min(rows, normalizedRows.length); y++) {
    const row = normalizedRows[y];
    for (let x = 0; x < Math.min(cols, row.length); x++) {
      cells[y * cols + x] = resolveToken(row[x]);
    }
  }

  return createPattern({ width: cols, height: rows, cells, palette: paletteObj, title, metadata });
}

/**
 * Identifies rare colors in a grid and computes perceptual CIEDE2000 merge targets
 * already present in the pattern so crafters can reduce jar count with minimal visual shift.
 */
export function suggestColorMerges(
  grid,
  palette = getPaletteProvider().colors,
  { maxBeadCount = 2, maxDeltaE = 18, protectAnchors = true } = {},
) {
  const counts = new Map();
  for (let i = 0; i < grid.length; i++) {
    const val = grid[i];
    if (typeof val === 'number') {
      if (val >= 0 && palette[val]) counts.set(val, (counts.get(val) || 0) + 1);
    } else if (typeof val === 'string') {
      const idx = palette.findIndex((c) => c.code === val);
      if (idx >= 0) counts.set(idx, (counts.get(idx) || 0) + 1);
    }
  }

  const activeIndices = [...counts.keys()];
  if (activeIndices.length <= 1) return [];

  const suggestions = [];
  for (const fromIndex of activeIndices) {
    const fromCount = counts.get(fromIndex) || 0;
    const fromColor = palette[fromIndex];
    if (!fromColor || fromColor.isTransparent || fromCount > maxBeadCount) continue;
    if (protectAnchors && (fromColor.code === 'H2' || fromColor.code === 'H7')) continue;

    const fromLab = resolveColorLab(fromColor);
    let bestTarget = null;
    let bestDeltaE = Infinity;

    for (const toIndex of activeIndices) {
      if (toIndex === fromIndex) continue;
      const toCount = counts.get(toIndex) || 0;
      const toColor = palette[toIndex];
      if (!toColor || toColor.isTransparent || toCount <= fromCount) continue;
      const dE = deltaE2000(fromLab, resolveColorLab(toColor));
      if (dE < bestDeltaE) {
        bestDeltaE = dE;
        bestTarget = toColor;
      }
    }

    if (bestTarget && bestDeltaE <= maxDeltaE) {
      const roundedDelta = Math.round(bestDeltaE * 10) / 10;
      suggestions.push({
        fromIndex,
        fromCode: fromColor.code,
        fromHex: fromColor.hex,
        fromCount,
        toIndex: bestTarget.index ?? palette.indexOf(bestTarget),
        toCode: bestTarget.code,
        toHex: bestTarget.hex,
        toCount: counts.get(bestTarget.index ?? palette.indexOf(bestTarget)) || 0,
        deltaE: roundedDelta,
      });
    }
  }

  return suggestions.sort((a, b) => a.deltaE - b.deltaE || a.fromCount - b.fromCount);
}

/**
 * Computes grounded crafting complexity metrics and a recommended bead placement order.
 * @param {{ grid: { cols: number, rows: number, cells: (string | null)[] }, statistics?: any }} pattern
 */
export function analyzeBuildComplexity(pattern, { boardCells = 52 } = {}) {
  const cols = pattern?.grid?.cols || 0;
  const rows = pattern?.grid?.rows || 0;
  const cells = pattern?.grid?.cells || [];
  const counts = new Map();
  let totalBeads = 0;
  let isolatedBeads = 0;
  let colorSwitches = 0;

  for (let y = 0; y < rows; y++) {
    let prev = null;
    for (let x = 0; x < cols; x++) {
      const val = cells[y * cols + x];
      const empty = val === null || val === undefined || val === -1;
      if (empty) {
        prev = null;
        continue;
      }
      totalBeads++;
      counts.set(val, (counts.get(val) || 0) + 1);
      if (prev !== null && prev !== val) colorSwitches++;
      prev = val;

      let sameOrthogonal = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && cells[ny * cols + nx] === val) {
          sameOrthogonal++;
        }
      }
      if (sameOrthogonal === 0) isolatedBeads++;
    }
  }

  const usedColors = counts.size;
  const estimatedMinutes = totalBeads === 0
    ? 0
    : Math.max(5, Math.round(totalBeads * 0.045 + usedColors * 0.8 + isolatedBeads * 0.15));
  const difficulty = totalBeads >= 1500 || usedColors >= 24
    ? 'advanced'
    : totalBeads >= 400 || usedColors >= 12
      ? 'intermediate'
      : 'beginner';

  const recommendedOrder = [...counts.entries()]
    .sort((a, b) => {
      const aAnchor = a[0] === 'H7' || a[0] === 'H2' ? 1 : 0;
      const bAnchor = b[0] === 'H7' || b[0] === 'H2' ? 1 : 0;
      return bAnchor - aAnchor || b[1] - a[1];
    })
    .map(([code, count]) => ({
      code: String(code),
      count,
      role: code === 'H7' || code === 'H2' ? 'outline' : count >= Math.max(12, totalBeads * 0.08) ? 'fill' : 'accent',
    }));

  const boardsX = Math.max(1, Math.ceil(cols / boardCells));
  const boardsY = Math.max(1, Math.ceil(rows / boardCells));

  return {
    cols,
    rows,
    totalBeads,
    usedColors,
    isolatedBeads,
    colorSwitches,
    estimatedMinutes,
    difficulty,
    boardsRequired: boardsX * boardsY,
    boardGrid: `${boardsX}x${boardsY}`,
    recommendedOrder,
  };
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function contrastInk(hex) {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.56 ? '#1f1d1a' : '#ffffff';
}

/**
 * Generates a pure, DOM-free SVG construction sheet for headless CLI, Node.js, and Agent tools.
 * @param {ReturnType<typeof createPattern>} pattern
 * @param {{ cellSize?: number, showCodes?: boolean, showGrid?: boolean, majorGridStep?: number, includeLegend?: boolean }} [options]
 * @returns {string}
 */
export function renderPatternSvg(
  pattern,
  {
    cellSize = 24,
    showCodes = true,
    showGrid = true,
    majorGridStep = 10,
    includeLegend = true,
  } = {},
) {
  const cols = pattern?.grid?.cols || 0;
  const rows = pattern?.grid?.rows || 0;
  const cells = pattern?.grid?.cells || [];
  const palette = getPaletteProvider(pattern?.palette?.id).colors;
  const byCode = new Map(palette.map((c) => [c.code, c]));

  const pad = 28;
  const headerH = 44;
  const gridW = cols * cellSize;
  const gridH = rows * cellSize;
  const colors = pattern?.statistics?.colors || analyzePattern(cells, palette).colors;
  const legendCols = Math.max(1, Math.min(4, Math.floor(Math.max(360, gridW + pad * 2) / 140)));
  const legendRows = includeLegend && colors.length ? Math.ceil(colors.length / legendCols) : 0;
  const legendH = legendRows ? 26 + legendRows * 24 : 0;

  const width = Math.max(360, gridW + pad * 2);
  const height = headerH + pad + gridH + pad + legendH;
  const ox = Math.round((width - gridW) / 2);
  const oy = headerH + pad;

  const chunks = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(pattern.title || 'Bead Pattern')}">`,
    `<rect width="${width}" height="${height}" fill="#fbfaf7"/>`,
    `<text x="${ox}" y="22" font-family="ui-sans-serif,system-ui,sans-serif" font-size="14" font-weight="700" fill="#24221f">${escapeXml(pattern.title || 'Bead Grid Studio Pattern')}</text>`,
    `<text x="${ox}" y="38" font-family="ui-monospace,monospace" font-size="10" fill="#6d675f">${cols}x${rows} · ${colors.length} colors · ${pattern?.statistics?.totalBeads ?? 0} beads</text>`,
    `<rect x="${ox}" y="${oy}" width="${gridW}" height="${gridH}" fill="#ffffff" stroke="#beb6aa" stroke-width="1"/>`,
  ];

  for (let x = 0; x < cols; x++) {
    if (x === 0 || (x + 1) % 5 === 0 || cols <= 16) {
      chunks.push(`<text x="${ox + x * cellSize + cellSize / 2}" y="${oy - 6}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8" fill="#6d675f">${x + 1}</text>`);
    }
  }
  for (let y = 0; y < rows; y++) {
    if (y === 0 || (y + 1) % 5 === 0 || rows <= 16) {
      chunks.push(`<text x="${ox - 6}" y="${oy + y * cellSize + cellSize / 2 + 3}" text-anchor="end" font-family="ui-monospace,monospace" font-size="8" fill="#6d675f">${y + 1}</text>`);
    }
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const code = cells[y * cols + x];
      if (!code) continue;
      const info = byCode.get(code);
      const fill = info?.displayHex || info?.hex || '#cccccc';
      const cx = ox + x * cellSize;
      const cy = oy + y * cellSize;
      chunks.push(`<rect x="${cx}" y="${cy}" width="${cellSize}" height="${cellSize}" fill="${escapeXml(fill)}"/>`);
      if (showCodes && cellSize >= 14) {
        const ink = contrastInk(fill);
        const fontSize = Math.max(7, Math.floor(cellSize * 0.34));
        chunks.push(`<text x="${cx + cellSize / 2}" y="${cy + cellSize / 2 + fontSize * 0.34}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="${fontSize}" font-weight="700" fill="${ink}">${escapeXml(code)}</text>`);
      }
    }
  }

  if (showGrid) {
    for (let x = 1; x < cols; x++) {
      const major = majorGridStep >= 2 && x % majorGridStep === 0;
      chunks.push(`<line x1="${ox + x * cellSize}" y1="${oy}" x2="${ox + x * cellSize}" y2="${oy + gridH}" stroke="${major ? '#24221f' : '#d8d2c8'}" stroke-opacity="${major ? '0.65' : '0.7'}" stroke-width="${major ? 1.5 : 0.6}"/>`);
    }
    for (let y = 1; y < rows; y++) {
      const major = majorGridStep >= 2 && y % majorGridStep === 0;
      chunks.push(`<line x1="${ox}" y1="${oy + y * cellSize}" x2="${ox + gridW}" y2="${oy + y * cellSize}" stroke="${major ? '#24221f' : '#d8d2c8'}" stroke-opacity="${major ? '0.65' : '0.7'}" stroke-width="${major ? 1.5 : 0.6}"/>`);
    }
  }

  if (legendRows > 0) {
    const ly = oy + gridH + pad;
    const colW = Math.floor((width - pad * 2) / legendCols);
    chunks.push(`<text x="${ox}" y="${ly}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-weight="700" fill="#24221f">Materials (${colors.length})</text>`);
    colors.forEach((c, i) => {
      const col = i % legendCols;
      const row = Math.floor(i / legendCols);
      const lx = ox + col * colW;
      const ry = ly + 12 + row * 22;
      chunks.push(`<rect x="${lx}" y="${ry}" width="14" height="14" rx="3" fill="${escapeXml(c.hex)}" stroke="#beb6aa" stroke-width="0.7"/>`);
      chunks.push(`<text x="${lx + 20}" y="${ry + 11}" font-family="ui-monospace,monospace" font-size="10" fill="#24221f">${escapeXml(c.code)} × ${c.count}</text>`);
    });
  }

  chunks.push('</svg>');
  return chunks.join('\n');
}
