import { getPaletteProvider } from './palette.js';

/**
 * Pure image-to-grid quantization and constrained palette matching engine.
 *
 * Designed to be completely runtime-agnostic:
 * - Zero DOM / Canvas / window / document dependencies
 * - Runs deterministically in Node.js, Browser main thread, or Web Worker
 * - Self-contained execution body enables seamless Blob-worker serialization for offline portable HTML
 *
 * @param {object} payload
 * @param {Uint8Array | Uint8ClampedArray | number[]} payload.data - Flat RGBA pixel buffer
 * @param {number} payload.width - Source image width in pixels
 * @param {number} payload.height - Source image height in pixels
 * @param {number} payload.cols - Target grid columns
 * @param {number} payload.rows - Target grid rows
 * @param {Array<object>} [payload.palette] - Allowed palette colors (defaults to standard base palette)
 * @param {number} [payload.maxColors=32] - Maximum unique colors allowed in the output pattern
 * @param {'auto' | 'keep'} [payload.whiteMode='auto'] - Connected background handling mode
 * @param {'cartoon' | 'detail' | 'document' | 'photo' | 'pixel'} [payload.processMode='cartoon'] - Processing mode
 * @param {number} [payload.mergeStrength=10] - Color merging aggressiveness (0 to 30)
 * @param {boolean} [payload.protectDark=true] - Protect neutral dark / outline colors from shifting hue
 * @returns {{ buffer: ArrayBuffer, cells: Int16Array, selected: number[], nonEmpty: number, diagnostics: object }}
 */
