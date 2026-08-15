/**
 * Pure grid geometry used by the browser interface and unit tests.
 * This Module deliberately knows nothing about DOM, Canvas, palettes, or files.
 */

function clamp(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

export function gridForLongSide(width, height, longSide, minSide = 4, maxSide = 160) {
  const longest = Math.round(clamp(longSide, minSide, maxSide));
  width = Math.max(1, Number(width) || 1);
  height = Math.max(1, Number(height) || 1);
  let cols;
  let rows;
  let ratioLimited = false;
  if (width >= height) {
    cols = longest;
    rows = Math.round(longest * height / width);
    if (rows < minSide) {
      rows = minSide;
      ratioLimited = true;
    }
  } else {
    rows = longest;
    cols = Math.round(longest * width / height);
    if (cols < minSide) {
      cols = minSide;
      ratioLimited = true;
    }
  }
  return {
    cols: Math.round(clamp(cols, minSide, maxSide)),
    rows: Math.round(clamp(rows, minSide, maxSide)),
    ratioLimited,
  };
}

export function gridFromAspectAnchor(
  width,
  height,
  value,
  axis = 'cols',
  minSide = 4,
  maxSide = 160,
) {
  width = Math.max(1, Number(width) || 1);
  height = Math.max(1, Number(height) || 1);
  const anchor = Math.round(clamp(value, minSide, maxSide));
  let cols = axis === 'rows' ? Math.round(anchor * width / height) : anchor;
  let rows = axis === 'rows' ? anchor : Math.round(anchor * height / width);
  const ratioLimited = cols < minSide || rows < minSide || cols > maxSide || rows > maxSide;
  if (cols > maxSide) {
    cols = maxSide;
    rows = Math.round(cols * height / width);
  }
  if (rows > maxSide) {
    rows = maxSide;
    cols = Math.round(rows * width / height);
  }
  return {
    cols: Math.round(clamp(cols, minSide, maxSide)),
    rows: Math.round(clamp(rows, minSide, maxSide)),
    ratioLimited,
  };
}

export function orientedSourceDimensions(raw, decoded) {
  const rawWidth = Math.max(1, Number(raw?.width) || 1);
  const rawHeight = Math.max(1, Number(raw?.height) || 1);
  const decodedWidth = Math.max(1, Number(decoded?.width) || rawWidth);
  const decodedHeight = Math.max(1, Number(decoded?.height) || rawHeight);
  const decodedAspect = decodedWidth / decodedHeight;
  const normalError = Math.abs(Math.log(decodedAspect / (rawWidth / rawHeight)));
  const swappedError = Math.abs(Math.log(decodedAspect / (rawHeight / rawWidth)));
  return swappedError + 1e-6 < normalError
    ? { width: rawHeight, height: rawWidth, orientationSwapped: true }
    : { width: rawWidth, height: rawHeight, orientationSwapped: false };
}

export function fitGeometryMetrics(sourceWidth, sourceHeight, cols, rows, fitMode = 'contain') {
  sourceWidth = Math.max(1, Number(sourceWidth) || 1);
  sourceHeight = Math.max(1, Number(sourceHeight) || 1);
  cols = Math.max(1, Number(cols) || 1);
  rows = Math.max(1, Number(rows) || 1);
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = cols / rows;
  const usedFraction = Math.min(sourceAspect, targetAspect) / Math.max(sourceAspect, targetAspect);
  let contentCols = cols;
  let contentRows = rows;
  if (sourceAspect > targetAspect) contentRows = cols / sourceAspect;
  else contentCols = rows * sourceAspect;
  const mismatch = 1 - usedFraction;
  return {
    sourceAspect,
    targetAspect,
    mismatch,
    letterboxFraction: fitMode === 'contain' ? mismatch : 0,
    cropFraction: fitMode === 'cover' ? mismatch : 0,
    contentCols: fitMode === 'contain' ? contentCols : cols,
    contentRows: fitMode === 'contain' ? contentRows : rows,
  };
}

export function fitPatternInsideBoard(sourceWidth, sourceHeight, boardCols, boardRows) {
  sourceWidth = Math.max(1, Number(sourceWidth) || 1);
  sourceHeight = Math.max(1, Number(sourceHeight) || 1);
  boardCols = Math.max(1, Math.round(Number(boardCols) || 1));
  boardRows = Math.max(1, Math.round(Number(boardRows) || 1));
  const scale = Math.min(boardCols / sourceWidth, boardRows / sourceHeight);
  let cols = Math.max(1, Math.round(sourceWidth * scale));
  let rows = Math.max(1, Math.round(sourceHeight * scale));
  cols = Math.min(boardCols, cols);
  rows = Math.min(boardRows, rows);
  const offsetX = Math.floor((boardCols - cols) / 2);
  const offsetY = Math.floor((boardRows - rows) / 2);
  const aspectError = Math.abs(Math.log((cols / rows) / (sourceWidth / sourceHeight)));
  return {
    cols,
    rows,
    offsetX,
    offsetY,
    blankLeft: offsetX,
    blankRight: boardCols - cols - offsetX,
    blankTop: offsetY,
    blankBottom: boardRows - rows - offsetY,
    aspectError,
  };
}
