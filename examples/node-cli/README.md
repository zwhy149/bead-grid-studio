# Node.js Headless Pattern Generator Example

This example demonstrates how to integrate `@bead-grid/core` into a Node.js backend, automated workflow, or CLI script to generate bead/mosaic patterns headlessly from raw image buffers.

## Prerequisites

Node.js >= 22.12.0 is required.

## Running the Example

From the root of the repository:

```bash
node examples/node-cli/index.mjs
```

## How It Works

1. Decodes an image file (using a lightweight PNG decoder or any image library like `sharp` / `jimp`).
2. Calls `generateBeadPattern(imageData, options)` from `@bead-grid/core`.
3. Selects the target palette (`mard-compatible-base-221` or a custom palette).
4. Returns an exchange-compliant pattern object containing:
   - Full 2D cell matrix
   - Summary statistics (total bead count, density, empty cells)
   - Ranked material list by required bead quantity and color codes
5. Serializes the pattern to schema-compliant JSON via `serializePattern()`.

## Code Example

```javascript
import fs from 'node:fs';
import { generateBeadPattern, getPaletteProvider } from '@bead-grid/core';

const pattern = await generateBeadPattern(imageData, {
  cols: 29,
  rows: 29,
  palette: getPaletteProvider('mard-compatible-base-221'),
  processMode: 'cartoon',
  maxColors: 16,
  whiteMode: 'auto'
});

console.log(`Total Beads: ${pattern.statistics.totalBeads}`);
console.log(pattern.statistics.colors);
```
