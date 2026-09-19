# Open Source Reviewer View (2-Minute Audit)

This guide is designed for open-source grant committees, ecosystem reviewers, and maintainer evaluators who need to assess Bead Grid Studio in under two minutes.

---

## 1. What can you see in 30 seconds on the README?
- **Immediate Product Usability**: Working live demo ([GitHub Pages](https://zwhy149.github.io/bead-grid-studio/)) and offline single-file HTML release requiring 0 installation.
- **Dual Track Identity**: Clear distinction between the end-user craft workbench and the developer ecosystem.
- **Ecosystem Stack**: Decoupled core engine (`@bead-grid/core`), headless CLI (`bin/bead-grid.mjs`), open JSON schemas (`schemas/`), and reproducible benchmarks (`benchmarks/`).
- **Minimal Architecture Diagram**: Explicit visual proof that the Web UI, CLI, scripts, and tests all share a single canonical core engine.
- **5-Minute Quick Start**: Minimal, copy-pasteable JavaScript snippet calling the core quantization API.

---

## 2. What can you verify in 1 minute?
Run three commands locally to verify code quality, schema validity, and benchmarks:
```bash
# 1. Verify 166 UI DOM hooks and 221 pinned palette colors
npm run check

# 2. Verify all open schemas and reference palette files
npm run schema:validate

# 3. Verify quantization across 16-60 grid sizes with 100% bitwise determinism
npm run test:determinism
```
All three commands pass out-of-the-box in seconds using Node's native test runner with 0 external test runners.

---

## 3. Which files best prove ecosystem value?
1. [`packages/core/src/index.js`](../packages/core/src/index.js) & [`packages/core/index.d.ts`](../packages/core/index.d.ts): Runtime-agnostic, zero-dependency ES Module exporting `generateBeadPattern`, `quantizePixels`, and OKLab/CIEDE2000 math.
2. [`schemas/pattern.schema.json`](../schemas/pattern.schema.json) & [`schemas/palette.schema.json`](../schemas/palette.schema.json): Standardized JSON Schemas (Draft-07) establishing vendor-neutral physical craft data exchange.
3. [`bin/bead-grid.mjs`](../bin/bead-grid.mjs): Headless CLI tool enabling terminal batch processing and ANSI color art previews.
4. [`examples/`](../examples/): Real, runnable integration examples for Browser, Node.js pipelines, and custom palettes.

---

## 4. Which files best prove active maintenance?
1. [`tests/unit/golden.test.js`](../tests/unit/golden.test.js): 18 tests asserting bitwise-identical SHA-256 pattern outputs over 3 consecutive runs across 8 diverse golden fixtures.
2. [`benchmarks/run-benchmark.mjs`](../benchmarks/run-benchmark.mjs) & [`docs/benchmark.md`](benchmark.md): Performance benchmarks across 16, 24, 32, 48, 60 cells.
3. [`docs/project-health.md`](project-health.md): Live GitHub API data tracking releases, downloads, and issues with honest partition of unavailable metrics.
4. [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) & [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml): Pinned GitHub Actions running automated checks on Node 24.

---

## 5. Which numbers best prove authentic adoption?
- **156+ verified downloads** of the portable single-file HTML bundle across 7 GitHub releases (`v1.0.0` - `v1.2.0`). (Users deliberately download offline single-file bundles for airgapped workshop and studio use).
- **175 GitHub Stars** and **19 Forks**.
- **7 published releases** demonstrating iterative release discipline.
- **3 distinct contributors** with merged pull requests.

---

## 6. What is the project's biggest remaining weakness?
- **No NPM Registry Release Yet**: `@bead-grid/core` is organized as an installable workspace package, but is not yet published to `npmjs.com` (planned for v1.3).
- **Web UI Custom Palette Importer**: Custom palettes must currently be passed via the CLI or `@bead-grid/core` code; a drag-and-drop web dialog is still on the roadmap.
- **Local-First Analytics Blindspot**: Because the tool collects zero telemetry, server-side retention metrics (MAU/DAU) cannot be observed.

---

## Top 5 Links a Reviewer Should Click

1. [High-Level System Architecture & ASCII Diagrams](../ARCHITECTURE.md)
2. [Reusable Core Engine Guide & TypeScript Definitions](../packages/core/README.md)
3. [Verified Public Metrics & Project Health](project-health.md)
4. [Reproducible Performance Benchmarks & Determinism Report](benchmark.md)
5. [Open Grant Application Verified Facts](oss-application-facts.md)
