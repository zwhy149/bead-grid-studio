# Bead Grid Studio v1.3.0
## Reusable Core & Open Formats

Bead Grid Studio v1.3.0 marks a major architectural transition: expanding from a high-quality standalone Web/PWA application into an open-source software ecosystem providing a reusable image quantization engine, open craft data formats, headless CLI tooling, and reproducible performance benchmarks.

---

## What's new

### Developer & Ecosystem
- **Reusable DOM-Free Core Engine (`@bead-grid/core`)**: Extracted into `packages/core/` with zero runtime dependencies. Executes identically in browser main threads, Web Workers, Node.js backend pipelines, and edge runtimes. Features OKLab Euclidean and CIEDE2000 color space matching, dynamic palette compilation, and complete TypeScript definitions (`packages/core/index.d.ts`).
- **Headless CLI (`bin/bead-grid.mjs`)**: Command-line generator supporting batch conversions, custom palette loading, 24-bit ANSI terminal previews, and JSON export.
- **Versioned Pattern JSON Schema (`schemas/pattern.schema.json`)**: Open specification (JSON Schema 2020-12) standardizing the Pattern Exchange Format v1, liberating craft patterns from proprietary desktop formats.
- **Versioned Palette JSON Schema (`schemas/palette.schema.json`)**: Open specification (JSON Schema 2020-12) enabling independent brands, manufacturers, and artists to define standardized craft palettes.
- **Browser & Node.js Integration Examples (`examples/`)**: Runnable boilerplate projects for vanilla browser ES Modules, Node.js scripts, and custom palette registrations.
- **Reproducible Performance Benchmarks (`benchmarks/`)**: Automated measurement across 16, 24, 32, 48, and 60 grid dimensions recording latency, memory allocation delta, bead counts, and output SHA-256 hashes.

### Quality & Architecture
- **Deterministic Golden Regression Suite**: Added 8 diverse image fixtures in `tests/fixtures/` and an automated determinism test suite (`npm run test:determinism`) verifying bitwise-identical cell arrays across 3 consecutive quantization runs.
- **Schema Validation Command**: Added `npm run schema:validate` to ensure all open schemas and reference palette files strictly adhere to JSON Schema 2020-12 specifications.
- **Enhanced Test Automation**: 38 native Node.js unit tests passing with zero external test runners.
- **CI / CD Upgrades**: Workflows pinned to immutable action commit SHAs and verified on Node 24 runtimes.

### Privacy & Boundaries
- **Strict Local-First Architecture Preserved**: 100% of image decoding, downsampling, color quantization, and pattern generation occurs entirely within the client environment.
- **Zero Image / Pattern Uploads**: The project includes no backend image ingestion endpoints or server storage.
- **Zero Telemetry**: No tracking cookies, Google Analytics, or third-party behavioral telemetry SDKs. Documented in `docs/privacy-preserving-metrics.md`.

### Compatibility
- **Existing Web & PWA Workflows 100% Preserved**: All 166 UI DOM hooks, Canvas interactions, keyboard shortcuts, and Making Assistant features remain fully operational with zero breaking changes.
- **Single-File Portable HTML Maintained**: Production build produces `release/bead-grid-studio-v1.3.0.html`, self-contained with embedded styles, fonts, and Apache-2.0 licensing for airgapped operation.
- **Seamless Project Migration**: Automatic migration logic seamlessly upgrades legacy v0 project files to Pattern Exchange Format v1.

---

## Download

For offline use, download `bead-grid-studio-v1.3.0.html` and verify `SHA256SUMS.txt` from **Assets**. The web application continues to be hosted at https://zwhy149.github.io/bead-grid-studio/.
