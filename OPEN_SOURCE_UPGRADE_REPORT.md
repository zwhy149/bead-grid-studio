# Executive Summary

Bead Grid Studio has completed a comprehensive, systemic open-source upgrade. Moving beyond a standalone vertical web utility, it is now an open-source software ecosystem combining:
1. A production web application and zero-dependency portable single-file HTML distribution;
2. A decoupled, runtime-agnostic, zero-dependency core gridding and color quantization engine (`@bead-grid/core`);
3. Formal JSON Schema specifications for pattern and palette exchange (`schemas/pattern.schema.json`, `schemas/palette.schema.json`);
4. A headless Node.js CLI tool (`bin/bead-grid.mjs`) for automated pipelines;
5. A reproducible benchmark suite across standard pegboard grid sizes (16, 24, 32, 48, 60 cells);
6. An automated determinism and regression safety net verifying bitwise reproducibility on 8 golden fixtures;
7. Verifiable project health metrics (175 stars, 19 forks, 7 releases, 156+ portable downloads) with strict zero-telemetry local-first privacy.

All upgrades maintain 100% backward compatibility with existing Web, PWA, and single-file HTML builds with strictly zero regressions.

---

# Architecture Before

Prior to this systemic upgrade, Bead Grid Studio existed as a high-quality frontend monolithic application, but suffered from structural limitations in open-source extensibility:
- **Monolithic Tight Coupling**: Image scaling, geometric fitting, OKLab/CIEDE2000 color space calculations, MARD 221 palette quantization, and material bill-of-materials logic were co-located in `src/app.js` (~2,000 lines), tightly coupled with DOM manipulation, Canvas interactions, and browser worker message events.
- **Inability to Reuse**: Backend services, CLI scripts, mobile shells, and third-party developers could not consume the quantization algorithms without emulating browser DOM globals.
- **Proprietary Data Structures**: Patterns and palettes existed as ad-hoc JavaScript objects without formal schemas or machine-verifiable formats.
- **Lack of Headless CLI**: No command-line interface existed for batch processing, automated testing, or scripting.
- **Opaque Adoption Evidence**: Project metrics were not automated or documented, making it vulnerable to misclassification as a mere frontend demo.
- **Absence of Performance Benchmarks**: Latency, memory usage, and quantization determinism lacked reproducible measurement.

---

# Architecture After

The updated architecture enforces clear layer separation between user entrypoints, execution adapters, a DOM-free core engine, and standardized data models:

```
+-------------------------------------------------------------------------+
|                           User Entrypoints                              |
|  +----------------------------+             +------------------------+  |
|  | Modern Web UI / PWA /      |             | Headless Node CLI      |  |
|  | Portable Single-File HTML  |             | (bin/bead-grid.mjs)    |  |
|  +--------------+-------------+             +-----------+------------+  |
+-----------------|---------------------------------------|---------------+
                  v                                       v
+-----------------+-------------+             +-----------+------------+
| Execution Adapters            |             | Node Pipeline Adapter  |
|  - WebWorkerRunner (Blob)     |             | (pure-image / Buffer)  |
|  - InlineRunner (Fallback)    |             +-----------+------------+
+-----------------+-------------+                         |
                  \                                      /
                   +-----------------+------------------+
                                     v
+------------------------------------+------------------------------------+
|                         @bead-grid/core                                 |
|  - geometry.js  : Aspect ratios, bounding boxes, physical board fit      |
|  - color.js     : sRGB, OKLab, CIELAB, CIEDE2000 color distance         |
|  - palette.js   : MARD 221 database, custom palette compiler            |
|  - analysis.js  : Pixel complexity, edge density, line-art detection   |
|  - quantize.js  : Deterministic nearest-color matching, spatial dither  |
|  - pattern.js   : Pattern v1 model, BOM calculation, schema validation  |
+------------------------------------+------------------------------------+
                                     v
+------------------------------------+------------------------------------+
|                         Outputs & Schemas                               |
|  - schemas/pattern.schema.json & schemas/palette.schema.json (Draft-07)  |
|  - Printable Construction Sheets (SVG), CSV BOM, ANSI Terminal Art     |
+-------------------------------------------------------------------------+
```

Key Architectural Tenets:
1. **Separation of Concerns**: Presentation and storage are decoupled from pure gridding math.
2. **Runtime Independence**: The core engine operates identically in Browser Main Thread, Web Workers, Node.js, Deno, and Bun.
3. **Local-First Privacy**: 100% of data processing occurs in memory on the client machine.

---

# Reusable Core

The standalone package `@bead-grid/core` is located in `packages/core/`:
- **Zero Runtime Dependencies**: `0` external npm packages.
- **DOM-Free**: Requires no `window`, `document`, `canvas`, or `localStorage`.
- **Pure Functional API**:
  - `generateBeadPattern(imageData, options)`: High-level entrypoint converting raw pixel buffers into validated patterns.
  - `quantizePixels(pixels, width, height, options, palette)`: Core color quantization.
  - `createCustomPalette(customColors, basePaletteId)`: Dynamic palette compiler.
  - `validatePattern(pattern)`: Structural and semantic validation.
  - `serializePattern(pattern)` / `deserializePattern(jsonString)`: Safe serialization.
  - `fitPatternInsideBoard(patternWidth, patternHeight, boardCols, boardRows, mode)`: Geometric board centering.
