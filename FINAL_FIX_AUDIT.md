# Final Fix Audit: Bead Grid Studio

Date: September 19, 2026  
Status: **Pre-Fix Verification Completed**  
Auditor: Senior Open Source Maintainer & Release Engineer

---

# Issue 1 — Schema Draft
**Status: Confirmed**

- **Findings**:
  - The schema files themselves (`schemas/palette.schema.json` and `schemas/pattern.schema.json`) declare:
    `"$schema": "https://json-schema.org/draft/2020-12/schema"`
  - However, documentation files across the repository (`README.md`, `README.en.md`, `ARCHITECTURE.md`, `docs/open-source-impact.md`, `docs/palette-format.md`, `docs/pattern-format.md`, `docs/developer-guide.md`, `docs/project-health.md`, `docs/project-health.zh-CN.md`, `docs/release-notes-v1.3.0-draft.md`, `docs/oss-application-facts.md`, `OPEN_SOURCE_UPGRADE_REPORT.md`, `ROADMAP.md`) incorrectly referred to the format as `JSON Schema Draft-07`.
- **Planned Action**:
  - Unify all documentation and descriptions to `JSON Schema 2020-12` to align strictly with the code as the source of truth.

---

# Issue 2 — schema vs schemas
**Status: Confirmed**

- **Findings**:
  - Both `schema/` and `schemas/` directories existed concurrently.
  - A byte-by-byte diff (`git diff --no-index schema schemas`) confirmed both directories contained identical copies of `palette.schema.json` and `pattern.schema.json`.
  - Stale references pointed to `schema/` (e.g. `$schema` in `examples/palettes/*.json`, `packages/core/src/pattern.js`, `docs/palette-format.md`, `docs/pattern-format.md`, etc.), while modern references pointed to `schemas/`.
- **Planned Action**:
  - Select `schemas/` as the single canonical directory.
  - Update all code, examples, schemas `$id`, and documentation to point exclusively to `schemas/`.
  - Remove the duplicate `schema/` directory.

---

# Issue 3 — npm scripts
**Status: Confirmed & Partially Aligned**

- **Findings**:
  - In the preceding pass, `"schema:validate": "node scripts/validate-schemas.mjs"` and `"test:determinism": "node --test tests/unit/golden.test.js"` were introduced in `package.json`.
  - Both commands execute successfully with 0 errors.
  - Need a dedicated `docs/command-reference.md` mapping every public `npm run <cmd>` script to its exact behavior and scope.
- **Planned Action**:
  - Verify that all scripts in `package.json` are fully operational.
  - Generate `docs/command-reference.md` as the single canonical script reference.

---

# Issue 4 — project health baseline
**Status: Confirmed**

- **Findings**:
  - In `scripts/project-health.mjs`, `BASELINE_METRICS` lacked an explicit `capturedAt` ISO timestamp.
  - `openPullRequests` was set to `0` instead of the verified count `3`.
  - `openIssues` was set to `7` (which included pull requests) instead of `4` issues.
  - The release downloads breakdown in the fallback baseline was outdated.
- **Planned Action**:
  - Add explicit `capturedAt` timestamp to `BASELINE_METRICS`.
  - Align fallback baseline numbers with verified September 2026 data (`stars: 175`, `forks: 19`, `openIssues: 4`, `openPullRequests: 3`, `releases: 7`, `totalAssetDownloads: 156`, `contributors: 3`).
  - Distinguish `source: "github-api"` from `source: "fallback-baseline"`.

---

# Issue 5 — CLI test dependency
**Status: Confirmed**

- **Findings**:
  - Production CLI executable `bin/bead-grid.mjs` directly imported from `../tests/helpers/png.js`.
  - Multiple examples (`examples/node/index.mjs`, `examples/node-cli/index.mjs`, `examples/custom-palette/index.mjs`) and benchmarks also imported from `tests/helpers/png.js`.
  - Violates the architectural rule that production code must not depend on test helpers.
- **Planned Action**:
  - Extract the pure Node.js PNG decoder to `src/adapters/png.js`.
  - Update `bin/bead-grid.mjs`, `benchmarks/run-benchmark.mjs`, and all examples to import from `src/adapters/png.js`.
  - Update `tests/helpers/png.js` to re-export from `src/adapters/png.js` so tests depend on production code rather than vice versa.

---

# Planned Changes

| Issue | Files Affected | Risk | Acceptance Criteria |
| :--- | :--- | :---: | :--- |
| **Issue 1 (Schema Draft)** | `README.md`, `README.en.md`, `ARCHITECTURE.md`, `docs/*.md`, `ROADMAP.md` | Low | Zero occurrences of "Draft-07" or "Draft 7"; all state "JSON Schema 2020-12". |
| **Issue 2 (Canonical Schema Dir)** | `schema/` (delete), `schemas/`, `examples/palettes/*.json`, docs, `packages/core/src/pattern.js` | Low | `schema/` directory deleted; only `schemas/` exists; all references resolve cleanly. |
| **Issue 3 (NPM Scripts & Docs)** | `docs/command-reference.md`, `package.json` | Low | All documented npm scripts exist and exit code 0; `docs/command-reference.md` added. |
| **Issue 4 (Project Health Baseline)** | `scripts/project-health.mjs`, `project-health.json` | Low | Fallback baseline contains `capturedAt`, separates issues (4) from PRs (3), marks source clearly. |
| **Issue 5 (CLI Test Dependency)** | `src/adapters/png.js` (new), `bin/bead-grid.mjs`, `tests/helpers/png.js`, `benchmarks/run-benchmark.mjs`, `examples/*/index.mjs` | Low | Production CLI and examples import from `src/adapters/png.js`; 0 imports of `tests/` in `bin/` or `examples/`. |
