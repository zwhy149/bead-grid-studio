# Project Health & Public Impact Evidence

[简体中文](project-health.zh-CN.md) · **English**

This page gives maintainers, contributors, reviewers, and open-source support programs a factual snapshot of Bead Grid Studio. Because the tool is strictly local-first and zero-telemetry by design, we do not monitor user sessions, collect tracking cookies, or upload user artwork. Instead, adoption and project health are verified through open-source repository signals, automated release assets, and public GitHub APIs.

## What the project delivers

Bead Grid Studio is a local-first fuse-bead pattern generator and craft quantization engine. It converts local images into editable grids, preserves source aspect ratios, maps cells to a pinned 221-code base palette, and exports making-ready sheets with coordinates, guides, board seams, per-cell codes, and material counts. The web app, PWA, headless CLI, and portable single HTML share the same implementation.

## Verifiable Public Adoption Snapshot

*Snapshot Date: September 2026 (collected via GitHub REST API)*

| Signal | Value | Verification Method |
| :--- | ---: | :--- |
| **GitHub Stars** | **175** | Repository header or `npm run metrics` |
| **GitHub Forks** | **19** | Repository header or `npm run metrics` |
| **Published Releases** | **7** | GitHub Releases (`v1.0.0` through `v1.2.0`) |
| **Release-Asset Downloads** | **156+** | `npm run metrics`; offline `.html` distributions |
| **Community Health** | **100%** | GitHub Community Profile API |
| **Open Issues / Maintenance** | **7** (0 stale) | Actively triaged bug reports and discussions |
| **Single-File Portable HTML** | **~406 KB** | Bundled zero-dependency offline web application |
| **Open Formats Supported** | **2 Schemas** | JSON Schema Draft-07 for Palettes and Pattern Exchange |
| **Core Architecture** | **ESM Standalone** | `@bead-grid/core` runtime-agnostic library |
| **License** | **Apache-2.0** | [`LICENSE`](../LICENSE) |

## How to Verify Project Health Locally

Anyone can reproduce and verify these indicators using the maintenance script:

```bash
# Run health inspection (uses live GitHub API or verified baseline when rate-limited)
npm run health

# Or inspect live GitHub release metrics specifically
npm run metrics
```

This outputs `project-health.json`, containing an automated audit of:
1. Public engagement signals (stars, forks, release asset download counters).
2. Codebase quality (unit test count, E2E browser test suites, portable single-file bundle size).
3. Open standard compliance and architectural boundaries.

## Community Maintenance Evidence

- External Pull Request [#25](https://github.com/zwhy149/bead-grid-studio/pull/25) was reviewed, passed CI and CodeQL, and was merged with contributor attribution.
- External proposal [#27](https://github.com/zwhy149/bead-grid-studio/pull/27) received a concrete revision request: reuse the existing physical-board model, add tests, and source compatibility claims instead of creating an unused parallel configuration.
- [`good first issue`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) and [`help wanted`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) tasks remain available rather than being consumed only to make the backlog look smaller.
- Contribution, conduct, support, maintenance, security, and trademark policies are public. Private vulnerability reporting is enabled.
- Protected `main` requires current CI and CodeQL checks, uses linear history, and rejects force pushes and deletion.

## Engineering and Release Evidence

- Deterministic source, palette-provenance, unit, responsive-browser, portable-file, PWA/offline, and conversion-regression checks run before merge.
- GitHub Actions are pinned to immutable commit SHAs and run on Node 24-compatible action releases.
- Release tags verify that the package version matches the tag, run the full browser matrix, build the portable HTML and ZIP, and publish SHA-256 checksums.
- The palette dataset has pinned source provenance and an integrity hash; unsupported manufacturer claims are not accepted solely because a color list looks plausible.
- The architecture records local-first and web-first decisions in [`docs/adr/`](adr/), and known conversion limits are documented instead of promising lossless low-resolution output.

## Evidence Boundaries

- Stars, forks, and downloads show public interest; they do not prove active users.
- GitHub Pages has no project analytics in this repository, so visitor counts are unknown.
- Screen colors approximate physical beads; brand, batch, lighting, and display differences still require a physical color-card check.
- Inclusion in this document does not guarantee acceptance by any grant, credit, or open-source support program. Program operators make their own eligibility decisions.
