import { gridForLongSide, normalizeCrop } from './geometry.js';

export function analyzeLineArtSubject({ data, width, height }) {
  const count = Math.max(0, width * height);
  const empty = { likelyLineArt: false, autoCrop: null, trimFraction: 0, retainedInkRatio: 0, confidence: 0 };
  if (!data || !count || width < 8 || height < 8) return empty;
  const mask = new Uint8Array(count);
  const visited = new Uint8Array(count);
  const luminance = new Uint8Array(count);
  let neutral = 0;
  let bright = 0;
  let strongInk = 0;
  let chromatic = 0;
  let inkTotal = 0;

  for (let i = 0; i < count; i++) {
    const p = i * 4;
    const a = data[p + 3] / 255;
    const r = data[p] * a + 255 * (1 - a);
    const g = data[p + 1] * a + 255 * (1 - a);
    const b = data[p + 2] * a + 255 * (1 - a);
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const maximum = Math.max(r, g, b);
    const chroma = maximum - Math.min(r, g, b);
    const relative = chroma / Math.max(1, maximum);
    luminance[i] = lum;
    if (chroma <= 20) neutral++;
    if (lum >= 235 && chroma <= 24) bright++;
    if (lum <= 175 && chroma <= 24) strongInk++;
    if (chroma >= 22 && relative >= 0.15) chromatic++;
    if (lum <= 205 && chroma <= 24) {
      mask[i] = 1;
      inkTotal++;
    }
  }

  const neutralRatio = neutral / count;
  const brightRatio = bright / count;
  const strongInkRatio = strongInk / count;
  const chromaticRatio = chromatic / count;
  const likelyLineArt = neutralRatio >= 0.985
    && brightRatio >= 0.62
    && strongInkRatio >= 0.006
    && strongInkRatio <= 0.38
    && chromaticRatio <= 0.012;

  if (!likelyLineArt || inkTotal < 4) return { ...empty, likelyLineArt };

  const strictInkLums = [];
  for (let i = 0; i < count; i++) {
    if (mask[i] && luminance[i] <= 80) strictInkLums.push(luminance[i]);
  }
  strictInkLums.sort((a, b) => a - b);
  const strictInkP90 = strictInkLums.length >= 8
    ? strictInkLums[Math.min(strictInkLums.length - 1, Math.floor(strictInkLums.length * 0.90))]
    : null;

  const median = (values) => {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  const scannerEdgeStrip = ({ minX, maxX, minY, maxY }) => {
    if (strictInkP90 === null) return false;
    const maxStripY = Math.max(2, Math.floor(height * 0.025));
    const maxStripX = Math.max(2, Math.floor(width * 0.025));

    const evaluateHorizontal = (edgeY, innerY) => {
      if (innerY < 0 || innerY >= height) return false;
      const edge = [];
      const inner = [];
      let covered = 0;
      for (let x = 0; x < width; x++) {
        const i = edgeY * width + x;
        if (mask[i]) {
          covered++;
          edge.push(luminance[i]);
        }
        inner.push(luminance[innerY * width + x]);
      }
      if (covered / width < 0.90 || !edge.length) return false;
      const edgeMedian = median(edge);
      const innerMedian = median(inner);
      const uniform = edge.filter((value) => Math.abs(value - edgeMedian) <= 8).length / edge.length;
      const innerBright = inner.filter((value) => value >= 235).length / inner.length;
      return edgeMedian >= 88 && uniform >= 0.98 && innerBright >= 0.95 && innerMedian - edgeMedian >= 64 && edgeMedian - strictInkP90 >= 24;
    };

    const evaluateVertical = (edgeX, innerX) => {
      if (innerX < 0 || innerX >= width) return false;
      const edge = [];
      const inner = [];
      let covered = 0;
      for (let y = 0; y < height; y++) {
        const i = y * width + edgeX;
        if (mask[i]) {
          covered++;
          edge.push(luminance[i]);
        }
        inner.push(luminance[innerY * width + x]);
      }
      if (covered / height < 0.90 || !edge.length) return false;
      const edgeMedian = median(edge);
      const innerMedian = median(inner);
      const uniform = edge.filter((value) => Math.abs(value - edgeMedian) <= 8).length / edge.length;
      const innerBright = inner.filter((value) => value >= 235).length / inner.length;
      return edgeMedian >= 88 && uniform >= 0.98 && innerBright >= 0.95 && innerMedian - edgeMedian >= 64 && edgeMedian - strictInkP90 >= 24;
    };

    const thinHorizontal = maxY - minY + 1 <= maxStripY;
    const thinVertical = maxX - minX + 1 <= maxStripX;
    return (thinHorizontal && minY === 0 && maxX - minX + 1 >= width * 0.90 && evaluateHorizontal(0, maxY + 1))
      || (thinHorizontal && maxY === height - 1 && maxX - minX + 1 >= width * 0.90 && evaluateHorizontal(height - 1, minY - 1))
      || (thinVertical && minX === 0 && maxY - minY + 1 >= height * 0.90 && evaluateVertical(0, maxX + 1))
      || (thinVertical && maxX === width - 1 && maxY - minY + 1 >= height * 0.90 && evaluateVertical(width - 1, minX - 1));
  };

  const queue = new Int32Array(count);
  const components = [];
  for (let start = 0; start < count; start++) {
    if (!mask[start] || visited[start]) continue;
    let head = 0;
    let tail = 0;
    let area = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    visited[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const i = queue[head++];
      const x = i % width;
      const y = Math.floor(i / width);
      area++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (mask[next] && !visited[next]) {
            visited[next] = 1;
            queue[tail++] = next;
          }
        }
      }
    }
    const component = { area, minX, maxX, minY, maxY };
    if (!scannerEdgeStrip(component)) components.push(component);
  }

  if (!components.length) return { ...empty, likelyLineArt };
  components.sort((a, b) => b.area - a.area);
  const main = components[0];
  if (main.area < count * 0.0015) return { ...empty, likelyLineArt };

  let minX = main.minX;
  let maxX = main.maxX;
  let minY = main.minY;
  let maxY = main.maxY;
  let retained = 0;
  for (const component of components) {
    retained += component.area;
    minX = Math.min(minX, component.minX);
    maxX = Math.max(maxX, component.maxX);
    minY = Math.min(minY, component.minY);
    maxY = Math.max(maxY, component.maxY);
  }

  const inkBounds = { minX, maxX, minY, maxY };
  const span = Math.max(maxX - minX + 1, maxY - minY + 1);
  const padding = Math.max(2, Math.round(span * 0.05));
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  const crop = {
    x: minX / width,
    y: minY / height,
    w: (maxX - minX + 1) / width,
    h: (maxY - minY + 1) / height,
  };
  const trimFraction = 1 - crop.w * crop.h;
  const retainedInkRatio = retained / Math.max(1, components.reduce((sum, component) => sum + component.area, 0));
  const confidence = Math.max(0, Math.min(1, (neutralRatio - 0.96) * 8 + (brightRatio - 0.55) * 1.4 + (retainedInkRatio - 0.90) * 2));

  return {
    likelyLineArt,
    autoCrop: trimFraction >= 0.06 && retainedInkRatio >= 0.995 ? normalizeCrop(crop) : null,
    trimFraction,
    retainedInkRatio,
    confidence,
    inkBounds,
    componentCount: components.length,
    excludedComponentCount: 0,
  };
}