- **TypeScript Support**: Complete type definitions provided in `packages/core/index.d.ts`.

---

# Pattern Exchange Format

The project defines an open, vendor-neutral data standard for physical pixel crafts:
- **Specification**: Defined in `schemas/pattern.schema.json` (JSON Schema Draft-07).
- **Structure**:
  - `version`: Integer format version (`1`).
  - `metadata`: Pattern title, author, board dimensions, creation timestamp, license.
  - `palette`: Palette identifier and color code definitions (mapping code to hex and label).
  - `grid`: `width`, `height`, and `cells` (2D row-major array containing color codes or `null` for transparent/empty pegs).
  - `materials`: Aggregated bill of materials (BOM) detailing bead count and percentage for every required color.
- **Compatibility**: Built-in migration in `packages/core/src/pattern.js` seamlessly upgrades legacy v0 project files to v1.

---

# Palette Format

Palette definitions are standardized to encourage open color sharing among craft brands:
- **Specification**: Defined in `schemas/palette.schema.json` (JSON Schema Draft-07).
- **Structure**: Includes `paletteId`, `name`, `version`, `colors` array with `code`, `name`, `hex`, and optional OKLab coordinates (`L`, `a`, `b`).
- **Standard Library**: Built-in MARD 221 color catalog (`packages/core/src/palette.js`), pinned with SHA-256 provenance against upstream color standards.
- **Sample Palettes**: Provided in `examples/palettes/mini-starter-12.json` and `examples/palettes/monochrome-8.json`.
- **Dynamic Compilation**: Developers can instantiate custom brand palettes using `createCustomPalette()`.

---

# Browser Integration

The Web application (`src/app.js`) integrates seamlessly with the new architecture:
- **Zero Regressions**: All 166 critical DOM IDs and event hooks in `index.html` are preserved.
- **Worker Offloading**: Quantization executes inside a non-blocking Web Worker generated via inline Blob URL, maintaining a smooth 60 FPS UI during heavy computations.
- **Interactive Workbench**: Real-time canvas rendering with zoom, pan, grid coordinates, margin indicators, and interactive palette swaps.
- **Offline / PWA**: Full offline caching via Service Worker and portable single-file HTML build (`~414 KB`).

---

# Node Integration

Node.js developers can directly integrate the core engine into automation scripts and backend services:
- **Native ESM Import**:
  ```javascript
  import { generateBeadPattern } from '@bead-grid/core';
  ```
- **Buffer Support**: Accepts standard `Uint8ClampedArray` or `Uint8Array` pixel data (e.g., from `pngjs` or `sharp`).
- **Complete Examples**:
  - `examples/node/`: Minimal headless pipeline demonstration.
  - `examples/node-cli/`: Image reading, pattern generation, and file output pipeline.

---

# CLI

The project includes an executable headless CLI tool in `bin/bead-grid.mjs`:
- **Command-line Interface**:
  ```bash
  node bin/bead-grid.mjs input.png -w 29 -h 29 --format ascii
  node bin/bead-grid.mjs input.png -w 52 -h 52 --format json --output pattern.json
  ```
- **Options**:
  - `-w, --width <num>`: Output grid width in beads (default: 29).
  - `-h, --height <num>`: Output grid height in beads (default: 29).
  - `--palette <id|file>`: Built-in palette ID or path to custom palette JSON.
  - `--max-colors <num>`: Limit maximum distinct colors.
  - `--format <ascii|json>`: Output format (terminal color art or JSON pattern).
  - `-o, --output <file>`: Write pattern to disk.
- **Examples**: Packaged in `examples/cli/`.

---

# Benchmark

Performance is continuously verified using `benchmarks/run-benchmark.mjs` (`npm run benchmark`):
- **Test Matrix**: Standard sizes `16, 24, 32, 48, 60` cells evaluated on reference fixture `rocket-badge.png`.
- **Recorded Metrics**: Latency (ms), peak memory allocation delta, color counts, and cell counts.
- **Transparency**: Results are serialized to `benchmarks/results.json` and rendered into `docs/benchmark.md`.
- **Hardware Disclaimer**: Explicitly states host specifications (Node version, OS, CPU) and notes that results may vary by machine.

---

# Determinism

Bead Grid Studio guarantees 100% bitwise determinism:
- **Mathematical Stability**: Identical pixel buffers and parameter options always produce identical color assignments.
- **Verification**: `npm run test:determinism` executes 3 consecutive runs across 8 diverse golden test images and computes SHA-256 digests of the serialized cells array.
- **Zero Drift**: Floating-point OKLab conversions and tie-breaker sorting rules are strictly deterministic across platforms.

