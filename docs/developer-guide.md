# Developer & Contributor Guide

Welcome to the Bead Grid Studio developer guide. This document explains the codebase architecture, development environment, and quality verification workflows.

---

## 1. Architecture Overview

```
+-------------------------------------------------------------+
|                      Client Surfaces                        |
|   +-----------------------+     +-----------------------+   |
|   |   Web App / PWA       |     |   Headless CLI Tool   |   |
|   |   (src/app.js)        |     |   (bin/bead-grid.mjs) |   |
|   +-----------+-----------+     +-----------+-----------+   |
+---------------|-----------------------------|---------------+
                |                             |
                +--------------+--------------+
                               |
                               v
+-------------------------------------------------------------+
|                      @bead-grid/core                        |
|  (Runtime-agnostic, zero-dependency, pure ES Modules)       |
|                                                             |
|  - geometry.js   Grid bounds, board snapping, aspect ratios |
|  - color.js      OKLab, CIELAB, CIEDE2000, linear sRGB      |
|  - palette.js    MARD 221 base, custom palette builder      |
|  - analysis.js   Complexity, edge density, line art rating  |
|  - quantize.js   Core quantization & material consolidation |
|  - pattern.js    Pattern data model, statistics, validation |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    Open Data Standards                      |
|  - schemas/palette.schema.json  (JSON Schema 2020-12)       |
|  - schemas/pattern.schema.json  (JSON Schema 2020-12)       |
+-------------------------------------------------------------+
```

### Decoupled Core Design
- **`@bead-grid/core`** lives in `packages/core/`. It contains zero DOM or browser-specific dependencies. It runs seamlessly in Node.js, Cloudflare Workers, web workers, and browser scripts.
- **`src/app.js`** serves as the interactive frontend UI orchestrator, handling Canvas rendering, pan/zoom gestures, Web Workers, drag-and-drop, and PWA caching.
- **`bin/bead-grid.mjs`** provides a CLI for batch automation and script integration.

---

## 2. Repository Layout

```
bead-grid-studio/
├── bin/
│   └── bead-grid.mjs            # Command-line generator
├── docs/                        # Architecture & format documentation
├── examples/                    # Runnable developer integration examples
│   ├── basic-browser/           # Client-side HTML demo
│   ├── custom-palette/          # Custom palette authoring demo
│   ├── node-cli/                # Node.js backend integration demo
│   └── palettes/                # Example palette JSON files
├── packages/
│   └── core/                    # @bead-grid/core standalone package
│       ├── src/                 # Pure algorithms and color math
│       ├── index.d.ts           # Complete TypeScript definitions
│       └── package.json
├── public/                      # Static assets and PWA service worker
├── schemas/                     # JSON Schemas (palette & pattern, 2020-12)
├── scripts/                     # Build, packaging, check, and metrics scripts
├── src/                         # Web application UI source
└── tests/                       # Unit tests, helpers, and Playwright E2E suites
```

---

## 3. Development Workflow

### Setup Requirements
- Node.js >= 22.12.0
- npm >= 10.0.0

```bash
# Clone and install
git clone https://github.com/zwhy149/bead-grid-studio.git
cd bead-grid-studio
npm run setup
```

### Dev Server
```bash
npm run dev
```

### Quality Assurance & Testing
All PRs must pass the three-tier quality suite:

```bash
# 1. Structural and palette integrity check
npm run check

# 2. Mathematical unit test suite (Node.js native test runner)
npm run test:unit

# 3. Headless Chromium E2E tests (Desktop & Mobile)
npm run test:e2e:ci

# Or run all CI checks in one command:
npm run qa:ci
```

### Performance Benchmarks
```bash
npm run benchmark
```

See [docs/command-reference.md](command-reference.md) for the complete manual of all npm scripts, flags, and CLI arguments.

---

## 4. Architectural Rules & Best Practices

1. **Local-First & Zero Telemetry**: Never add network telemetry, tracking cookies, or remote server uploads for user image data.
2. **Deterministic Output**: Pattern generation given identical inputs must produce bitwise identical cell arrays and material distributions.
3. **No External Runtime Dependencies in Core**: The `@bead-grid/core` package must remain 100% dependency-free.
4. **Single-File Portable HTML Compatibility**: The web build must bundle cleanly into `dist/bead-grid-studio.html` without external network scripts.
