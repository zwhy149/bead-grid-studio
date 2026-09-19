# What Bead Grid Studio Provides

Bead Grid Studio bridges computational image processing and physical maker crafts (fuse beads, mosaics, cross-stitch, diamond painting). It provides a complete, local-first technological stack: an end-user Web/PWA application, a decoupled DOM-free quantization library (`@bead-grid/core`), open JSON schemas for patterns and palettes, a headless CLI, reproducible benchmarks, and integration examples.

---

# End-user Product

The end-user product is an open-source, local-first Web/PWA application:
- **Instant Online Access**: Runs entirely in the client browser with zero sign-up and zero installation.
- **Offline PWA**: Full offline caching via Service Worker on mobile and desktop devices.
- **Single-File Portable HTML**: A self-contained bundle (`414.5 KB`, `release/bead-grid-studio-v1.2.0.html`) that executes completely airgapped without internet access.
- **Interactive Editing Workbench**: Grid brush, eraser, color picker, rotate, mirror, undo/redo, and making assistant with single-color isolation.
- **Bilingual Interface**: 100% dictionary parity across English and Simplified Chinese.

---

# Reusable Core

The project extracts and maintains `@bead-grid/core` in `packages/core/`:
- **Currently Implemented Capabilities**:
  - Pure JavaScript ES Module with **0 runtime dependencies**.
  - Completely DOM-free: runs identically in browser main threads, Web Workers, Node.js scripts, and headless backends.
  - Perceptual color science: OKLab Euclidean distance ($\Delta E_{OK}$) and CIEDE2000 ($\Delta E_{00}$) distance matching.
  - Pinned MARD 221 color catalog and dynamic custom palette compiler (`createCustomPalette()`).
  - Full TypeScript definitions in `packages/core/index.d.ts`.
- **Potential Reuse Cases**:
  - The core engine could be reused by third-party developer tools for pixel-art downscaling, mosaic tile design, automated cross-stitch generators, robotic pick-and-place pegboard plotters, or Discord craft bots. *(Note: These represent architectural reuse potential, not claimed third-party adoptions).*

---

# Open Pattern Format

- **Specification**: Formal JSON Schema Draft-07 in `schemas/pattern.schema.json`.
- **Currently Implemented Capabilities**:
  - Standardizes the Pattern Exchange Format v1: metadata, grid dimensions, 2D cell color code matrix, and bill of materials (BOM).
  - Provides built-in programmatic validation (`validatePattern()`), serialization, and automatic migration from legacy v0 formats.
- **Ecosystem Purpose**:
  - Liberates crafters and artists from proprietary, closed binary files (`.pat`, `.dat`), allowing free exchange between independent tools.

---

# Open Palette Format

- **Specification**: Formal JSON Schema Draft-07 in `schemas/palette.schema.json`.
- **Currently Implemented Capabilities**:
  - Standardizes brand-agnostic color definitions: color code, name, hex, optional OKLab coordinates, and anchor definitions (transparent, white, black).
  - Includes sample palettes in `examples/palettes/` (`mini-starter-12.json`, `monochrome-8.json`).
  - Validated via `npm run schema:validate`.

---

# CLI

- **Executable Tool**: `bin/bead-grid.mjs` (registered in `package.json` under `"bin"` as `bead-grid`).
- **Currently Implemented Capabilities**:
  - Headless command-line quantization from local PNG files.
  - Full support for `--width`, `--height`, `--max-colors`, `--palette <file>`, and `--format <ascii|json>`.
  - Colorized 24-bit ANSI terminal rendering for immediate visual verification without a browser.

---

# Browser / Node Integration

The repository maintains fully functional, runnable developer examples in `examples/`:
- `examples/browser/`: Demonstrates loading and running `@bead-grid/core` directly in vanilla HTML via native ES Modules without build tooling.
- `examples/node/`: Minimal headless image quantization pipeline using pure Node.js.
- `examples/cli/`: Demonstrates programmatic invocation of the CLI script.
- `examples/custom-palette/`: Demonstrates dynamic creation and registration of custom color palettes.

---

# Reproducible Benchmark

- **Test Suite**: `benchmarks/run-benchmark.mjs` (`npm run benchmark`).
- **Currently Implemented Capabilities**:
  - Evaluates standard pegboard grid sizes: 16x16, 24x24, 32x32, 48x48, and 60x60 cells on reference fixture `rocket-badge.png`.
  - Captures average, minimum, and maximum latency (ms), heap memory allocation delta, total bead counts, unique colors, and SHA-256 output checksums.
  - Evaluates 3 consecutive runs to guarantee 100% bitwise determinism across executions.
  - Automatically documents results in `docs/benchmark.md` with explicit hardware disclaimer.

---

# Local-first Privacy

- **On-Device Computation**: 100% of image decoding, downsampling, color quantization, and pattern generation occurs on the user's client device.
- **Zero Remote Ingestion**: There are no backend image upload endpoints.
- **Zero Telemetry**: No analytics SDKs (Google Analytics, Mixpanel), no tracking cookies, and no user fingerprinting.
- **Auditable Security**: Documented in `docs/privacy-preserving-metrics.md`. Network inspection during usage confirms zero outbound requests.

---

# Maintenance

- **Active Maintainer Commitment**: Documented triage, issue tracking, and PR review protocol in `MAINTAINERS.md`.
- **Quality Gates**:
  - `npm run check`: Validates 166 UI DOM IDs, 221 palette colors, and documentation link integrity.
  - `npm run test:unit`: 38 unit tests covering core math, geometry, and pattern models.
  - `npm run test:determinism`: 18 golden fixture tests verifying bitwise-identical output.
  - `npm run schema:validate`: Schema and example file validity.
- **Security & Vulnerability Handling**: Public `SECURITY.md` with private vulnerability reporting enabled.
- **CI / CD**: GitHub Actions pinned to immutable commit SHAs with Node 24 runtime support.

---

# Adoption Evidence

All metrics are gathered from public GitHub REST APIs and repository data (September 2026):
- **GitHub Stars**: 175 (demonstrating technical interest from craft and pixel-art communities).
- **GitHub Forks**: 19.
- **Official Releases**: 7 (`v1.0.0` through `v1.2.0`).
- **Release Asset Downloads**: 156+ verified downloads of portable single-file HTML distributions.
- **Contributors**: 3 distinct contributors with merged pull requests.
- **Issues & PRs**: 4 open issues, 3 open PRs (all actively tracked; zero abandoned).

*(Note: In accordance with our local-first privacy commitment, we do not claim server-side MAU, DAU, or active conversion metrics).*

---

# Current Limitations

In the interest of honest, transparent open-source documentation:
1. **No NPM Registry Release Yet**: `@bead-grid/core` is packaged as an installable workspace package, but has not yet been published to the global npm registry (`npmjs.com`).
2. **Web UI Lacks Visual Palette Importer**: While `@bead-grid/core` and the CLI support custom palette JSON, the Web UI currently lacks a drag-and-drop dialog for uploading custom palette JSON files.
3. **Multi-Board Paginated Printing**: For oversized physical murals (>100x100 cells), automatic pagination across multiple 29x29 or 52x52 pegboard sheets (PDF/SVG) is still in active development.
