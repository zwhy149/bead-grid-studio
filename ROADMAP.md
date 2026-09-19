# Roadmap

The roadmap is evidence-driven. An item moves into a release only when it has acceptance tests, real adoption pull, and a maintainer.

## 1.2 — Core Extraction & Ecosystem Standards (Completed)

- [x] DOM-free `@bead-grid/core` runtime-agnostic library with clean ES Modules.
- [x] Standardized open JSON Schemas for color palettes (`schema/palette.schema.json`) and pattern exchange format (`schema/pattern.schema.json`).
- [x] Command-line headless generator (`bead-grid` CLI in `bin/bead-grid.mjs`).
- [x] Reproducible benchmark suite (`benchmarks/run-benchmark.mjs`) measuring quantization latency and determinism.
- [x] Local-first, zero-telemetry verifiable project health metrics (`scripts/project-health.mjs`).
- [x] Integration examples for Node.js, browser, and custom palette authoring (`examples/`).
- [x] Focus mode with current-color isolation and completed-color tracking.
- [x] Progress saved locally and in editable projects without source-image upload.
- [x] UTF-8 CSV material export with per-color completion state.

## 1.3 — Making Workflow & Crafter Accessibility (Now)

- [ ] Physical board partitioning (splitting large patterns into printable 29x29 or 52x52 pegboard chunks).
- [ ] Keyboard and screen-reader workflow for marking sections complete.
- [ ] Paginated SVG/PDF export by physical board with color keys and grid coordinates.

## 1.4 — Palette Ecosystem & Community Exchanges (Next)

- [ ] Interactive custom palette importer in the web application.
- [ ] Community showcase pattern gallery and contribution workflows (`docs/showcase.md`).
- [ ] Additional brand/craft palettes with verified physical hex codes and redistribution rights.
- [ ] Palette exclusion and replacement optimizer to match user's existing physical inventory.

## Platform Decision Gates (Later)

- **Tauri desktop**: consider after repeated requests for native file/print integration and a Windows maintainer.
- **Capacitor mobile**: consider after app-store discovery or system-share requirements are demonstrated.
- **Mini program**: consider only with a dedicated maintainer and a tested Canvas/Worker/file Adapter.
- **Electron**: not planned unless a fixed Chromium/Node runtime becomes a hard requirement.

Creating empty platform shells is not a roadmap milestone.
