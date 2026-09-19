# Palette Format Specification

The Bead Grid Studio Palette Format is an open, JSON-based specification for defining constrained bead and craft color catalogs. It enables manufacturers, craft communities, and third-party developers to define, share, and validate custom palettes that work seamlessly with the quantization engine.

The canonical JSON Schema is published at [`schemas/palette.schema.json`](../schemas/palette.schema.json).

---

## File Structure

A palette file must be a JSON object containing the following properties:

```json
{
  "$schema": "https://zwhy149.github.io/bead-grid-studio/schemas/palette.schema.json",
  "schemaVersion": 1,
  "id": "my-brand-palette-120",
  "name": "My Brand 120-Color Standard",
  "manufacturer": "Sample Craft Co.",
  "source": "https://example.com/color-chart",
  "license": "CC-BY-4.0",
  "beadMm": 2.6,
  "anchors": {
    "white": "01",
    "black": "02",
    "transparent": "99"
  },
  "colors": [
    {
      "code": "01",
      "name": "Pure White",
      "hex": "#FFFFFF",
      "displayHex": "#FFFFFF",
      "series": "White",
      "isTransparent": false
    },
    {
      "code": "02",
      "name": "Midnight Black",
      "hex": "#000000",
      "displayHex": "#000000",
      "series": "Black",
      "isTransparent": false
    }
  ]
}
```

---

## Field Reference

### Top-level Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `schemaVersion` | `integer` | **Yes** | Version of the schema format (currently `1`). |
| `id` | `string` | **Yes** | Alphanumeric slug uniquely identifying the palette (lowercase, hyphens, numbers). |
| `name` | `string` | **Yes** | Display title of the palette. |
| `manufacturer` | `string` | No | Maker or brand name. |
| `source` | `string` | No | Upstream data provenance, Git repository, or verification URL. |
| `license` | `string` | No | License under which color coordinates are distributed (e.g. `MIT`, `CC0-1.0`, `Apache-2.0`). |
| `beadMm` | `number` | No | Standard outer bead diameter in mm (e.g. `2.6` for mini beads, `5.0` for midi beads). |
| `anchors` | `object` | No | Key anchor codes: `white`, `black`, `transparent`. Used to anchor high-contrast line work and prevent slight tinting from shifting neutral ink lines. |
| `colors` | `array` | **Yes** | Ordered array of color items. |

### Color Item Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `code` | `string` | **Yes** | Alphanumeric identifier printed on bead charts and construction sheets. |
| `hex` | `string` | **Yes** | 6-digit hex color (`#RRGGBB`). |
| `name` | `string` | No | Localized or descriptive color name. |
| `displayHex`| `string` | No | Display override on canvas for translucent or extreme white colors. |
| `series` | `string` | No | Group category for shopping and sorting (e.g. Red, Blue, Neutral). |
| `isTransparent` | `boolean` | No | If `true`, the color is treated as transparent and excluded from auto-matching. |

---

## Validation & Registration in Code

Use `@bead-grid/core` to register custom palettes:

```javascript
import { createCustomPalette, registerPaletteProvider } from '@bead-grid/core';
import customData from './my-palette.json' with { type: 'json' };

// Automatically computes RGB, OKLab, and CIELAB spaces for CIEDE2000 precision matching
const provider = createCustomPalette(customData);
registerPaletteProvider(provider);
```