export function quantizePixels(payload) {
  const {
    data,
    width,
    height,
    cols,
    rows,
    palette = getPaletteProvider().colors.filter((c) => !c.isTransparent),
    maxColors = 32,
    whiteMode = 'auto',
    processMode = 'cartoon',
    mergeStrength = 10,
    protectDark = true,
  } = payload;

  const grid = new Int16Array(cols * rows);
  grid.fill(-1);
  if (!data || !width || !height || !cols || !rows || !palette || !palette.length) {
    return {
      buffer: grid.buffer,
      cells: grid,
      selected: [],
      nonEmpty: 0,
      diagnostics: { usedBeforeMerge: 0, backgroundPixels: 0 },
    };
  }

  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const srgbLinear = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const linearSrgb = (value) => {
    value = clamp01(value);
    return 255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055);
  };
  const rgbLab = (r, g, b) => {
    r = srgbLinear(r);
    g = srgbLinear(g);
    b = srgbLinear(b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  };
  const labDistance = (a, b) => {
    const dl = a[0] - b[0];
    const da = a[1] - b[1];
    const db = a[2] - b[2];
    return Math.sqrt(dl * dl + da * da + db * db);
  };
  const rgbCieLab = (r, g, b) => {
    r = srgbLinear(r);
    g = srgbLinear(g);
    b = srgbLinear(b);
    const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
    const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
    const f = (value) => (value > 216 / 24389 ? Math.cbrt(value) : (24389 / 27 * value + 16) / 116);
    const fx = f(x);
    const fy = f(y);
    const fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };
  const cieDelta = (first, second) => {
    const l1 = first[0];
    const a1 = first[1];
    const b1 = first[2];
    const l2 = second[0];
    const a2 = second[1];
    const b2 = second[2];
    const rad = Math.PI / 180;
    const deg = 180 / Math.PI;
    const c1 = Math.hypot(a1, b1);
    const c2 = Math.hypot(a2, b2);
    const cBar = (c1 + c2) / 2;
    const cBar7 = Math.pow(cBar, 7);
    const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + Math.pow(25, 7))));
    const a1p = (1 + g) * a1;
    const a2p = (1 + g) * a2;
    const c1p = Math.hypot(a1p, b1);
    const c2p = Math.hypot(a2p, b2);
    const hue = (b, a) => {
      const value = Math.atan2(b, a) * deg;
      return value < 0 ? value + 360 : value;
    };
    const h1p = hue(b1, a1p);
    const h2p = hue(b2, a2p);
    const dLp = l2 - l1;
    const dCp = c2p - c1p;
    let dhp = 0;
    if (c1p * c2p !== 0) {
      dhp = h2p - h1p;
      if (dhp > 180) dhp -= 360;
      else if (dhp < -180) dhp += 360;
    }
    const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(dhp * rad / 2);
    const lBar = (l1 + l2) / 2;
    const cBarp = (c1p + c2p) / 2;
    let hBar = h1p + h2p;
    if (c1p * c2p !== 0) {
      hBar = Math.abs(h1p - h2p) <= 180
        ? (h1p + h2p) / 2
        : (h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2);
    }
    const t = 1 - 0.17 * Math.cos((hBar - 30) * rad)
      + 0.24 * Math.cos(2 * hBar * rad)
      + 0.32 * Math.cos((3 * hBar + 6) * rad)
      - 0.20 * Math.cos((4 * hBar - 63) * rad);
    const deltaTheta = 30 * Math.exp(-1 * Math.pow((hBar - 275) / 25, 2));
    const cBarp7 = Math.pow(cBarp, 7);
    const rc = 2 * Math.sqrt(cBarp7 / (cBarp7 + Math.pow(25, 7)));
    const sl = 1 + 0.015 * Math.pow(lBar - 50, 2) / Math.sqrt(20 + Math.pow(lBar - 50, 2));
    const sc = 1 + 0.045 * cBarp;
    const sh = 1 + 0.015 * cBarp * t;
    const rt = -Math.sin(2 * deltaTheta * rad) * rc;
    const dl = dLp / sl;
    const dc = dCp / sc;
    const dh = dHp / sh;
    return Math.sqrt(Math.max(0, dl * dl + dc * dc + dh * dh + rt * dc * dh));
  };

  const pixelCount = width * height;
  const luminance = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const p = i * 4;
    const a = data[p + 3] / 255;
    const r = data[p] * a + 255 * (1 - a);
    const g = data[p + 1] * a + 255 * (1 - a);
    const b = data[p + 2] * a + 255 * (1 - a);
    luminance[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }

  const background = new Uint8Array(pixelCount);
  let backgroundPixels = 0;
  let edgeArtifactPixels = 0;

  if (whiteMode === 'auto') {
    const border = [];
    const addBorder = (x, y) => {
      const i = y * width + x;
      const p = i * 4;
      const a = data[p + 3];
      if (a < 24) {
        border.push([255, 255, 255, 0]);
        return;
      }
      border.push([data[p], data[p + 1], data[p + 2], a]);
    };
    for (let x = 0; x < width; x++) {
      addBorder(x, 0);
      if (height > 1) addBorder(x, height - 1);
    }
    for (let y = 1; y + 1 < height; y++) {
      addBorder(0, y);
      if (width > 1) addBorder(width - 1, y);
    }
    const lightBorder = border.filter(
      (c) => c[3] < 24
        || (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 175
          && Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 55),
    );
    if (lightBorder.length >= Math.max(8, border.length * 0.45)) {
      const median = (channel) => {
        const values = lightBorder.map((c) => c[channel]).sort((a, b) => a - b);
        return values[Math.floor(values.length / 2)];
      };
      const br = median(0);
      const bg = median(1);
      const bb = median(2);
      const baseLum = 0.2126 * br + 0.7152 * bg + 0.0722 * bb;
      let similar = 0;
      for (const c of border) {
        if (c[3] < 24) {
          similar++;
          continue;
        }
        const dr = c[0] - br;
        const dg = c[1] - bg;
        const db = c[2] - bb;
        if (dr * dr + dg * dg + db * db <= 58 * 58) similar++;
      }
      if (baseLum > 185 && Math.max(br, bg, bb) - Math.min(br, bg, bb) < 48 && similar / border.length >= 0.55) {
        const queue = new Int32Array(pixelCount);
        let head = 0;
        let tail = 0;
        const isCandidate = (i) => {
          const p = i * 4;
          const a = data[p + 3];
          if (a < 24) return true;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];
          const dr = r - br;
          const dg = g - bg;
          const db = b - bb;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          return dr * dr + dg * dg + db * db <= 58 * 58 && luminance[i] >= Math.max(170, baseLum - 64) && chroma < 58;
        };
        const enqueue = (i) => {
          if (i >= 0 && i < pixelCount && !background[i] && isCandidate(i)) {
            background[i] = 1;
            queue[tail++] = i;
          }
        };
        for (let x = 0; x < width; x++) {
          enqueue(x);
          enqueue((height - 1) * width + x);
        }
        for (let y = 0; y < height; y++) {
          enqueue(y * width);
          enqueue(y * width + width - 1);
        }
        while (head < tail) {
          const i = queue[head++];
          const x = i % width;
          const y = Math.floor(i / width);
          if (x > 0) enqueue(i - 1);
          if (x + 1 < width) enqueue(i + 1);
          if (y > 0) enqueue(i - width);
          if (y + 1 < height) enqueue(i + width);
        }
        backgroundPixels = tail;
      }
    }

    const edgeProfile = (axis, position) => {
      const length = axis === 'row' ? width : height;
      const values = [];
      let nearWhite = 0;
      let neutral = 0;
      for (let n = 0; n < length; n++) {
        const x = axis === 'row' ? n : position;
        const y = axis === 'row' ? position : n;
        const i = y * width + x;
        const p = i * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const a = data[p + 3];
        const lum = luminance[i];
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (a < 24) {
          values.push(255);
          nearWhite++;
          neutral++;
          continue;
        }
        values.push(lum);
        if (lum >= 240 && chroma <= 12) nearWhite++;
        if (chroma <= 12) neutral++;
      }
      values.sort((a, b) => a - b);
      const median = values[Math.floor(values.length / 2)];
      let uniform = 0;
      for (const value of values) if (Math.abs(value - median) <= 7) uniform++;
      return {
        median,
        uniform: uniform / Math.max(1, length),
        nearWhite: nearWhite / Math.max(1, length),
        neutral: neutral / Math.max(1, length),
      };
    };

    const inkSamples = [];
    for (let i = 0; i < pixelCount; i++) {
      const p = i * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (data[p + 3] >= 32 && luminance[i] <= 80 && chroma <= 12) inkSamples.push(luminance[i]);
    }
    inkSamples.sort((a, b) => a - b);
    const inkP90 = inkSamples.length >= 64
      ? inkSamples[Math.min(inkSamples.length - 1, Math.floor(inkSamples.length * 0.90))]
      : null;

    const markEdge = (axis, edgePosition, innerA, innerB) => {
      const edge = edgeProfile(axis, edgePosition);
      const a = edgeProfile(axis, innerA);
      const b = edgeProfile(axis, innerB);
      if (
        inkP90 === null
        || edge.uniform < 0.98
        || edge.neutral < 0.98
        || edge.median < 80
        || edge.median > 220
        || a.nearWhite < 0.98
        || b.nearWhite < 0.98
        || a.median - edge.median < 64
        || edge.median - inkP90 < 24
      ) return;
      const length = axis === 'row' ? width : height;
      for (let n = 0; n < length; n++) {
        const x = axis === 'row' ? n : edgePosition;
        const y = axis === 'row' ? edgePosition : n;
        const i = y * width + x;
        if (!background[i]) {
          background[i] = 1;
          backgroundPixels++;
          edgeArtifactPixels++;
        }
      }
    };

    if (height >= 4) {
      markEdge('row', 0, 1, 2);
      markEdge('row', height - 1, height - 2, height - 3);
    }
    if (width >= 4) {
      markEdge('col', 0, 1, 2);
      markEdge('col', width - 1, width - 2, width - 3);
    }
  }

  const histogram = new Uint32Array(256);
  let histogramTotal = 0;
  for (let i = 0; i < pixelCount; i++) {
    const p = i * 4;
    if (data[p + 3] < 32 || background[i]) continue;
    const chroma = Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]);
    if (chroma < 50) {
      histogram[luminance[i]]++;
      histogramTotal++;
    }
  }

  let darkThreshold = 72;
  if (histogramTotal) {
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    let leftWeight = 0;
    let leftSum = 0;
    let maxVariance = -1;
    let threshold = 72;
    for (let i = 0; i < 255; i++) {
      leftWeight += histogram[i];
      if (!leftWeight) continue;
      const rightWeight = histogramTotal - leftWeight;
      if (!rightWeight) break;
      leftSum += i * histogram[i];
      const leftMean = leftSum / leftWeight;
      const rightMean = (sum - leftSum) / rightWeight;
      const variance = leftWeight * rightWeight * (leftMean - rightMean) * (leftMean - rightMean);
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }
    darkThreshold = Math.max(54, Math.min(148, threshold + 14));
  }
  const outlineCutoff = Math.min(darkThreshold, 70);

  const visiblyChromaticRgb = (r, g, b) => {
    const maximum = Math.max(r, g, b);
    const spread = maximum - Math.min(r, g, b);
    return spread >= 16 && spread / Math.max(1, maximum) >= 0.24;
  };
  const darkPixelIsChromatic = (r, g, b, lightness) => {
    const maximum = Math.max(r, g, b);
    const spread = maximum - Math.min(r, g, b);
    const relative = spread / Math.max(1, maximum);
    return visiblyChromaticRgb(r, g, b) && (lightness < 0.30 || (spread >= 24 && relative >= 0.36));
  };

  const entryByIndex = new Map(palette.map((entry) => [entry.index, entry]));
  const palettePositionByIndex = new Map(palette.map((entry, position) => [entry.index, position]));
  const exactPalettePosition = new Map();
  palette.forEach((entry, position) => {
    if (entry.rgb) exactPalettePosition.set((entry.rgb[0] << 16) | (entry.rgb[1] << 8) | entry.rgb[2], position);
  });
  const paletteChromatic = palette.map((entry) => {
    if (entry.rgb) return visiblyChromaticRgb(entry.rgb[0], entry.rgb[1], entry.rgb[2]);
    return Math.hypot(entry.lab?.[1] || 0, entry.lab?.[2] || 0) >= 0.04;
  });

  let outlinePalettePosition = paletteChromatic.findIndex((value) => !value);
  if (outlinePalettePosition < 0) outlinePalettePosition = 0;
  for (let i = 0; i < palette.length; i++) {
    if (!paletteChromatic[i] && palette[i].lab[0] < palette[outlinePalettePosition].lab[0]) {
      outlinePalettePosition = i;
    }
  }

  let whitePalettePosition = palette.findIndex((entry) => entry.code === 'H2');
  if (whitePalettePosition < 0) {
    whitePalettePosition = paletteChromatic.findIndex((value) => !value);
    if (whitePalettePosition < 0) whitePalettePosition = 0;
    for (let i = 0; i < palette.length; i++) {
      if (!paletteChromatic[i] && palette[i].lab[0] > palette[whitePalettePosition].lab[0]) {
        whitePalettePosition = i;
      }
    }
  }

  let usablePixels = 0;
  let chromaticPixels = 0;
  let brightNeutralPixels = 0;
  let darkNeutralPixels = 0;
  for (let i = 0; i < pixelCount; i++) {
    const p = i * 4;
    const a = data[p + 3];
    if (a < 32 || background[i]) continue;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const maximum = Math.max(r, g, b);
    const chroma = maximum - Math.min(r, g, b);
    const relative = chroma / Math.max(1, maximum);
    const lum = luminance[i];
    usablePixels++;
    if (chroma >= 18 && relative >= 0.15) chromaticPixels++;
    if (chroma <= 18 && lum >= 225) brightNeutralPixels++;
    if (chroma <= 22 && lum <= 175) darkNeutralPixels++;
  }

  const monochromeLineArt = processMode === 'cartoon'
    && usablePixels > 0
    && chromaticPixels / usablePixels <= 0.012
    && brightNeutralPixels / usablePixels >= 0.45
    && darkNeutralPixels / usablePixels >= 0.015;
  const smallLineArtRefinement = monochromeLineArt && Math.max(cols, rows) <= 60;
  const lineRasterCutoff = Math.min(156, Math.max(100, darkThreshold));

  let lineSkeletonCells = null;
  const lineCoreCoverage = smallLineArtRefinement ? new Float32Array(cols * rows) : null;
  const lineSoftCoverage = smallLineArtRefinement ? new Float32Array(cols * rows) : null;
  const lineInteriorWhiteCoverage = smallLineArtRefinement ? new Float32Array(cols * rows) : null;
  const lineBackgroundCoverage = smallLineArtRefinement ? new Float32Array(cols * rows) : null;
  let lineOwnerCells = null;
  let lineOwnerAreas = null;
  let lineOwnerCandidates = null;
  let lineSourceComponents = 0;
  let lineSeparatedConflicts = 0;
  let lineUnresolvedConflicts = 0;
  let lineUnrepresentableComponents = 0;
  let lineForcedCandidatePlacements = 0;

  if (smallLineArtRefinement) {
    const supersample = Math.max(4, Math.ceil(192 / Math.max(cols, rows)));
    const microWidth = cols * supersample;
    const microHeight = rows * supersample;
    const microCount = microWidth * microHeight;
    const sourceOwners = new Int32Array(pixelCount);
    const sourceQueue = new Int32Array(pixelCount);
    const ownerAreaList = [0];

    for (let start = 0; start < pixelCount; start++) {
      if (sourceOwners[start] || background[start] || data[start * 4 + 3] < 32) continue;
      const p = start * 4;
      const chroma = Math.max(data[p], data[p + 1], data[p + 2]) - Math.min(data[p], data[p + 1], data[p + 2]);
      if (chroma > 22 || luminance[start] > lineRasterCutoff) continue;
      const owner = ++lineSourceComponents;
      let head = 0;
      let tail = 0;
      let area = 0;
      sourceOwners[start] = owner;
      sourceQueue[tail++] = start;
      while (head < tail) {
        const current = sourceQueue[head++];
        const x = current % width;
        const y = Math.floor(current / width);
        area++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const next = ny * width + nx;
            if (sourceOwners[next] || background[next] || data[next * 4 + 3] < 32) continue;
            const np = next * 4;
            const nextChroma = Math.max(data[np], data[np + 1], data[np + 2]) - Math.min(data[np], data[np + 1], data[np + 2]);
            if (nextChroma <= 22 && luminance[next] <= lineRasterCutoff) {
              sourceOwners[next] = owner;
              sourceQueue[tail++] = next;
            }
          }
        }
      }
      ownerAreaList[owner] = area;
    }

    lineOwnerAreas = Int32Array.from(ownerAreaList);
    const microTotal = new Float32Array(microCount);
    const microInk = new Float32Array(microCount);
    const microOwners = new Int32Array(microCount);
    const microOwnerVotes = new Float32Array(microCount);
    const microConflicts = new Map();

    for (let my = 0; my < microHeight; my++) {
      for (let mx = 0; mx < microWidth; mx++) {
        const micro = my * microWidth + mx;
        const sx0 = mx * width / microWidth;
        const sx1 = (mx + 1) * width / microWidth;
        const sy0 = my * height / microHeight;
        const sy1 = (my + 1) * height / microHeight;
        microTotal[micro] = (sx1 - sx0) * (sy1 - sy0);
        for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++) {
          for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) {
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const area = Math.max(0, Math.min(x + 1, sx1) - Math.max(x, sx0)) * Math.max(0, Math.min(y + 1, sy1) - Math.max(y, sy0));
            if (area <= 0) continue;
            const owner = sourceOwners[y * width + x];
            if (!owner) continue;
            microInk[micro] += area;
            const conflict = microConflicts.get(micro);
            if (conflict) conflict.set(owner, (conflict.get(owner) || 0) + area);
            else if (!microOwners[micro] || microOwners[micro] === owner) {
              microOwners[micro] = owner;
              microOwnerVotes[micro] += area;
            } else {
              microConflicts.set(micro, new Map([[microOwners[micro], microOwnerVotes[micro]], [owner, area]]));
            }
          }
        }
      }
    }

    for (const [micro, votes] of microConflicts) {
      let bestOwner = 0;
      let bestVotes = -1;
      for (const [owner, vote] of votes) {
        if (vote > bestVotes || (vote === bestVotes && (lineOwnerAreas[owner] || 0) > (lineOwnerAreas[bestOwner] || 0))) {
          bestOwner = owner;
          bestVotes = vote;
        }
      }
      microOwners[micro] = bestOwner;
    }

    const thinned = new Uint8Array(microCount);
    for (let i = 0; i < microCount; i++) {
      if (microTotal[i] && microInk[i] / microTotal[i] >= 0.08) thinned[i] = 1;
    }

    const pending = new Uint8Array(microCount);
    const neighbors = new Uint8Array(8);
    let changed = true;
    let rounds = 0;
    while (changed && rounds++ < 64) {
      changed = false;
      for (let phase = 0; phase < 2; phase++) {
        pending.fill(0);
        for (let y = 1; y + 1 < microHeight; y++) {
          for (let x = 1; x + 1 < microWidth; x++) {
            const i = y * microWidth + x;
            if (!thinned[i]) continue;
            neighbors[0] = thinned[i - microWidth];
            neighbors[1] = thinned[i - microWidth + 1];
            neighbors[2] = thinned[i + 1];
            neighbors[3] = thinned[i + microWidth + 1];
            neighbors[4] = thinned[i + microWidth];
            neighbors[5] = thinned[i + microWidth - 1];
            neighbors[6] = thinned[i - 1];
            neighbors[7] = thinned[i - microWidth - 1];
            let count = 0;
            let transitions = 0;
            for (let n = 0; n < 8; n++) {
              count += neighbors[n];
              if (!neighbors[n] && neighbors[(n + 1) % 8]) transitions++;
            }
            if (count < 2 || count > 6 || transitions !== 1) continue;
            const first = phase === 0
              ? neighbors[0] * neighbors[2] * neighbors[4]
              : neighbors[0] * neighbors[2] * neighbors[6];
            const second = phase === 0
              ? neighbors[2] * neighbors[4] * neighbors[6]
              : neighbors[0] * neighbors[4] * neighbors[6];
            if (!first && !second) pending[i] = 1;
          }
        }
        for (let i = 0; i < microCount; i++) {
          if (pending[i]) {
            thinned[i] = 0;
            changed = true;
          }
        }
      }
    }

    lineSkeletonCells = new Uint8Array(cols * rows);
    lineOwnerCells = new Int32Array(cols * rows);
    lineOwnerCandidates = Array.from({ length: lineSourceComponents + 1 }, () => []);
    const targetCellArea = Math.max(0.001, (width / cols) * (height / rows));

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const cell = gy * cols + gx;
        const skeletonVotes = new Map();
        const inkVotes = new Map();
        for (let my = gy * supersample; my < (gy + 1) * supersample; my++) {
          for (let mx = gx * supersample; mx < (gx + 1) * supersample; mx++) {
            const micro = my * microWidth + mx;
            const owner = microOwners[micro];
            if (!owner) continue;
            const splitVotes = microConflicts.get(micro);
            if (splitVotes) {
              for (const [candidateOwner, vote] of splitVotes) {
                inkVotes.set(candidateOwner, (inkVotes.get(candidateOwner) || 0) + vote);
              }
            } else {
              inkVotes.set(owner, (inkVotes.get(owner) || 0) + microInk[micro]);
            }
            if (thinned[micro]) skeletonVotes.set(owner, (skeletonVotes.get(owner) || 0) + 1);
          }
        }

        for (const [owner, vote] of inkVotes) {
          const candidates = lineOwnerCandidates[owner];
          const candidate = { cell, score: vote / targetCellArea };
          candidates.push(candidate);
          candidates.sort((a, b) => b.score - a.score || a.cell - b.cell);
          if (candidates.length > 12) candidates.length = 12;
        }
        const votes = skeletonVotes.size ? skeletonVotes : inkVotes;
        let bestOwner = 0;
        let bestVotes = -1;
        for (const [owner, vote] of votes) {
          if (vote > bestVotes || (vote === bestVotes && (lineOwnerAreas[owner] || 0) > (lineOwnerAreas[bestOwner] || 0))) {
            bestOwner = owner;
            bestVotes = vote;
          }
        }
        if (skeletonVotes.size) lineSkeletonCells[cell] = 1;
        lineOwnerCells[cell] = bestOwner;
      }
    }
  }

  const fineMatching = processMode === 'photo' || processMode === 'detail' || processMode === 'pixel';
  const nearestCache = fineMatching ? new Map() : null;
  const coarseCache = fineMatching ? null : new Int16Array(65536).fill(-1);

  const nearestPalettePosition = (r, g, b, forceNeutralOverride = false) => {
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    const exact = exactPalettePosition.get((r << 16) | (g << 8) | b);
    if (exact !== undefined && !forceNeutralOverride) return exact;

    const bucketR = fineMatching ? r : r >> 3;
    const bucketG = fineMatching ? g : g >> 3;
    const bucketB = fineMatching ? b : b >> 3;
    const baseKey = fineMatching ? ((r << 16) | (g << 8) | b) : ((bucketR << 10) | (bucketG << 5) | bucketB);
    const key = baseKey + (forceNeutralOverride ? (fineMatching ? 16777216 : 32768) : 0);
    if (fineMatching && nearestCache.has(key)) return nearestCache.get(key);
    if (!fineMatching && coarseCache[key] >= 0) return coarseCache[key];

    const matchR = fineMatching ? r : Math.min(255, bucketR * 8 + 3.5);
    const matchG = fineMatching ? g : Math.min(255, bucketG * 8 + 3.5);
    const matchB = fineMatching ? b : Math.min(255, bucketB * 8 + 3.5);
    const lab = rgbLab(matchR, matchG, matchB);
    const cieLab = rgbCieLab(matchR, matchG, matchB);
    const forceNeutral = forceNeutralOverride
      || (protectDark && lab[0] < 0.55 && Math.hypot(lab[1], lab[2]) < 0.03 && !darkPixelIsChromatic(matchR, matchG, matchB, lab[0]));

    const candidates = [];
    for (let i = 0; i < palette.length; i++) {
      if (forceNeutral && paletteChromatic[i]) continue;
      const rough = labDistance(lab, palette[i].lab);
      let insertAt = candidates.length;
      while (
        insertAt > 0
        && (rough < candidates[insertAt - 1].rough - 1e-12
          || (Math.abs(rough - candidates[insertAt - 1].rough) < 1e-12
            && palette[i].index < palette[candidates[insertAt - 1].position].index))
      ) {
        insertAt--;
      }
      if (insertAt < 32) {
        candidates.splice(insertAt, 0, { position: i, rough });
        if (candidates.length > 32) candidates.pop();
      }
    }

    let choice = candidates[0]?.position ?? 0;
    let distance = Infinity;
    for (const candidate of candidates) {
      const i = candidate.position;
      const d = palette[i].cieLab ? cieDelta(cieLab, palette[i].cieLab) : candidate.rough * 100;
      if (d < distance - 1e-12 || (Math.abs(d - distance) < 1e-12 && palette[i].index < palette[choice].index)) {
        distance = d;
        choice = i;
      }
    }
    if (fineMatching) nearestCache.set(key, choice);
    else coarseCache[key] = choice;
    return choice;
  };

  const scores = new Float32Array(palette.length);
  const featureScores = new Float32Array(palette.length);
  const rawScores = new Float32Array(palette.length);
  const cellImportance = new Float32Array(cols * rows);
  const cellSupport = new Float32Array(cols * rows);
  const documentMode = processMode === 'document';
  const detailMode = processMode === 'detail';
  const detailR = detailMode ? new Float32Array(cols * rows) : null;
  const detailG = detailMode ? new Float32Array(cols * rows) : null;
  const detailB = detailMode ? new Float32Array(cols * rows) : null;
  const detailValid = detailMode ? new Uint8Array(cols * rows) : null;
  const detailNeutralDark = detailMode ? new Uint8Array(cols * rows) : null;
  const detailWhite = detailMode ? new Uint8Array(cols * rows) : null;
  const documentInkThreshold = Math.max(100, Math.min(170, darkThreshold + 35));
  const stepX = width / cols;
  const stepY = height / rows;

  for (let gy = 0; gy < rows; gy++) {
    const sourceY0 = gy * stepY;
    const sourceY1 = (gy + 1) * stepY;
    const y0 = Math.max(0, Math.floor(sourceY0));
    const y1 = Math.min(height, Math.max(y0 + 1, Math.ceil(sourceY1)));
    for (let gx = 0; gx < cols; gx++) {
      const sourceX0 = gx * stepX;
      const sourceX1 = (gx + 1) * stepX;
      const x0 = Math.max(0, Math.floor(sourceX0));
      const x1 = Math.min(width, Math.max(x0 + 1, Math.ceil(sourceX1)));
      const cell = gy * cols + gx;

      if (processMode === 'pixel') {
        const x = Math.min(width - 1, Math.max(0, Math.floor((gx + 0.5) * stepX)));
        const y = Math.min(height - 1, Math.max(0, Math.floor((gy + 0.5) * stepY)));
        const i = y * width + x;
        const p = i * 4;
        const a = data[p + 3] / 255;
        if (a >= 0.12 && !background[i]) {
          const r = Math.round(data[p] * a + 255 * (1 - a));
          const g = Math.round(data[p + 1] * a + 255 * (1 - a));
          const b = Math.round(data[p + 2] * a + 255 * (1 - a));
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          grid[cell] = palette[Math.min(r, g, b) >= 245 && chroma <= 12 ? whitePalettePosition : nearestPalettePosition(r, g, b)].index;
          cellImportance[cell] = 1;
        }
        continue;
      }

      const cellWidth = x1 - x0;
      const cellHeight = y1 - y0;
      const area = cellWidth * cellHeight;
      const fullSampling = processMode !== 'photo';
      const exhaustiveSampling = fullSampling || area <= 196;
      const samplesX = exhaustiveSampling ? cellWidth : Math.min(14, cellWidth);
      const samplesY = exhaustiveSampling ? cellHeight : Math.min(14, cellHeight);
      let lr = 0;
      let lg = 0;
      let lb = 0;
      let totalWeight = 0;
      let darkLr = 0;
      let darkLg = 0;
      let darkLb = 0;
      let darkWeight = 0;
      let valid = 0;
      let outlineSamples = 0;
      let lineCoreSamples = 0;
      let lineSoftSamples = 0;
      let lineBackgroundSamples = 0;
      let nearWhiteSamples = 0;
      let neutralDarkSamples = 0;
      let maxOutlineGradient = 0;
      let documentDark = 0;
      let documentNonWhite = 0;
      let documentSaturated = 0;
      let documentEdges = 0;
      let documentTransitions = 0;
      let documentTensorA = 0;
      let documentTensorB = 0;
      let documentTensorTotal = 0;
      let documentMaxRowRun = 0;
      let documentMaxColRun = 0;
      let documentColorLr = 0;
      let documentColorLg = 0;
      let documentColorLb = 0;
      let documentColorWeight = 0;
      const documentColRuns = documentMode ? new Uint16Array(samplesX) : null;
      const documentPreviousRow = documentMode ? new Uint8Array(samplesX) : null;
      const outlineRowHits = new Uint8Array(samplesY);
      const outlineColHits = new Uint8Array(samplesX);
      scores.fill(0);
      featureScores.fill(0);
      rawScores.fill(0);

      for (let syi = 0; syi < samplesY; syi++) {
        const y = exhaustiveSampling ? y0 + syi : Math.min(y1 - 1, Math.floor(y0 + (syi + 0.5) * cellHeight / samplesY));
        let documentRowRun = 0;
        let documentPreviousDark = 0;
        for (let sxi = 0; sxi < samplesX; sxi++) {
          const x = exhaustiveSampling ? x0 + sxi : Math.min(x1 - 1, Math.floor(x0 + (sxi + 0.5) * cellWidth / samplesX));
          const i = y * width + x;
          const p = i * 4;
          const a = data[p + 3] / 255;
          const sampleArea = exhaustiveSampling
            ? Math.max(0, Math.min(x + 1, sourceX1) - Math.max(x, sourceX0)) * Math.max(0, Math.min(y + 1, sourceY1) - Math.max(y, sourceY0))
            : 1;
          if (sampleArea <= 0) continue;
          if (a < 0.12) {
            if (documentMode) {
              documentRowRun = 0;
              documentColRuns[sxi] = 0;
              documentPreviousRow[sxi] = 0;
              documentPreviousDark = 0;
            }
            continue;
          }
          if (background[i] && !documentMode) {
            if (smallLineArtRefinement) lineBackgroundSamples += sampleArea;
            continue;
          }
          const r = Math.round(data[p] * a + 255 * (1 - a));
          const g = Math.round(data[p + 1] * a + 255 * (1 - a));
          const b = Math.round(data[p + 2] * a + 255 * (1 - a));
          valid += sampleArea;
          const lum = luminance[i];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const chroma = max - min;
          const saturation = max ? chroma / max : 0;
          if (min >= 245 && chroma <= 12) nearWhiteSamples += sampleArea;
          if (lum <= outlineCutoff && chroma <= 18) neutralDarkSamples += sampleArea;
          if (smallLineArtRefinement && chroma <= 22) {
            if (lum <= lineRasterCutoff) lineCoreSamples += sampleArea;
            if (lum <= 180) lineSoftSamples += sampleArea;
          }
          if (processMode === 'photo' || detailMode) {
            const rLinear = srgbLinear(r);
            const gLinear = srgbLinear(g);
            const bLinear = srgbLinear(b);
            const weight = a * sampleArea;
            lr += rLinear * weight;
            lg += gLinear * weight;
            lb += bLinear * weight;
            totalWeight += weight;
            if (detailMode && lum <= 105) {
              darkLr += rLinear * weight;
              darkLg += gLinear * weight;
              darkLb += bLinear * weight;
              darkWeight += weight;
            }
            continue;
          }
          const left = luminance[y * width + Math.max(0, x - 1)];
          const right = luminance[y * width + Math.min(width - 1, x + 1)];
          const up = luminance[Math.max(0, y - 1) * width + x];
          const down = luminance[Math.min(height - 1, y + 1) * width + x];
          const gradient = (Math.abs(right - left) + Math.abs(down - up)) * 0.5;

          if (documentMode) {
            const weight = a * sampleArea;
            lr += srgbLinear(r) * weight;
            lg += srgbLinear(g) * weight;
            lb += srgbLinear(b) * weight;
            totalWeight += weight;
            const dark = lum <= documentInkThreshold ? 1 : 0;
            const nonWhite = lum < 232 || chroma > 28;
            if (dark) documentDark += sampleArea;
            if (nonWhite) {
              documentNonWhite += sampleArea;
              documentColorLr += srgbLinear(r) * weight;
              documentColorLg += srgbLinear(g) * weight;
              documentColorLb += srgbLinear(b) * weight;
              documentColorWeight += weight;
              const mapped = nearestPalettePosition(r, g, b);
              scores[mapped] += weight;
              if (visiblyChromaticRgb(r, g, b)) {
                documentSaturated += sampleArea;
                rawScores[mapped] += weight;
              }
            }
            documentRowRun = dark ? documentRowRun + 1 : 0;
            documentColRuns[sxi] = dark ? documentColRuns[sxi] + 1 : 0;
            documentMaxRowRun = Math.max(documentMaxRowRun, documentRowRun);
            documentMaxColRun = Math.max(documentMaxColRun, documentColRuns[sxi]);
            if (sxi > 0 && dark !== documentPreviousDark) documentTransitions += sampleArea;
            if (syi > 0 && dark !== documentPreviousRow[sxi]) documentTransitions += sampleArea;
            documentPreviousDark = dark;
            documentPreviousRow[sxi] = dark;
            const gx = right - left;
            const gy = down - up;
            const energy = gx * gx + gy * gy;
            if (Math.abs(gx) + Math.abs(gy) > 58) documentEdges += sampleArea;
            documentTensorA += (gx * gx - gy * gy) * sampleArea;
            documentTensorB += 2 * gx * gy * sampleArea;
            documentTensorTotal += energy * sampleArea;
            continue;
          }

          const pixelIsChromatic = visiblyChromaticRgb(r, g, b);
          const exactChoice = exactPalettePosition.get((r << 16) | (g << 8) | b);
          const isOutline = exactChoice === outlinePalettePosition
            || (exactChoice === undefined && !pixelIsChromatic && lum <= outlineCutoff);
          const choice = isOutline
            ? outlinePalettePosition
            : exactChoice !== undefined
              ? exactChoice
              : (monochromeLineArt && !pixelIsChromatic ? whitePalettePosition : nearestPalettePosition(r, g, b));
          let factor = 1;
          if (isOutline) {
            factor = 1.66 + Math.min(1.15, gradient / 105);
            outlineSamples += sampleArea;
            outlineRowHits[syi] = 1;
            outlineColHits[sxi] = 1;
            maxOutlineGradient = Math.max(maxOutlineGradient, gradient);
          } else if (saturation > 0.25) {
            factor = 1.45 + 1.25 * saturation + Math.min(0.7, gradient / 180);
          } else if (lum > 220) {
            factor = 0.92;
          }
          const weight = a * factor * sampleArea;
          scores[choice] += weight;
          rawScores[choice] += a * sampleArea;
          featureScores[choice] += a * sampleArea * Math.max(0, factor - 1);
        }
      }

      if (!valid) continue;
      const sampleCapacity = exhaustiveSampling ? stepX * stepY : samplesX * samplesY;
      if (smallLineArtRefinement) {
        lineCoreCoverage[cell] = lineCoreSamples / Math.max(0.001, sampleCapacity);
        lineSoftCoverage[cell] = lineSoftSamples / Math.max(0.001, sampleCapacity);
        lineInteriorWhiteCoverage[cell] = nearWhiteSamples / Math.max(0.001, sampleCapacity);
        lineBackgroundCoverage[cell] = lineBackgroundSamples / Math.max(0.001, sampleCapacity);
      }
      if (processMode === 'cartoon' && valid / Math.max(0.001, sampleCapacity) < 0.1) continue;
      const highConfidenceWhite = nearWhiteSamples / valid >= 0.82 && neutralDarkSamples / valid < 0.05;

      if (documentMode) {
        const darkCoverage = documentDark / valid;
        const nonWhiteCoverage = documentNonWhite / valid;
        const saturatedCoverage = documentSaturated / valid;
        const edgeDensity = documentEdges / valid;
        const coherence = documentTensorTotal > 0 ? Math.hypot(documentTensorA, documentTensorB) / documentTensorTotal : 0;
        const transitionDensity = documentTransitions / Math.max(1, valid * 2);
        const longRun = Math.max(documentMaxRowRun / Math.max(1, samplesX), documentMaxColRun / Math.max(1, samplesY));
        const continuousRule = darkCoverage >= 0.015 && longRun >= 0.68;
        const coherentEdge = darkCoverage >= 0.04 && edgeDensity >= 0.08 && coherence >= 0.55;
        const solidInk = darkCoverage >= 0.32;
        const textTexture = transitionDensity >= 0.18 && longRun < 0.58 && coherence < 0.50;
        let dominantColor = -1;
        let dominantScore = 0;
        let dominantSaturated = -1;
        let dominantSaturatedScore = 0;
        for (let i = 0; i < scores.length; i++) {
          if (scores[i] > dominantScore) {
            dominantScore = scores[i];
            dominantColor = i;
          }
          if (rawScores[i] > dominantSaturatedScore) {
            dominantSaturatedScore = rawScores[i];
            dominantSaturated = i;
          }
        }
        const dominantSupport = dominantScore / Math.max(1, documentNonWhite);
        const solidColor = saturatedCoverage >= 0.18 && dominantSupport >= 0.42;
        const solidFill = nonWhiteCoverage >= 0.38;
        let choice = -1;
        let confidence = 0;
        if (!(textTexture && !continuousRule && !solidColor && !solidFill)) {
          if (continuousRule || coherentEdge || solidInk) {
            const coloredStructure = documentSaturated / Math.max(1, documentNonWhite) > 0.52 && dominantSaturated >= 0;
            choice = coloredStructure ? dominantSaturated : outlinePalettePosition;
            confidence = Math.max(darkCoverage, longRun, coherence);
          } else if (solidColor && dominantSaturated >= 0) {
            choice = dominantSaturated;
            confidence = Math.max(saturatedCoverage, dominantSupport);
          } else if (solidFill && documentColorWeight > 0.02) {
            const r = Math.round(linearSrgb(documentColorLr / documentColorWeight));
            const g = Math.round(linearSrgb(documentColorLg / documentColorWeight));
            const b = Math.round(linearSrgb(documentColorLb / documentColorWeight));
            choice = nearestPalettePosition(r, g, b);
            confidence = nonWhiteCoverage;
          } else if (whiteMode === 'keep' && totalWeight > 0.02) {
            const r = Math.round(linearSrgb(lr / totalWeight));
            const g = Math.round(linearSrgb(lg / totalWeight));
            const b = Math.round(linearSrgb(lb / totalWeight));
            choice = nearestPalettePosition(r, g, b);
            confidence = 0.25;
          }
        }
        if (choice >= 0) {
          grid[cell] = palette[choice].index;
          cellSupport[cell] = confidence;
          cellImportance[cell] = 1 + Math.min(4, confidence * 3 + (continuousRule || coherentEdge ? 1 : 0));
        }
      } else if (processMode === 'photo' || detailMode) {
        if (totalWeight < 0.02) continue;
        let meanR = lr / totalWeight;
        let meanG = lg / totalWeight;
        let meanB = lb / totalWeight;
        if (detailMode && darkWeight / totalWeight >= 0.24) {
          const darkR = darkLr / darkWeight;
          const darkG = darkLg / darkWeight;
          const darkB = darkLb / darkWeight;
          const meanLum = 0.2126 * linearSrgb(meanR) + 0.7152 * linearSrgb(meanG) + 0.0722 * linearSrgb(meanB);
          const darkLum = 0.2126 * linearSrgb(darkR) + 0.7152 * linearSrgb(darkG) + 0.0722 * linearSrgb(darkB);
          if (meanLum - darkLum >= 18) {
            const strength = Math.min(0.55, 0.18 + (darkWeight / totalWeight - 0.24) * 0.9);
            meanR = meanR * (1 - strength) + darkR * strength;
            meanG = meanG * (1 - strength) + darkG * strength;
            meanB = meanB * (1 - strength) + darkB * strength;
          }
        }
        const r = Math.round(linearSrgb(meanR));
        const g = Math.round(linearSrgb(meanG));
        const b = Math.round(linearSrgb(meanB));
        if (detailMode) {
          detailR[cell] = r;
          detailG[cell] = g;
          detailB[cell] = b;
          detailValid[cell] = 1;
          detailWhite[cell] = highConfidenceWhite ? 1 : 0;
          const meanLab = rgbLab(r, g, b);
          detailNeutralDark[cell] = protectDark && meanLab[0] < 0.55 && Math.hypot(meanLab[1], meanLab[2]) < 0.03 && !darkPixelIsChromatic(r, g, b, meanLab[0]) ? 1 : 0;
        } else {
          grid[cell] = palette[highConfidenceWhite ? whitePalettePosition : nearestPalettePosition(r, g, b)].index;
        }
        cellImportance[cell] = 1;
      } else {
        let choice = 0;
        let best = -1;
        for (let i = 0; i < scores.length; i++) {
          if (scores[i] > best + 1e-7 || (Math.abs(scores[i] - best) < 1e-7 && palette[i].index < palette[choice].index)) {
            best = scores[i];
            choice = i;
          }
        }
        if (highConfidenceWhite) {
          choice = whitePalettePosition;
        } else if (choice === outlinePalettePosition) {
          const outlineCoverage = outlineSamples / valid;
          const rowContinuity = outlineRowHits.reduce((sum, value) => sum + value, 0) / samplesY;
          const colContinuity = outlineColHits.reduce((sum, value) => sum + value, 0) / samplesX;
          const coherentThinLine = outlineCoverage >= 0.22 && outlineCoverage < 0.5 && maxOutlineGradient >= 90 && Math.max(rowContinuity, colContinuity) >= 0.84;
          if (outlineCoverage + 1e-7 < 0.5 && !coherentThinLine) {
            let alternative = -1;
            let alternativeScore = 0;
            for (let i = 0; i < scores.length; i++) {
              if (i !== outlinePalettePosition && (scores[i] > alternativeScore + 1e-7 || (Math.abs(scores[i] - alternativeScore) < 1e-7 && alternative >= 0 && palette[i].index < palette[alternative].index))) {
                alternative = i;
                alternativeScore = scores[i];
              }
            }
            if (alternative >= 0 && alternativeScore > 0) choice = alternative;
          }
        }
        grid[cell] = palette[choice].index;
        cellSupport[cell] = rawScores[choice] / valid;
        cellImportance[cell] = 1 + Math.min(4, featureScores[choice] / Math.max(0.001, scores[choice]));
      }
    }
  }

  if (smallLineArtRefinement) {
    const active = new Uint8Array(grid.length);
    const ownerCounts = new Int32Array(lineSourceComponents + 1);
    for (let cell = 0; cell < grid.length; cell++) {
      const strongFill = lineCoreCoverage[cell] >= 0.42 || (lineCoreCoverage[cell] >= 0.30 && lineSoftCoverage[cell] >= 0.50);
      if ((lineSkeletonCells[cell] || strongFill) && lineOwnerCells[cell] > 0) {
        active[cell] = 1;
        ownerCounts[lineOwnerCells[cell]]++;
      }
    }

    for (let owner = 1; owner <= lineSourceComponents; owner++) {
      if (ownerCounts[owner]) continue;
      let best = -1;
      let bestScore = 0;
      let fallback = -1;
      let fallbackScore = 0;
      for (const candidate of lineOwnerCandidates[owner] || []) {
        const cell = candidate.cell;
        if (active[cell]) continue;
        const x = cell % cols;
        const y = Math.floor(cell / cols);
        let conflict = false;
        for (let dy = -1; dy <= 1 && !conflict; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const next = ny * cols + nx;
            if (active[next] && lineOwnerCells[next] !== owner) {
              conflict = true;
              break;
            }
          }
        }
        if (candidate.score >= 0.008 && candidate.score > fallbackScore) {
          fallback = cell;
          fallbackScore = candidate.score;
        }
        if (!conflict && candidate.score >= 0.008 && candidate.score > bestScore) {
          best = cell;
          bestScore = candidate.score;
        }
      }
      const chosen = best >= 0 ? best : fallback;
      if (chosen >= 0) {
        lineOwnerCells[chosen] = owner;
        active[chosen] = 1;
        ownerCounts[owner] = 1;
        if (best < 0) lineForcedCandidatePlacements++;
      } else {
        lineUnrepresentableComponents++;
      }
    }

    const seen = new Uint32Array(grid.length);
    const queue = new Int32Array(grid.length);
    let seenMark = 0;
    const ownerConnectedWithout = (removed, owner) => {
      const target = ownerCounts[owner] - 1;
      if (target < 1) return false;
      let start = -1;
      for (let i = 0; i < active.length; i++) {
        if (i !== removed && active[i] && lineOwnerCells[i] === owner) {
          start = i;
          break;
        }
      }
      if (start < 0) return false;
      const mark = ++seenMark;
      let head = 0;
      let tail = 0;
      let reached = 0;
      seen[start] = mark;
      queue[tail++] = start;
      while (head < tail) {
        const current = queue[head++];
        const x = current % cols;
        const y = Math.floor(current / cols);
        reached++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const next = ny * cols + nx;
            if (next !== removed && active[next] && lineOwnerCells[next] === owner && seen[next] !== mark) {
              seen[next] = mark;
              queue[tail++] = next;
            }
          }
        }
      }
      return reached === target;
    };

    for (let round = 0; round < active.length; round++) {
      let removal = -1;
      let removalScore = -Infinity;
      let conflicts = 0;
      const connectivityCache = new Map();
      for (let cell = 0; cell < active.length; cell++) {
        if (!active[cell]) continue;
        const x = cell % cols;
        const y = Math.floor(cell / cols);
        const owner = lineOwnerCells[cell];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const next = ny * cols + nx;
            if (next <= cell || !active[next] || lineOwnerCells[next] === owner) continue;
            conflicts++;
            for (const candidate of [cell, next]) {
              const candidateOwner = lineOwnerCells[candidate];
              if (ownerCounts[candidateOwner] <= 1) continue;
              let connected = connectivityCache.get(candidate);
              if (connected === undefined) {
                connected = ownerConnectedWithout(candidate, candidateOwner);
                connectivityCache.set(candidate, connected);
              }
              if (!connected) continue;
              const score = ownerCounts[candidateOwner] * 10 - lineCoreCoverage[candidate] * 3 + (lineOwnerAreas[candidateOwner] || 0) / 10000;
              if (score > removalScore) {
                removal = candidate;
                removalScore = score;
              }
            }
          }
        }
      }
      if (!conflicts) break;
      if (removal < 0) {
        lineUnresolvedConflicts = conflicts;
        break;
      }
      active[removal] = 0;
      ownerCounts[lineOwnerCells[removal]]--;
      lineSeparatedConflicts++;
    }

    for (let cell = 0; cell < grid.length; cell++) {
      if (active[cell]) {
        grid[cell] = palette[outlinePalettePosition].index;
        cellSupport[cell] = Math.max(cellSupport[cell], lineCoreCoverage[cell]);
        cellImportance[cell] = Math.max(cellImportance[cell], 2.4);
      } else if (grid[cell] === palette[outlinePalettePosition].index) {
        grid[cell] = lineBackgroundCoverage[cell] < 0.20 ? palette[whitePalettePosition].index : -1;
      }
      if (!active[cell] && grid[cell] === palette[whitePalettePosition].index && lineBackgroundCoverage[cell] >= 0.20) {
        grid[cell] = -1;
      }
    }
  }

  if (detailMode) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = y * cols + x;
        if (!detailValid[cell]) continue;
        if (detailWhite[cell]) {
          grid[cell] = palette[whitePalettePosition].index;
          cellSupport[cell] = 1;
          cellImportance[cell] = 1;
          continue;
        }
        let nr = 0;
        let ng = 0;
        let nb = 0;
        let neighbors = 0;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const next = ny * cols + nx;
          if (!detailValid[next]) continue;
          nr += detailR[next];
          ng += detailG[next];
          nb += detailB[next];
          neighbors++;
        }
        let r = detailR[cell];
        let g = detailG[cell];
        let b = detailB[cell];
        if (neighbors) {
          nr /= neighbors;
          ng /= neighbors;
          nb /= neighbors;
          const baseLum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const nearLum = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
          const amount = Math.abs(baseLum - nearLum) >= 8 ? 0.38 : 0.18;
          r = Math.max(0, Math.min(255, r + (r - nr) * amount));
          g = Math.max(0, Math.min(255, g + (g - ng) * amount));
          b = Math.max(0, Math.min(255, b + (b - nb) * amount));
          cellImportance[cell] = 1 + Math.min(2, Math.abs(baseLum - nearLum) / 42);
        }
        grid[cell] = palette[nearestPalettePosition(Math.round(r), Math.round(g), Math.round(b), Boolean(detailNeutralDark[cell]))].index;
        cellSupport[cell] = 1;
      }
    }
  }

  if (processMode === 'cartoon') {
    const snapshot = grid.slice();
    const visited = new Uint8Array(snapshot.length);
    for (let cell = 0; cell < snapshot.length; cell++) {
      const index = snapshot[cell];
      if (index < 0 || visited[cell]) continue;
      const lab = entryByIndex.get(index)?.lab;
      if (!lab || Math.hypot(lab[1], lab[2]) < 0.075) continue;
      const component = [];
      const queue = [cell];
      visited[cell] = 1;
      while (queue.length) {
        const current = queue.pop();
        const x = current % cols;
        const y = Math.floor(current / cols);
        component.push(current);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const next = ny * cols + nx;
            if (!visited[next] && snapshot[next] === index) {
              visited[next] = 1;
              queue.push(next);
            }
          }
        }
      }
      if (component.length > 2 || component.some((position) => cellSupport[position] >= 0.42)) continue;
      const neighbors = new Map();
      for (const position of component) {
        const x = position % cols;
        const y = Math.floor(position / cols);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const neighbor = snapshot[ny * cols + nx];
            if (neighbor >= 0 && neighbor !== index) neighbors.set(neighbor, (neighbors.get(neighbor) || 0) + 1);
          }
        }
      }
      let replacement = -1;
      let bestCount = 0;
      for (const [candidate, count] of neighbors) {
        if (count > bestCount || (count === bestCount && candidate < replacement)) {
          replacement = candidate;
          bestCount = count;
        }
      }
      if (bestCount >= component.length + 2) {
        for (const position of component) grid[position] = replacement;
      }
    }
  }

  const counts = new Map();
  const importanceMass = new Map();
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] >= 0) {
      counts.set(grid[i], (counts.get(grid[i]) || 0) + 1);
      importanceMass.set(grid[i], (importanceMass.get(grid[i]) || 0) + cellImportance[i]);
    }
  }
  const usedBeforeMerge = counts.size;
  const colorLab = (index) => entryByIndex.get(index).lab;
  const colorChroma = (index) => {
    const lab = colorLab(index);
    return Math.hypot(lab[1], lab[2]);
  };
  const colorIsChromatic = (index) => Boolean(paletteChromatic[palettePositionByIndex.get(index)]);
  const colorPriority = (index) => {
    const entry = entryByIndex.get(index);
    const count = counts.get(index) || 0;
    const chroma = colorChroma(index);
    const light = entry.lab[0];
    return count * (1 + 2.4 * chroma + (light < 0.3 ? 1.2 : 0) + (light > 0.9 ? 0.35 : 0)) + 0.2 * (importanceMass.get(index) || 0);
  };
  const mergeColor = (from, to) => {
    if (from === to || !counts.has(from) || !counts.has(to)) return;
    for (let i = 0; i < grid.length; i++) if (grid[i] === from) grid[i] = to;
    counts.set(to, (counts.get(to) || 0) + (counts.get(from) || 0));
    counts.delete(from);
    importanceMass.set(to, (importanceMass.get(to) || 0) + (importanceMass.get(from) || 0));
    importanceMass.delete(from);
  };

  const anchors = new Set();
  if (counts.size) {
    const active = () => Array.from(counts.keys()).sort((a, b) => a - b);
    const neutrals = active().filter((index) => !colorIsChromatic(index));
    if (neutrals.length) {
      anchors.add(neutrals.reduce((a, b) => (colorLab(a)[0] <= colorLab(b)[0] ? a : b)));
      anchors.add(neutrals.reduce((a, b) => (colorLab(a)[0] >= colorLab(b)[0] ? a : b)));
    }
    const saturated = active().filter((index) => colorIsChromatic(index)).sort((a, b) => {
      const sa = colorChroma(a) * Math.log2((counts.get(a) || 0) + 2);
      const sb = colorChroma(b) * Math.log2((counts.get(b) || 0) + 2);
      return sb - sa || a - b;
    });
    const hues = [];
    for (const index of saturated) {
      const lab = colorLab(index);
      const hue = Math.atan2(lab[2], lab[1]);
      if (hues.every((old) => Math.abs(Math.atan2(Math.sin(hue - old), Math.cos(hue - old))) > 0.55)) {
        anchors.add(index);
        hues.push(hue);
        if (hues.length === 3) break;
      }
    }
  }

  if (processMode === 'cartoon' && mergeStrength > 0) {
    const threshold = Math.max(0, Math.min(30, mergeStrength)) / 100;
    while (true) {
      const active = Array.from(counts.keys()).sort((a, b) => a - b);
      let bestPair = null;
      let bestDistance = Infinity;
      for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
          const a = active[i];
          const b = active[j];
          if (colorIsChromatic(a) !== colorIsChromatic(b)) continue;
          const distance = labDistance(colorLab(a), colorLab(b));
          if (distance >= threshold || (anchors.has(a) && anchors.has(b))) continue;
          if (distance < bestDistance - 1e-12) {
            bestDistance = distance;
            bestPair = [a, b];
          }
        }
      }
      if (!bestPair) break;
      let [a, b] = bestPair;
      let from;
      let to;
      if (anchors.has(a)) {
        from = b;
        to = a;
      } else if (anchors.has(b)) {
        from = a;
        to = b;
      } else if (colorPriority(a) <= colorPriority(b)) {
        from = a;
        to = b;
      } else {
        from = b;
        to = a;
      }
      mergeColor(from, to);
    }
  }

  const limit = Math.max(1, Math.min(Math.round(maxColors) || 1, palette.length, grid.length));
  while (counts.size > limit) {
    const active = Array.from(counts.keys()).sort((a, b) => a - b);
    let remove = -1;
    let target = -1;
    let bestLoss = Infinity;
    for (const candidate of active) {
      let nearest = -1;
      let nearestDistance = Infinity;
      for (const other of active) {
        if (other !== candidate) {
          if (colorIsChromatic(candidate) !== colorIsChromatic(other)) continue;
          const distance = labDistance(colorLab(candidate), colorLab(other));
          if (distance < nearestDistance - 1e-12 || (Math.abs(distance - nearestDistance) < 1e-12 && other < nearest)) {
            nearestDistance = distance;
            nearest = other;
          }
        }
      }
      if (nearest < 0) continue;
      const count = counts.get(candidate) || 0;
      const avgImportance = (importanceMass.get(candidate) || count) / Math.max(1, count);
      let loss = count * nearestDistance * nearestDistance * (0.7 + avgImportance);
      if (anchors.has(candidate)) loss *= 40;
      loss *= 1 + 2.2 * colorChroma(candidate);
      if (loss < bestLoss - 1e-12 || (Math.abs(loss - bestLoss) < 1e-12 && candidate < remove)) {
        bestLoss = loss;
        remove = candidate;
        target = nearest;
      }
    }
    if (remove < 0 || target < 0) break;
    mergeColor(remove, target);
  }

  const selected = Array.from(counts.keys()).sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a - b);
  let nonEmpty = 0;
  for (const value of grid) if (value >= 0) nonEmpty++;

  return {
    buffer: grid.buffer,
    cells: grid,
    selected,
    nonEmpty,
    diagnostics: {
      usedBeforeMerge,
      backgroundPixels,
      edgeArtifactPixels,
      darkThreshold,
      outlineCutoff,
      monochromeLineArt,
      smallLineArtRefinement,
      lineSourceComponents,
      lineSeparatedConflicts,
      lineUnresolvedConflicts,
      lineUnrepresentableComponents,
      lineForcedCandidatePlacements,
      mode: processMode,
    },
  };
}
