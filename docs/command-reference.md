# Command Reference

Comprehensive reference guide for all developer commands, npm scripts, testing gates, and release tools in Bead Grid Studio.

---

## 1. Quick Reference Matrix

| Command | Action | Environment | CI Stage |
| :--- | :--- | :--- | :--- |
| `npm run setup` | Install npm dependencies and Playwright browser binaries | Node >= 22.12 | Local setup |
| `npm run dev` | Launch local Vite development server with HMR | Any modern browser | Local dev |
| `npm run build` | Build production bundle & single-file offline HTML | Node >= 22.12 | Release / Deploy |
| `npm run preview` | Preview production build locally | Any modern browser | Local verify |
| `npm run check` | Lint source structure, import boundaries, & palette SHA | Node >= 22.12 | Lint / Gate |
| `npm run schema:validate` | Validate JSON Schemas (2020-12) & example palettes | Node >= 22.12 | QA / Test |
| `npm run test:unit` | Run all unit & golden invariant tests | Node >= 22.12 (native) | CI Test |
| `npm run test:determinism` | Run 18-assertion 3-run bitwise determinism golden tests | Node >= 22.12 (native) | CI Test |
| `npm run test:e2e` | Run Playwright end-to-end browser suite (all browsers) | Chromium, Firefox, WebKit | Local verify |
| `npm run test:e2e:ci` | Run headless Chromium desktop & mobile smoke suite | Headless Chromium | CI Test |
| `npm test` / `npm run qa` | Run `check`, `test:unit`, and full `test:e2e` | Full environment | Full local gate |
| `npm run qa:ci` | Run `check`, `test:unit`, and `test:e2e:ci` | CI runner (Ubuntu) | CI Pipeline Gate |
| `npm run benchmark` | Execute reproducible 16-60 cell performance benchmark | Node >= 22.12 | Release / Perf |
| `npm run health` | Collect public GitHub API metrics & verify health doc | Node >= 22.12 + Net | Maintainer tool |
| `npm run metrics` | Fetch GitHub stars, forks, issues, and asset downloads | Node >= 22.12 + Net | Maintainer tool |
| `npm run capture:docs` | Rebuild and generate UI documentation screenshots | Headless browser | Doc release |

---

## 2. Core Development Commands

### `npm run setup`
- **Definition**: `npm install && playwright install chromium firefox webkit`
- **Purpose**: Installs all required Node dependencies and downloads headless browser binaries for Playwright.
- **When to run**: First time checking out the repository, or after upgrading dependencies.

### `npm run dev`
- **Definition**: `vite`
- **Purpose**: Starts the local Vite development server with Hot Module Replacement (HMR) at `http://localhost:5173`.
- **When to run**: Daily feature development and UI inspection.

### `npm run build`
- **Definition**: `vite build && node scripts/build-portable.mjs`
- **Purpose**:
  1. Compiles frontend assets into `dist/`.
  2. Bundles the standalone single-file offline application into `release/bead-grid-studio-v<VERSION>.html` with inlined CSS, JS, and SVG icons.
  3. Computes and verifies SHA-256 integrity checksums.
- **When to run**: Prior to packaging a release, deploying to GitHub Pages, or testing portable offline distribution.

### `npm run preview`
- **Definition**: `vite preview`
- **Purpose**: Serves the generated `dist/` directory on a local HTTP server to verify production bundles before deployment.

---

## 3. Code Integrity & Schema Verification

### `npm run check`
- **Definition**: `node scripts/check-source.mjs && node scripts/check-palette.mjs`
- **Purpose**:
  - `check-source.mjs`: Verifies file structure conventions, prevents prohibited external tracking libraries, ensures `@bead-grid/core` boundary isolation, and checks version string synchronization across `package.json`, `packages/core/package.json`, and `public/version.json`.
  - `check-palette.mjs`: Asserts that the built-in MARD 221 color palette matches its pinned upstream SHA-256 provenance hash.
- **When to run**: Pre-commit hook or before submitting pull requests.

