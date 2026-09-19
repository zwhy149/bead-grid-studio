# Open Source Grant & Ecosystem Application Facts

This document contains strictly factual, verifiable data points for open-source grant applications, funding reviews, and ecosystem audits. All metrics are verifiable via the GitHub API, project repository, or test suites as of September 2026.

---

## 1. Repository & Ownership

- **Repository**: `https://github.com/zwhy149/bead-grid-studio`
- **Primary Maintainer**: `zwhy149`
- **License**: Apache-2.0 (permissive open-source license)
- **Production URL**: `https://zwhy149.github.io/bead-grid-studio/`
- **Primary Language**: JavaScript / Node.js (ES Modules, TypeScript definitions provided)

---

## 2. Public GitHub Metrics (Verified via API)

- **GitHub Stars**: 175
- **GitHub Forks**: 19
- **Open Issues**: 7 (all actively tracked; zero abandoned)
- **Open Pull Requests**: 3
- **Contributors**: 3
- **Official Releases**: 7 published releases (`v1.0.0` through `v1.2.0`)
- **Release Asset Downloads**: 156+ total downloads of the portable single-file HTML bundle (`release/bead-grid-studio-v*.html`)
- **Release Breakdown**:
  - `v1.2.0`: 78 downloads
  - `v1.1.3`: 12 downloads
  - `v1.1.1`: 18 downloads
  - `v1.1.0`: 5 downloads
  - `v1.0.2`: 9 downloads
  - `v1.0.1`: 18 downloads
  - `v1.0.0`: 16 downloads

---

## 3. Architecture & Technical Contributions

- **Decoupled Core Engine (`@bead-grid/core`)**:
  - Located in `packages/core/`
  - Zero runtime dependencies (`0` external packages)
  - DOM-free and runtime-agnostic: executes in Browser main thread, Web Workers, Node.js CLI, Deno, and Bun
  - Full TypeScript declarations (`index.d.ts`)
- **Color Matching Precision**:
  - Perceptual color distance in OKLab space ($\Delta E_{OK}$) and CIEDE2000 ($\Delta E_{00}$)
  - Full gamma correction ($sRGB \leftrightarrow Linear\ sRGB$)
- **Formal Data Standards**:
  - `schemas/palette.schema.json` (JSON Schema Draft-07): standardized palette specification
  - `schemas/pattern.schema.json` (JSON Schema Draft-07): standardized pattern exchange format v1
- **Headless CLI**:
  - `bin/bead-grid.mjs`: CLI tool supporting batch quantization, custom palettes, ANSI previews, and JSON export
- **Portable Distribution**:
  - Zero-dependency single-file HTML distribution (`~414 KB`), enabling complete offline execution without server infrastructure

---

## 4. Testing, Determinism & Benchmarks

- **Unit Test Suite**: 38 tests passing (`npm run test:unit`)
- **Determinism Suite**: 18 tests passing (`npm run test:determinism`), asserting bitwise-identical SHA-256 pattern outputs across 3 consecutive runs on 8 golden fixtures
- **Golden Fixtures**: 8 diverse test images covering edge cases (aspect ratio extremes, high saturation, transparency, monochrome, high contrast edges, smooth gradients)
- **Performance Benchmark**: Standardized benchmark suite (`npm run benchmark`) evaluating grid sizes 16, 24, 32, 48, and 60 cells on reference inputs, tracking latency (ms) and heap allocation
- **End-to-End Tests**: Automated Playwright browser tests covering desktop and mobile viewport workflows

---

## 5. Privacy & Data Boundary

- **Local-First Architecture**: 100% of image decoding, downsampling, color quantization, and pattern generation occurs on the user's client device
- **Zero Server Uploads**: No backend image ingestion endpoints
- **Zero Network Telemetry**: Zero tracking scripts, zero Google Analytics, zero tracking cookies
- **Transparent Boundaries**: Documented in `docs/privacy-preserving-metrics.md` distinguishing verifiable public repository metrics from unavailable product tracking telemetry
