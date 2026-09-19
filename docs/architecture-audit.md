# Architecture Audit & Boundary Analysis

This document provides a comprehensive technical audit of the Bead Grid Studio codebase, inspecting algorithm boundaries, DOM dependencies, decoupling opportunities, and backward compatibility constraints.

---

## Key Audit Questions & Answers

### A. Where is the true "core algorithm" located?
The core conversion engine consists of four primary algorithmic stages:
1. **Geometric Fitting & Grid Math**: Grid resizing, aspect-ratio snapping, and board centering (`packages/core/src/geometry.js` / `src/core/geometry.js`).
2. **Perceptual Color Science**: RGB -> Linear sRGB -> OKLab & CIELAB conversions, and the full CIEDE2000 color delta formula (`packages/core/src/color.js`).
3. **Source Complexity & Line-Art Analysis**: Edge density variance, luminosity histogram entropy, and line-art vs photo heuristic classification (`packages/core/src/analysis.js`).
4. **Perceptual Quantization & Material Consolidation**: Spatial downsampling, dark outline protection, background auto-removal, candidate color clustering, and iterative palette reduction to `maxColors` (`packages/core/src/quantize.js`).

### B. What browser/DOM APIs were originally entangled?
In the monolithic legacy design, algorithmic logic was interwoven with:
- **`window` / `document`**: DOM element lookups (`document.getElementById`), DOM events (`pointerdown`, `keydown`, `input`), class manipulation (`classList.toggle`).
- **`HTMLCanvasElement` / `CanvasRenderingContext2D`**: Image drawing (`drawImage`), pixel extraction (`getImageData`), ruler ticks, zoom/pan transform matrices.
- **`File` / `FileReader` / `Image` / `createObjectURL`**: User file reading, blob URL allocation, image dimension discovery.
- **`Worker` / `Blob`**: Background execution via inlined stringified worker scripts (`URL.createObjectURL(new Blob([code]))`).
- **`localStorage`**: Draft persistence under `bead-grid-studio:draft:v2`.
- **`navigator.serviceWorker`**: PWA offline caching.

### C. Which parts are algorithmic logic vs. Browser Adapters?
- **Pure Algorithm**:
  - Distance metrics (CIEDE2000, OKLab Euclidean).
  - Spatial pixel area averaging and luminance weighting.
  - Dark line protection filters and white background detection.
  - Palette color quantization and greedy color-merging graph reduction.
  - Pattern statistics (density, empty cells, material counts, percentage share).
- **Browser Adapter**:
  - Converting `File` / `Blob` / `HTMLImageElement` into a raw `{ width, height, data: Uint8ClampedArray }` buffer.
  - Canvas viewport management, pinch-to-zoom, pan drag, and high-DPI scaling.
  - UI dialog rendering (Making assistant, Crop dialog, Product help, Share card).
  - Browser download triggering (`<a download>` / `showSaveFilePicker`).
  - Web Worker lifecycle management and cancellation timeouts.

### D. How much code must a third-party Node.js project duplicate today?
With the extraction of `@bead-grid/core`, **zero lines of algorithmic code** need to be duplicated. A third-party Node.js project simply imports `@bead-grid/core`:
```javascript
import { generateBeadPattern, getPaletteProvider } from '@bead-grid/core';
const pattern = await generateBeadPattern(rawPixelBuffer, { cols: 48, rows: 48 });
```
Only standard image decoding (such as `sharp`, `pngjs`, or pure Node `decodePng`) is required to supply the raw `{ width, height, data }` pixel buffer.

### E. Is the existing JSON close to a standardized Pattern Format?
Yes. The internal project save format contains `version`, `grid.cols`, `grid.rows`, `cells`, and `palette`. However, legacy versions (`v1`) stored raw indices into a 64-color palette, and lacked a formal JSON Schema, SHA metadata, or formal export validation. By publishing `schemas/pattern.schema.json` with a versioned schema (`schemaVersion: 1`), we preserve 100% backward compatibility for loading legacy project files while defining a vendor-neutral standard.

### F. Is the custom palette feature close to a standardized Palette Format?
Yes. The palette structure maps string codes (e.g. `H2`, `A14`) to hexadecimal strings (`#FFFFFF`, `#FF5733`) and localized names. Standardizing it into `schemas/palette.schema.json` formalizes the uniqueness of color codes, regex validation of `#RRGGBB` hex strings, and optional anchor assignments (`transparent`, `white`, `black`).

### G. Are current tests sufficient to guarantee safe refactoring?
The test suite now encompasses:
- Source and architecture linting (`scripts/check-source.mjs`).
- Palette provenance hash verification (`scripts/check-palette.mjs`).
- 19 mathematical unit tests covering CIEDE2000, OKLab, MARD-221 mapping, custom palette registration, and legacy pattern migration (`tests/unit/core.test.js`).
- 20 Playwright E2E browser tests covering desktop/mobile layouts, offline service worker, PNG export, and the color-by-color making assistant (`tests/e2e/`).
To ensure absolute zero regressions across edge cases, Phase 1 establishes an expanded set of Golden Fixtures (`tests/fixtures/`).

### H. Is the current engine output deterministic?
Yes. Given an identical pixel buffer and identical options (`cols`, `rows`, `processMode`, `maxColors`, `whiteMode`, `mergeStrength`), `@bead-grid/core` produces bitwise-identical cell matrices. Tie-breaking during material consolidation uses deterministic lexicographical ordering of palette codes (`a.code.localeCompare(b.code)`).