export function analyzeSourceComplexity({ data, width, height, sourceWidth = width, sourceHeight = height }) {
  const clampUnit = (value) => Math.max(0, Math.min(1, value));
  const count = Math.max(0, width * height);
  if (!data || !count) {
    return {
      likelyDocument: false,
      likelyPhoto: false,
      documentScore: 0,
      nearWhiteRatio: 0,
      edgeDensity: 0,
      transitionDensity: 0,
      longLineRatio: 0,
      darkRatio: 0,
      saturatedRatio: 0,
      quantizedColorCount: 0,
      flatPairRatio: 1,
      smallComponentCount: 0,
      medianGlyphHeightPx: null,
    };
  }

  const luminance = new Uint8Array(count);
  const darkMask = new Uint8Array(count);
  const colorBins = new Uint8Array(512);
  let nearWhite = 0;
  let dark = 0;
  let saturated = 0;
  let edges = 0;
  let transitions = 0;
  let flatPairs = 0;
  let pairCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const p = i * 4;
      const a = data[p + 3] / 255;
      const r = data[p] * a + 255 * (1 - a);
      const g = data[p + 1] * a + 255 * (1 - a);
      const b = data[p + 2] * a + 255 * (1 - a);
      const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      colorBins[((Math.round(r) >> 5) << 6) | ((Math.round(g) >> 5) << 3) | (Math.round(b) >> 5)] = 1;
      luminance[i] = lum;
      if (lum > 228 && chroma < 30) nearWhite++;
      if (lum < 182) {
        dark++;
        darkMask[i] = 1;
      }
      if (chroma > 52 && lum < 245) saturated++;
      if (x > 0) {
        const diff = Math.abs(lum - luminance[i - 1]);
        if (diff > 42) edges++;
        if (darkMask[i] !== darkMask[i - 1]) transitions++;
        const pp = p - 4;
        const pa = data[pp + 3] / 255;
        const pr = data[pp] * pa + 255 * (1 - pa);
        const pg = data[pp + 1] * pa + 255 * (1 - pa);
        const pb = data[pp + 2] * pa + 255 * (1 - pa);
        if (Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb) < 28) flatPairs++;
        pairCount++;
      }
      if (y > 0) {
        const diff = Math.abs(lum - luminance[i - width]);
        if (diff > 42) edges++;
        if (darkMask[i] !== darkMask[i - width]) transitions++;
        const pp = p - width * 4;
        const pa = data[pp + 3] / 255;
        const pr = data[pp] * pa + 255 * (1 - pa);
        const pg = data[pp + 1] * pa + 255 * (1 - pa);
        const pb = data[pp + 2] * pa + 255 * (1 - pa);
        if (Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb) < 28) flatPairs++;
        pairCount++;
      }
    }
  }

  let longRows = 0;
  let longCols = 0;
  for (let y = 0; y < height; y++) {
    let run = 0;
    let best = 0;
    for (let x = 0; x < width; x++) {
      if (darkMask[y * width + x]) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    if (best >= width * 0.42) longRows++;
  }
  for (let x = 0; x < width; x++) {
    let run = 0;
    let best = 0;
    for (let y = 0; y < height; y++) {
      if (darkMask[y * width + x]) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    if (best >= height * 0.42) longCols++;
  }

  const nearWhiteRatio = nearWhite / count;
  const darkRatio = dark / count;
  const saturatedRatio = saturated / count;
  const edgeDensity = edges / Math.max(1, (width - 1) * height + (height - 1) * width);
  const transitionDensity = transitions / Math.max(1, (width - 1) * height + (height - 1) * width);
  const longLineRatio = (longRows + longCols) / Math.max(1, width + height);
  const quantizedColorCount = colorBins.reduce((sum, value) => sum + value, 0);
  const flatPairRatio = flatPairs / Math.max(1, pairCount);

  const visited = new Uint8Array(count);
  const queue = new Int32Array(count);
  const componentHeights = [];
  const maxComponent = Math.max(24, Math.floor(count * 0.025));

  for (let start = 0; start < count; start++) {
    if (!darkMask[start] || visited[start]) continue;
    let head = 0;
    let tail = 0;
    let area = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    visited[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const i = queue[head++];
      const x = i % width;
      const y = Math.floor(i / width);
      area++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      const add = (next) => {
        if (next >= 0 && next < count && darkMask[next] && !visited[next]) {
          visited[next] = 1;
          queue[tail++] = next;
        }
      };
      if (x > 0) add(i - 1);
      if (x + 1 < width) add(i + 1);
      if (y > 0) add(i - width);
      if (y + 1 < height) add(i + width);
    }
    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    if (area >= 2 && area <= maxComponent && boxW <= width * 0.16 && boxH <= height * 0.16 && boxH >= 2) {
      componentHeights.push(boxH * sourceHeight / height);
    }
  }

  componentHeights.sort((a, b) => a - b);
  const smallComponentCount = componentHeights.length;
  const medianGlyphHeightPx = componentHeights.length >= 4
    ? componentHeights[Math.floor(componentHeights.length / 2)]
    : null;
  const documentScore = clampUnit(
    (nearWhiteRatio - 0.42) * 1.25
    + edgeDensity * 2.1
    + transitionDensity * 2.4
    + longLineRatio * 1.5
    + (darkRatio > 0.008 && darkRatio < 0.42 ? 0.18 : 0)
    - saturatedRatio * 0.45,
  );
  const documentTexture = (smallComponentCount >= 4 && transitionDensity >= 0.025) || transitionDensity >= 0.05;
  const likelyDocument = nearWhiteRatio >= 0.48 && edgeDensity >= 0.03 && darkRatio < 0.30 && documentTexture && documentScore >= 0.60;
  const likelyPhoto = !likelyDocument && quantizedColorCount >= 42 && flatPairRatio < 0.76;

  return {
    likelyDocument,
    likelyPhoto,
    documentScore,
    nearWhiteRatio,
    edgeDensity,
    transitionDensity,
    longLineRatio,
    darkRatio,
    saturatedRatio,
    quantizedColorCount,
    flatPairRatio,
    smallComponentCount,
    medianGlyphHeightPx,
  };
}

export function recommendDocumentGrid({ width, height, analysis, maxSide = 100 }) {
  const longest = Math.max(4, Math.min(160, Math.round(maxSide) || 100));
  const { cols, rows } = gridForLongSide(width, height, longest);
  const glyph = analysis?.medianGlyphHeightPx;
  const requiredTextLongSide = Number.isFinite(glyph) && glyph > 0 ? Math.ceil(4 * Math.max(width, height) / glyph) : null;
  const textReadable = requiredTextLongSide !== null && requiredTextLongSide <= longest;
  const structuralOnly = Boolean(analysis?.likelyDocument) && !textReadable;
  return {
    cols,
    rows,
    requiredTextLongSide,
    textReadable,
    structuralOnly,
    warningCode: structuralOnly ? 'DOCUMENT_STRUCTURE_ONLY' : null,
  };
}

export function recommendAutoHdSettings({ width, height, analysis, quality = 'ultra' }) {
  const documentMode = Boolean(analysis?.likelyDocument);
  const photoMode = !documentMode && Boolean(
    analysis?.likelyPhoto
    || (
      Math.max(width, height) >= 1200
      && (analysis?.quantizedColorCount || 0) >= 32
      && (analysis?.flatPairRatio ?? 1) < 0.84
    ),
  );
  const lineArtMode = !documentMode && !photoMode && Boolean(analysis?.likelyLineArt);
  const maxSide = documentMode ? 100 : photoMode ? (quality === 'ultra' ? 160 : 100) : lineArtMode ? 60 : (quality === 'ultra' ? 120 : 100);
  const grid = recommendDocumentGrid({ width, height, analysis, maxSide });
  return {
    cols: grid.cols,
    rows: grid.rows,
    capacity: grid.cols * grid.rows,
    processMode: documentMode ? 'document' : photoMode ? 'detail' : 'cartoon',
    fitMode: 'contain',
    whiteMode: 'auto',
    maxColors: documentMode ? 24 : photoMode ? 48 : lineArtMode ? 16 : 32,
    mergeStrength: 2,
    protectDark: true,
    paletteMode: 'mard221',
    previewMode: 'square',
    showGrid: true,
    showCodes: true,
    structuralOnly: Boolean(documentMode && grid.structuralOnly),
  };
}