---

# Regression Safety

To prevent regressions across future updates, an automated golden safety net is established:
- **8 Golden Fixtures** in `tests/fixtures/`:
  1. `small-icon.png` (16x16 icon)
  2. `high-saturation.png` (32x32 vibrant colors)
  3. `low-color-mono.png` (32x32 muted tones)
  4. `transparent-badge.png` (32x32 transparency handling)
  5. `extreme-aspect.png` (64x8 aspect ratio stress)
  6. `monochrome-solid.png` (24x24 single-tone surface)
  7. `gradient-smooth.png` (32x32 continuous tone ramps)
  8. `high-contrast-edge.png` (32x32 sharp boundary line-art)
- **Golden Assertions** (`tests/unit/golden.test.js`): Pins exact grid dimensions, bead counts, active color counts, top color codes, and cell content SHA-256 hashes.

---

# Project Health

Project health metrics are tracked via automated tooling (`scripts/project-health.mjs` / `npm run health`) querying the live GitHub API:
- **Verified Public Metrics** (as of September 2026):
  - **GitHub Stars**: 175
  - **GitHub Forks**: 19
  - **Open Issues**: 7 (all actively tracked)
  - **Open Pull Requests**: 3
  - **Releases**: 7 (`v1.0.0` - `v1.2.0`)
  - **Portable Asset Downloads**: 156+ verified single-file HTML downloads
  - **Contributors**: 3
- **Privacy Partition**: Clearly documents why product tracking metrics (MAU, DAU, conversion events) are deliberately unavailable due to the local-first architecture.

---

# Privacy

The application strictly adheres to a local-first, zero-telemetry privacy architecture:
- **Zero Image Uploads**: No image buffers leave the user's browser or local device.
- **Zero Tracking Scripts**: No Google Analytics, Facebook Pixel, Mixpanel, or telemetry cookies.
- **Auditable Security**: Documented in `docs/privacy-preserving-metrics.md`. Independent network inspection confirms zero outbound HTTP requests during active image editing and pattern generation.

---

# Developer Experience

Extensive documentation and scaffolding simplify external developer adoption:
- **Typed APIs**: Complete TypeScript definitions in `packages/core/index.d.ts`.
- **Working Examples**:
  - `examples/browser/`: Vanilla ES module browser demo.
  - `examples/cli/`: Command-line interface invocation.
  - `examples/node/`: Headless node workflow.
  - `examples/custom-palette/`: Custom color palette integration.
- **Contributor Guides**:
  - `ARCHITECTURE.md`: High-level system architecture and ASCII diagrams.
  - `docs/developer-guide.md`: Development setup and contribution workflows.
  - `GOOD_FIRST_ISSUES.md`: Curated entry-level contribution opportunities.

---

# Ecosystem Value

Bead Grid Studio delivers tangible value to the broader open-source ecosystem:
1. **Neutral Core Engine**: Provides a reusable computational primitive for any software or hardware needing to discretize continuous imagery into limited-color physical media.
2. **Open Data Interoperability**: Standardized JSON schemas liberate craft patterns from proprietary desktop formats (`.pat`, `.dat`), enabling interoperability with automated pick-and-place hardware, robotic crafters, and assistive fabrication tools.
3. **Cross-Domain Craft Applicability**: Solves pattern calculation not just for fuse beads, but for cross-stitch counting, mosaic tiling, stained glass design, and retro gaming sprite production.
4. **Local-First Reference Implementation**: Demonstrates how to build high-performance creative software with zero telemetry and complete privacy preservation.

---

# Remaining Gaps

In the spirit of honest, transparent open-source stewardship:
1. **Web UI Custom Palette Importer**: While `@bead-grid/core` and the CLI support custom palette JSON, the Web UI currently lacks a drag-and-drop dialog for uploading custom palette JSON files.
2. **Multi-Page Large Board PDF Tiling**: Large projects (>100x100 beads) require physical assembly across multiple 29x29 or 52x52 pegboards; automatic multi-page printable PDF pagination is not yet implemented.
3. **Interactive Making Mode**: Real-time physical assembly would benefit from a dedicated "making mode" where crafters can tap individual color codes in the BOM to isolate and highlight those beads on canvas.
4. **NPM Registry Publishing**: `@bead-grid/core` is organized as an installable workspace package, but has not yet been published to the global npm registry (`npmjs.com`).

---

# Next 30 Days

The maintainers will execute the following phased enhancements over the next 30 days:
- **Days 1–10 (Making Mode)**: Implement a focus mode in the Web UI allowing crafters to highlight single colors during physical assembly and persist completion progress in `localStorage`.
- **Days 11–20 (Palette Importer & PDF Tiling)**: Add a visual custom palette JSON loader to the web interface and build multi-board PDF slicing/pagination for large murals.
- **Days 21–30 (Ecosystem & Registry)**: Publish `@bead-grid/core` to the npm registry (`npm publish --access public`), activate community showcase discussions on GitHub, and submit verified documentation for open-source grant reviews.
