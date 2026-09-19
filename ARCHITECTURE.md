# Bead Grid Studio Architecture

Bead Grid Studio is an open-source, local-first image gridding and fuse-bead pattern generation engine. It bridges digital pixel artwork and physical fabrication (fuse beads, mosaics, embroidery, diamond painting) through zero-dependency, runtime-agnostic computation and open standard schemas.

---

## 1. High-Level Architecture Overview

The system is decoupled into presentation layers (Web UI, CLI, Test Harness), asynchronous runtime adapters, a shared DOM-free core engine (`@bead-grid/core`), and standard data formats.

```
+-------------------------------------------------------------------------+
|                           User Entrypoints                              |
|                                                                         |
|  +----------------------------+             +------------------------+  |
|  | Modern Web UI / PWA /      |             | Headless Node CLI      |  |
|  | Portable Single-File HTML  |             | (bin/bead-grid.mjs)    |  |
|  +--------------+-------------+             +-----------+------------+  |
+-----------------|---------------------------------------|---------------+
                  |                                       |
                  v                                       v
+-----------------+-------------+             +-----------+------------+
| Execution Adapters            |             | Node Script / Pipeline |
|                               |             | (fs, pure-image/png)   |
|  +-------------------------+  |             +-----------+------------+
|  | WebWorkerRunner (Blob)  |  |                         |
|  +------------+------------+  |                         |
|  | InlineRunner (Fallback) |  |                         |
|  +------------+------------+  |                         |
+---------------|---------------+                         |
                |                                         |
                +--------------------+--------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                         @bead-grid/core                                 |
|                                                                         |
|  +-----------------------+     +-----------------------+                |
|  | geometry.js           |     | color.js              |                |
|  | - aspect ratio fit    |     | - sRGB / Linear sRGB  |                |
|  | - bounding box / grid |     | - OKLab / CIELAB      |                |
|  | - board tiling        |     | - CIEDE2000 distance  |                |
|  +-----------+-----------+     +-----------+-----------+                |
|              |                             |                            |
|              v                             v                            |
|  +-----------------------+     +-----------------------+                |
|  | analysis.js           |     | palette.js            |                |
|  | - edge density        |     | - MARD 221 base catalog|               |
|  | - entropy calculation |     | - transparent anchor  |                |
|  | - line-art detection  |     | - createCustomPalette |                |
|  +-----------+-----------+     +-----------+-----------+                |
|              \                             /                            |
|               \                           /                             |
|                v                         v                              |
|  +-----------------------------------------------------+                |
|  | quantize.js                                         |                |
|  | - deterministic pixel quantization                  |                |
|  | - perceptual nearest-color matching                 |                |
|  | - palette restriction & color merging               |                |
|  | - background flood fill                             |                |
|  +--------------------------+--------------------------+                |
|                             |                                           |
|                             v                                           |
|  +-----------------------------------------------------+                |
|  | pattern.js                                          |                |
|  | - PatternExchangeFormat v1 data model               |                |
|  | - bill-of-materials calculation                     |                |
|  | - validatePattern() / serializePattern()            |                |
|  | - legacy migration (v0 -> v1)                       |                |
|  +-----------------------------------------------------+                |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                         Outputs & Schemas                               |
|                                                                         |
|  +-----------------------+     +-----------------------+                |
|  | Open JSON Schemas     |     | Rendering & Export    |                |
|  | - pattern.schema.json |     | - Canvas / ANSI ASCII |                |
|  | - palette.schema.json |     | - Printable Sheet SVG |                |
|  |                       |     | - CSV BOM / Project   |                |
|  +-----------------------+     +-----------------------+                |
+-------------------------------------------------------------------------+
```

---

## 2. Core Architectural Principles

### 2.1 Runtime Agnostic & Zero Dependencies
- `@bead-grid/core` has **0 runtime dependencies**.
- It does not reference `window`, `document`, `HTMLCanvasElement`, `localStorage`, or Node-specific built-ins (`fs`, `path`).
- Inputs are plain TypedArrays (`Uint8ClampedArray` or `Uint8Array` of RGBA pixels) alongside dimensions and configuration objects.
- It runs identically inside:
  - Main browser thread
  - Browser Web Workers (via inline Blob or bundled script)
  - Headless Node.js CLI / backend services
  - Deno, Bun, or Cloudflare Workers.

### 2.2 100% Deterministic & Bitwise Reproducible
- For any given input image buffer and option set, the quantization output is bitwise identical across executions and environments.
- Color distances use exact floating-point formulas in OKLab and CIEDE2000 spaces.
- Tied color distances resolve deterministically by palette catalog order.
- Verified by automated determinism tests over 3 consecutive runs (`tests/unit/golden.test.js`).

