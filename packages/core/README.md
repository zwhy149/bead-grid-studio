# @bead-grid/core

> Deterministic, runtime-agnostic image-to-grid quantization and constrained palette matching engine.

`@bead-grid/core` is the pure algorithmic heart of [Bead Grid Studio](https://github.com/zwhy149/bead-grid-studio). It transforms continuous photographic or graphic images into discrete, constrained-palette grid patterns suitable for fuse beads, pixel art, cross-stitch, and mosaic crafts.

---

## Key Capabilities

- **Zero DOM / UI Dependencies**: Runs anywhere modern JavaScript runs — Node.js, Cloudflare Workers, Electron, Browser main thread, or Web Workers.
- **High-Precision Color Matching**: Two-stage matching using **OKLab rough filtering** combined with **CIEDE2000 precision color distance** for perceptually accurate color reproduction.
- **Line Art & Feature Preservation**: Component-ownership skeletonization preserves thin outlines and small facial features (eyes, nose) at low resolutions without line blurring.
- **Adaptive Background Extraction**: Otsu thresholding with boundary-connected flood-fill distinguishes subject white areas from outer transparent space.
- **Material Budgeting**: Intelligent color clustering minimizes required physical bead colors while preserving critical contrast and highlight anchors.
- **Open Exchange Formats**: Native serialization conforming to versioned [JSON Schemas](../../schemas/).

---

## Installation

```bash
# When installed from npm (or locally linked within the monorepo):
npm install @bead-grid/core
```

---

## Usage Examples

### 1. High-Level One-Step Pipeline in Node.js

```javascript
import fs from 'node:fs';
import { generateBeadPattern } from '@bead-grid/core';
import { decodePng } from './png-helper.js';

// Read image into raw RGBA buffer: { data: Uint8ClampedArray, width, height }
const imageData = decodePng(fs.readFileSync('input.png'));

// Generate structured pattern
const pattern = await generateBeadPattern(imageData, {
  cols: 48,
  rows: 48,
  maxColors: 24,
  processMode: 'cartoon', // 'cartoon' | 'detail' | 'document' | 'photo' | 'pixel'
  whiteMode: 'auto',      // 'auto' removes outer white background
  mergeStrength: 10,
  protectDark: true,
  title: 'My Bead Creation',
});

console.log(`Pattern generated: ${pattern.statistics.totalBeads} beads, ${pattern.statistics.usedColors} colors.`);
console.log('Bead counts:', pattern.statistics.beadCounts);
```

### 2. Browser Usage (Direct Module Import)

```html
<script type="module">
  import { generateBeadPattern } from './packages/core/src/index.js';

  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const pattern = await generateBeadPattern(imageData, {
    cols: 32,
    rows: 32,
    maxColors: 16,
  });

  console.log('Pattern cells:', pattern.grid.cells);
</script>
```

### 3. Custom Palette Definition & Matching

```javascript
import { createCustomPalette, registerPaletteProvider, generateBeadPattern } from '@bead-grid/core';

// Define your own brand or mini palette
const myPalette = createCustomPalette({
  id: 'starter-primary',
  name: 'Primary Colors Starter Set',
  colors: [
    { code: 'W1', hex: '#FFFFFF', name: 'White', series: 'Neutral' },
    { code: 'K1', hex: '#000000', name: 'Black', series: 'Neutral' },
    { code: 'R1', hex: '#E7002F', name: 'Bright Red', series: 'Red' },
    { code: 'Y1', hex: '#FBED56', name: 'Vibrant Yellow', series: 'Yellow' },
    { code: 'B1', hex: '#0F54C0', name: 'Ocean Blue', series: 'Blue' },
    { code: 'G1', hex: '#35E352', name: 'Leaf Green', series: 'Green' },
  ],
  anchors: { white: 'W1', black: 'K1' },
});

registerPaletteProvider(myPalette);

const pattern = await generateBeadPattern(imageData, {
  cols: 24,
  rows: 24,
  palette: 'starter-primary',
});
```

### 4. Low-Level Quantization (`quantizePixels`)

If you want direct control over raw Int16Array cell index buffers:

```javascript
import { quantizePixels, getPaletteProvider } from '@bead-grid/core';

const palette = getPaletteProvider('mard-compatible-base-221').colors;

const result = quantizePixels({
  data: rawRgbaBuffer,
  width: 512,
  height: 512,
  cols: 40,
  rows: 40,
  palette,
  maxColors: 20,
  processMode: 'detail',
});

// result.cells is an Int16Array of palette indices (-1 for empty)
console.log('Filled cells count:', result.nonEmpty);
console.log('Selected color indices:', result.selected);
```

### 5. Material & Bead Count Analysis

```javascript
import { analyzePattern, getPaletteProvider } from '@bead-grid/core';

const stats = analyzePattern(pattern.grid.cells, getPaletteProvider().colors);

console.log(`Total Beads: ${stats.totalBeads}`);
console.log(`Empty Cells: ${stats.emptyCells}`);
for (const item of stats.colors) {
  console.log(`  ${item.code} (${item.name}): ${item.count} beads (${(item.share * 100).toFixed(1)}%)`);
}
```

### 6. Aspect-Ratio & Physical Board Geometry

```javascript
import { fitPatternInsideBoard, gridForLongSide } from '@bead-grid/core';

// Fit a 1920x1080 landscape image into a 52x52 pegboard without distortion
const placement = fitPatternInsideBoard(1920, 1080, 52, 52);
console.log(`Pattern dimensions: ${placement.cols}x${placement.rows}`);
console.log(`Centered offsets: X=${placement.offsetX}, Y=${placement.offsetY}`);
console.log(`Blank border rows: top=${placement.blankTop}, bottom=${placement.blankBottom}`);
```

### 7. Serialization and Exchange

```javascript
import { parsePattern, serializePattern } from '@bead-grid/core';

// Export to JSON string
const jsonString = serializePattern(pattern, 2);

// Re-import and validate (with automatic v1 legacy migration)
const reloadedPattern = parsePattern(jsonString);
```

---

## License

Apache-2.0
