# Open Source Application Facts

This document contains strictly verified, factual data points for open-source grant applications and reviewer audits. Every item contains an exact verified value, confirmation status, and direct link to the corresponding repository file.

---

## Repository Identity & Community Adoption

| Item | Value | Verification Link / Source |
| :--- | :---: | :--- |
| **Repository** | `https://github.com/zwhy149/bead-grid-studio` | [`README.md`](../README.md) |
| **Maintainer** | `zwhy149` | [`MAINTAINERS.md`](../MAINTAINERS.md) |
| **License** | **Apache-2.0** | [`LICENSE`](../LICENSE) |
| **Current Stars** | **175** | Verified via GitHub REST API |
| **Current Forks** | **19** | Verified via GitHub REST API |
| **Releases** | **7** | `v1.0.0` through `v1.2.0` on GitHub Releases |
| **Release Downloads** | **156+** | Sum of portable `.html` asset downloads across 7 releases |
| **Contributors** | **3** | Verified via GitHub Contributors API |
| **Open Issues** | **4** | GitHub Issues API (excluding pull requests) |
| **Open PRs** | **3** | GitHub Pull Requests API |

---

## Technical Capabilities & Open Standards

| Capability | Status | Implementation Details & File Reference |
| :--- | :---: | :--- |
| **Reusable Core** | **YES** | [`packages/core/`](../packages/core/README.md): Zero-dependency, DOM-free ES Module with TypeScript definitions (`index.d.ts`), exporting `generateBeadPattern`, `quantizePixels`, and OKLab/CIEDE2000 math. |
| **CLI** | **YES** | [`bin/bead-grid.mjs`](../bin/bead-grid.mjs): Headless command-line tool supporting ANSI previews, custom palettes, and JSON pattern outputs. |
| **Pattern Schema** | **YES** | [`schemas/pattern.schema.json`](../schemas/pattern.schema.json): JSON Schema 2020-12 defining open Pattern Exchange Format v1. |
| **Palette Schema** | **YES** | [`schemas/palette.schema.json`](../schemas/palette.schema.json): JSON Schema 2020-12 defining standardized craft color palettes. |
| **Benchmarks** | **YES** | [`benchmarks/run-benchmark.mjs`](../benchmarks/run-benchmark.mjs): Evaluates 16, 24, 32, 48, 60 cell grids with latency, memory, and SHA-256 hashes recorded in [`docs/benchmark.md`](benchmark.md). |
| **Examples** | **YES** | [`examples/`](../examples/): Working runnable examples for browser ES modules, Node.js pipelines, CLI scripts, and custom palettes. |
| **CI** | **YES** | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): Node 24 matrix running source integrity checks, unit tests, and Playwright Chromium smoke suites. |
| **CodeQL** | **YES** | [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml): GitHub Advanced Security CodeQL analysis enabled and passing on every merge. |
| **Release Verification** | **YES** | [`scripts/build-portable.mjs`](../scripts/build-portable.mjs): Single-file HTML build (`414.5 KB`), SHA-256 checksums, and version parity gates. |
| **Privacy Model** | **YES** | [`docs/privacy-preserving-metrics.md`](privacy-preserving-metrics.md): Strict local-first architecture; 100% on-device processing; zero analytics cookies; zero user images uploaded. |