### 2.3 Strict Local-First Privacy
- **Zero Server Upload**: Image pixels, custom palettes, and generated patterns remain exclusively in client memory.
- **Zero Telemetry**: No tracking cookies, Google Analytics, or third-party behavioral scripts.
- **Auditable**: Network activity during image import, parameter adjustments, and pattern export contains zero outbound requests.

---

## 3. Package Structure & Module Responsibilities

```
bead-grid-studio/
├── packages/
│   └── core/                     # @bead-grid/core (NPM package ready)
│       ├── index.d.ts            # Full TypeScript definitions
│       ├── package.json          # "type": "module", exports map
│       ├── README.md             # Integration guide
│       └── src/
│           ├── index.js          # Unified high-level API entrypoint
│           ├── geometry.js       # Grid boundaries, aspect ratios, fit logic
│           ├── color.js          # OKLab, CIELAB, CIEDE2000, hex converters
│           ├── palette.js        # MARD 221 palette, anchors, custom compiler
│           ├── analysis.js       # Image complexity, edge density, line-art
│           ├── quantize.js       # Core quantization pipeline
│           └── pattern.js        # Pattern v1 data model & validation
├── schemas/                      # Formal JSON Schema definitions (JSON Schema 2020-12)
│   ├── palette.schema.json       # Palette exchange specification
│   └── pattern.schema.json       # Pattern exchange specification
├── bin/
│   └── bead-grid.mjs             # Headless CLI executable
├── examples/
│   ├── browser/                  # Native browser ES module integration
│   ├── cli/                      # Headless CLI demo
│   └── node/                     # Node.js backend pipeline example
├── src/                          # Web Application
│   ├── app.js                    # Web UI controller, state, canvas rendering
│   ├── i18n.js                   # Bilingual dictionary (zh-CN & en)
│   └── core/                     # Compatibility adapters linking to packages/core
└── tests/
    ├── fixtures/                 # Golden PNG fixtures
    └── unit/                     # Node.js native unit & golden tests
```

---

## 4. Key Subsystems

### 4.1 Color Space Pipeline (`color.js`)
Color quantization operates in perceptually uniform color spaces rather than naive RGB Euclidean distance:
1. **sRGB -> Linear sRGB**: Gamma decompression (V_linear = ((V + 0.055) / 1.055)^2.4).
2. **Linear sRGB -> OKLab**: M1 matrix transformation into cone responses, cube-root compression, and M2 matrix transformation into (L, a, b).
3. **Perceptual Distance Metric**:
   - Primary: OKLab Euclidean delta_E = sqrt(delta_L^2 + delta_a^2 + delta_b^2).
   - CIELAB / CIEDE2000: Full k_L S_L, k_C S_C, k_H S_H compensation with rotation term R_T for deep blue/violet shifts.

### 4.2 Grid Adaptation & Geometry (`geometry.js`)
Handles physical pegboard constraints:
- Computes optimal integer cell grids preserving input aspect ratios.
- Provides `contain` (empty margin padding) and `cover` (minimal cropping) modes.
- Centers patterns precisely on standard multi-board pegboards (e.g., 29x29, 52x52).

### 4.3 Pattern Exchange Format (`pattern.js` & `pattern.schema.json`)
Patterns are serialized into a standardized, human-readable, schema-valid JSON structure:
- `version`: `1`
- `metadata`: title, dimensions, board type, createdAt, license
- `palette`: palette ID, color mapping dictionary (code -> hex, name)
- `cells`: row-major 2D array of palette color codes (or `null` / empty for transparent)
- `materials`: aggregated bill of materials with bead counts and percentages.

---

## 5. Verification & Quality Gates

The architecture is safeguarded by a multi-layered verification strategy:

1. **Source & ID Integrity Gate** (`npm run check`):
   - Validates that all critical UI DOM IDs (166 IDs) and color codes (221 colors) are present and untampered.
   - Enforces absence of prohibited legacy strings.
2. **Unit & Determinism Suite** (`npm run test:unit`, `npm run test:determinism`):
   - Tests core math, quantization accuracy, schema validation, and 3-run bitwise determinism across 8 golden fixtures.
3. **Performance Benchmark Suite** (`npm run benchmark`):
   - Measures latency and memory delta across standard sizes (16, 24, 32, 48, 60 cells).
4. **End-to-End Browser Automation** (`npm run test:e2e:ci`):
   - Tests file upload, slider interaction, palette switching, export generation, and mobile viewport layouts.
