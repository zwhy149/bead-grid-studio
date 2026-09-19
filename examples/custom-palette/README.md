# Custom Palette Integration Example

This example demonstrates how to create, register, and quantize patterns using custom bead/mosaic color palettes conforming to `schema/palette.schema.json`.

## Running the Example

```bash
node examples/custom-palette/index.mjs
```

## How Custom Palettes Work

1. **In-Memory Creation**: Use `createCustomPalette({ id, name, colors, anchors })` to create a palette instance. `@bead-grid/core` will automatically precompute:
   - RGB 8-bit components
   - OKLab perceptual coordinates
   - CIELAB coordinates for CIEDE2000 color matching
2. **Registry Integration**: Call `registerPaletteProvider(palette)` to make your palette globally accessible by ID across your application.
3. **JSON Palette Files**: External JSON files validated against `schema/palette.schema.json` can be loaded directly with `JSON.parse` and passed to `createCustomPalette`.

## Example Snippet

```javascript
import { createCustomPalette, generateBeadPattern } from '@bead-grid/core';

const myPalette = createCustomPalette({
  id: 'my-craft-kit-8',
  name: 'My Craft Kit 8',
  colors: [
    { code: 'C1', name: 'Coral Red', hex: '#FF5733' },
    { code: 'C2', name: 'Teal Blue', hex: '#20B2AA' },
    { code: 'C3', name: 'Mustard', hex: '#E1AD01' },
    { code: 'C4', name: 'White', hex: '#FFFFFF' },
    { code: 'C5', name: 'Black', hex: '#000000' }
  ]
});

const pattern = await generateBeadPattern(imageData, {
  cols: 29,
  rows: 29,
  palette: myPalette
});
```