### `npm run schema:validate`
- **Definition**: `node scripts/validate-schemas.mjs`
- **Purpose**:
  - Validates syntax and structural requirements for `schemas/palette.schema.json` and `schemas/pattern.schema.json` under JSON Schema 2020-12.
  - Verifies that sample palette files in `examples/palettes/` strictly satisfy schema validation constraints.
  - Verifies sample pattern structures against the schema specification.
- **When to run**: After modifying schemas, adding new sample palettes, or updating pattern serialization models.

---

## 4. Automated Testing Suites

### `npm run test:unit`
- **Definition**: `node --test tests/unit/*.test.js`
- **Purpose**: Executes all unit tests using Node.js's built-in test runner. Tests include:
  - `color.test.js`: OKLab color conversion, CIEDE2000 color difference formula, and RGB clamps.
  - `geometry.test.js`: Aspect ratio fitting, board containment, and padding math.
  - `quantize.test.js`: Core quantization invariants and edge cases.
  - `pattern.test.js`: Pattern v1 model, BOM calculation, and v0-to-v1 legacy migration.
  - `golden.test.js`: Golden fixtures and SHA-256 reproducibility.
- **Runtime**: < 1 second; zero external test runners required.

### `npm run test:determinism`
- **Definition**: `node --test tests/unit/golden.test.js`
- **Purpose**: Isolates the deterministic regression test suite. Runs 18 assertions comparing output cell grids across 3 consecutive quantization passes over 8 golden PNG fixtures to ensure bitwise byte-level reproducibility.
- **When to run**: Whenever changing color conversion, dithering, or quantization algorithms in `@bead-grid/core`.

### `npm run test:e2e` / `npm run test:e2e:ci`
- **Definition**:
  - `test:e2e`: `npm run build && playwright test`
  - `test:e2e:ci`: `npm run build && playwright test --project=desktop-chromium --project=mobile-chromium`
- **Purpose**: Comprehensive browser automation tests:
  - Responsive desktop and mobile layout validation.
  - Image drag-and-drop loading and canvas rendering.
  - Construction sheet PNG export with coordinates and BOM.
  - Color-by-color making assistant mode and local draft recovery.
  - Service Worker offline caching.
- **When to run**: Full regression pass or within CI workflows.

### `npm run qa:ci`
- **Definition**: `npm run check && npm run test:unit && npm run test:e2e:ci`
- **Purpose**: Canonical CI entrypoint that executes linting, unit tests, and Playwright smoke tests sequentially.

---

## 5. Benchmarking & Maintenance

### `npm run benchmark`
- **Definition**: `node benchmarks/run-benchmark.mjs`
- **Purpose**: Benchmarks quantization throughput, execution time, and memory overhead across 16, 24, 32, 48, and 60 grid dimensions. Validates 100% determinism and updates the benchmark record in `docs/benchmark.md`.

### `npm run health`
- **Definition**: `node scripts/project-health.mjs`
- **Purpose**: Queries GitHub's public API for repository statistics (stars, forks, open issues, pull requests, releases, asset downloads) and generates `project-health.json`, `docs/project-health.md`, and `docs/project-health.zh-CN.md`. Falls back cleanly to verified baseline metrics when offline or rate-limited.

### `npm run metrics`
- **Definition**: `node scripts/repo-metrics.mjs`
- **Purpose**: Lightweight script printing raw GitHub API adoption metrics to stdout without modifying files.

---

## 6. Headless CLI Invocations

The headless CLI tool resides in `bin/bead-grid.mjs`:

```bash
# Basic conversion with ANSI 24-bit color terminal preview
node bin/bead-grid.mjs input.png -w 29 -h 29

# Export standardized JSON pattern conforming to schemas/pattern.schema.json
node bin/bead-grid.mjs input.png -w 29 -h 29 --format json -o pattern.json

# Use custom brand palette JSON
node bin/bead-grid.mjs input.png -w 32 -h 32 --palette examples/palettes/mini-starter-12.json

# Limit color count and use CIEDE2000 color matching
node bin/bead-grid.mjs input.png -w 48 -h 48 --max-colors 16 --color-metric ciede2000
```