### I. Where are the highest-risk locations for behavioral shifts?
1. **Blob Worker Serialization**: In `src/app.js`, the web application runs quantization in a Web Worker created from a stringified function (`new Blob([code])`). Any closure or external module reference inside the serialized function would throw a runtime `ReferenceError`. `quantizePixels` must remain completely self-contained.
2. **Single-File Portable HTML Build**: `scripts/build-portable.mjs` bundles HTML, CSS, fonts, and scripts into a single file. Any dynamic imports or external network fetches break the portable distribution.
3. **Palette Provenance Check**: `scripts/check-palette.mjs` verifies the exact SHA-256 hash of the 221 base colors (`898BBEAC...`). The base palette order and values must never be altered.

---

# Current Architecture

```
+-------------------------------------------------------------------------+
|                           Web Application                               |
|  - HTML Shell (index.html, 166 DOM IDs, i18n data attributes)           |
|  - UI Controller (src/app.js: Canvas, gestures, making assistant)       |
|  - PWA Service Worker (public/sw.js: offline cache)                     |
|  - Portable Packager (scripts/build-portable.mjs: single HTML 406 KB)   |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Reusable Core Engine (@bead-grid/core)                 |
|  - geometry.js   Grid math, board snapping, aspect fitting              |
|  - color.js      OKLab, CIELAB, linear sRGB, CIEDE2000 distance         |
|  - palette.js    MARD 221 base catalog, custom palette compiler         |
|  - analysis.js   Complexity metrics, line-art & document detector       |
|  - quantize.js   Self-contained downsampling & material reduction       |
|  - pattern.js    Pattern data model, statistics, serialization          |
+-------------------------------------------------------------------------+
           |                                             |
           v                                             v
+-----------------------+                    +-----------------------+
|  Command-Line (CLI)   |                    | Developer Integration |
|  - bin/bead-grid.mjs  |                    | - examples/node-cli   |
|  - ANSI preview       |                    | - examples/browser    |
|  - JSON export        |                    | - examples/custom-pal |
+-----------------------+                    +-----------------------+
```

---

# Algorithm Boundaries

The boundary between pure algorithm and presentation is strictly defined:
- **Algorithm Input**: `{ width: number, height: number, data: Uint8ClampedArray | Uint8Array }` plus standard options (`cols`, `rows`, `palette`, `maxColors`, `whiteMode`, `processMode`, `mergeStrength`, `protectDark`).
- **Algorithm Output**: Canonical Pattern object containing dimensions, cell string codes, palette metadata, material counts, and density metrics.
- **Presentation Layer**: Converts Pattern cell matrix into Canvas pixels, SVG tags, printable PNG sheets, or ANSI terminal escape sequences.

---

# DOM Dependencies

The `@bead-grid/core` library contains **zero references** to:
- `window`
- `document`
- `HTMLElement` / `HTMLCanvasElement`
- `localStorage` / `sessionStorage`
- `navigator`
- `FileReader` / `Image`
- UI frameworks or DOM event listeners

All DOM and browser interactions are isolated in `src/app.js` and `examples/basic-browser/`.

---

# Reusable Components

| Component | Export Location | Reusability Scope |
| :--- | :--- | :--- |
| `generateBeadPattern()` | `@bead-grid/core` | End-to-end image-to-pattern pipeline for Node.js, CLI, Web |
| `quantizePixels()` | `@bead-grid/core` | Pure low-level downsampling, color matching, and clustering |
| `fitGeometryMetrics()` | `@bead-grid/core` | Aspect ratio preservation, board containment, and padding |
| `deltaE2000()`, `rgbToOklab()` | `@bead-grid/core` | Perceptual color science utilities |
| `createCustomPalette()` | `@bead-grid/core` | Validates, normalizes, and pre-indexes custom craft palettes |
| `createPattern()`, `serializePattern()`, `parsePattern()` | `@bead-grid/core` | Standard pattern exchange serialization & migration |

---

# Refactoring Risks

1. **Floating-point color distance consistency**: OKLab and CIEDE2000 involve trigonometric and power functions. Node.js V8 and browser JavaScript engines must produce identical integer color indices.
2. **Worker serialization integrity**: `quantizePixels.toString()` is used to construct Blob Web Workers. It must not reference outer module scope variables.
3. **Strict Source Checks**: `scripts/check-source.mjs` strictly checks import paths (e.g. `from './core/geometry.js'`), exact function signatures, and banned legacy words. Any refactor must respect these gate rules.

---

# Compatibility Constraints

1. **Web App & PWA Integrity**: 100% feature preservation for existing desktop and mobile users.
2. **Offline Single-File Bundle**: Must continue to compile cleanly to `release/bead-grid-studio-v1.2.0.html` (~406 KB) with embedded licenses and zero external network scripts.
3. **Zero Telemetry Guarantee**: No remote image uploads, analytics trackers, or third-party cookies.
4. **Project File Compatibility**: Project files created in earlier versions (`v1` and `v2`) must load and parse without error.

---

# Recommended Target Architecture

- Maintain `@bead-grid/core` as the single canonical algorithmic engine.
- Establish comprehensive Golden Regression Fixtures in `tests/fixtures/` covering all 8 specified visual profiles.
- Formally support `schemas/` for automated JSON Schema validation.
- Provide deterministic benchmark runs across grid sizes `16, 24, 32, 48, 60`.
- Document local-first aggregate telemetry architecture in `docs/privacy-preserving-metrics.md` without deploying tracking code.
- Publish `docs/oss-application-facts.md` and `docs/oss-application-draft.md` containing verifiable evidence.
