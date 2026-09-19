# Roadmap

The roadmap is evidence-driven. An item moves into a release only when it has acceptance tests, real adoption pull, and a maintainer.

---

## 1.2 — Core Extraction & Ecosystem Standards (✅ Completed)

- [x] **Reusable Core Engine**: DOM-free `@bead-grid/core` runtime-agnostic library with clean ES Modules and TypeScript types (`index.d.ts`).
- [x] **Open Data Standards**: Standardized open JSON Schemas (JSON Schema 2020-12) for color palettes (`schemas/palette.schema.json`) and pattern exchange format (`schemas/pattern.schema.json`).
- [x] **Headless CLI**: Command-line generator (`bin/bead-grid.mjs`) supporting batch processing, ANSI previews, and JSON exports.
- [x] **Reproducible Benchmarks**: Standardized benchmark suite (`benchmarks/run-benchmark.mjs`) measuring quantization latency, memory allocation, and 100% bitwise determinism across 16, 24, 32, 48, 60 cell grids.
- [x] **Developer Examples**: Working integration examples for browser ES modules, Node.js scripts, CLI invocation, and custom palettes (`examples/`).
- [x] **Deterministic Regression Suite**: 8 golden fixtures and 18 assertions verifying bitwise SHA-256 reproducibility over 3 consecutive runs (`tests/unit/golden.test.js`).
- [x] **Verifiable Project Health**: Automated GitHub API metrics script (`scripts/project-health.mjs`) cleanly separating public metrics from local-first private data.
- [x] **Making Assistant**: Single-color isolation, step-by-step completion tracking, local draft recovery, and UTF-8 CSV BOM export.

---

## 1.3 — Package Distribution, Interoperability & Integrations (In Progress / Next)

- [ ] **Package Distribution**: Publish `@bead-grid/core` to the public npm registry (`npmjs.com`) with automated CI release automation.
- [ ] **Physical Board Tiling & Pagination**: Automatically partition large patterns (>100x100) into printable 29x29 or 52x52 pegboard sheets (SVG/PDF) with alignment guides and board seam markers.
- [ ] **Visual Custom Palette Importer**: Drag-and-drop dialog in the Web UI to load third-party palettes conforming to `schemas/palette.schema.json`.
- [ ] **External Integrations**: Pilot integrations with third-party maker hardware (e.g. robotic bead pick-and-place machines, pen plotters) and Discord craft bots using the headless core API.
- [ ] **Community Showcase & Contributor Growth**: Expand `docs/showcase.md` with verified physical build galleries and onboard external contributors via `GOOD_FIRST_ISSUES.md`.
- [ ] **API Stability & Multi-language Bindings**: Formalize semantic versioning guarantees for the core API and explore WebAssembly / Python bindings.

---

## Platform Decision Gates (Evaluated as Demand Arises)

- **Tauri desktop**: consider after repeated requests for native OS file system / printer integration and an active desktop maintainer.
- **Capacitor mobile**: consider after mobile app-store distribution or native OS sharing requirements are demonstrated.
- **Mini program**: consider only with a dedicated maintainer and a tested Canvas/Worker/file adapter.
- **Electron**: not planned; modern browsers and lightweight single-file HTML provide superior portability without bundling a 150 MB Chromium runtime.

*Note: Creating empty platform directories without functional implementations is not an open-source milestone.*
