# Project health and public impact evidence

[简体中文](project-health.zh-CN.md) · **English**

This page gives maintainers, contributors, reviewers, and open-source support programs a factual snapshot of Bead Grid Studio. It deliberately separates verifiable repository signals from unknown product analytics.

## What the project delivers

Bead Grid Studio is a local-first fuse-bead pattern generator. It converts a local image into an editable grid, preserves the source aspect ratio, maps cells to a pinned 221-code base palette, and exports making-ready sheets with coordinates, guides, board seams, per-cell codes, and material counts. The web app, PWA, and portable single HTML share the same implementation.

The project does not operate an image-upload backend or analytics SDK. This keeps source images on the user's device and makes hosting inexpensive, but it also means the repository cannot honestly report unique users or conversion volume.

## Verifiable public snapshot

Snapshot collected from GitHub's public API on **2026-08-31**:

| Signal | Value | Verification |
| --- | ---: | --- |
| GitHub stars | 148 | Repository header or `npm run metrics` |
| Forks | 14 | Repository header or `npm run metrics` |
| Published releases | 7 | GitHub Releases or `npm run metrics` |
| Release-asset downloads | 95 | `npm run metrics`; excludes GitHub source archives |
| Community health | 100% | GitHub Community Profile API |
| License | Apache-2.0 | [`LICENSE`](../LICENSE) |

The numbers are a dated snapshot, not a growth claim. Run the following command to retrieve the current stars, forks, open Issues, releases, and release-asset downloads directly from GitHub:

```bash
npm ci
npm run metrics
```

The script does not run in the product and does not track visitors.

## Community maintenance evidence

- External Pull Request [#25](https://github.com/zwhy149/bead-grid-studio/pull/25) was reviewed, passed CI and CodeQL, and was merged with contributor attribution.
- External proposal [#27](https://github.com/zwhy149/bead-grid-studio/pull/27) received a concrete revision request: reuse the existing physical-board model, add tests, and source compatibility claims instead of creating an unused parallel configuration.
- [`good first issue`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) and [`help wanted`](https://github.com/zwhy149/bead-grid-studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) tasks remain available rather than being consumed only to make the backlog look smaller.
- Contribution, conduct, support, maintenance, security, and trademark policies are public. Private vulnerability reporting is enabled.
- Protected `main` requires current CI and CodeQL checks, uses linear history, and rejects force pushes and deletion.

## Engineering and release evidence

- Deterministic source, palette-provenance, unit, responsive-browser, portable-file, PWA/offline, and conversion-regression checks run before merge.
- GitHub Actions are pinned to immutable commit SHAs and run on Node 24-compatible action releases.
- Release tags verify that the package version matches the tag, run the full browser matrix, build the portable HTML and ZIP, and publish SHA-256 checksums.
- The palette dataset has pinned source provenance and an integrity hash; unsupported manufacturer claims are not accepted solely because a color list looks plausible.
- The architecture records local-first and web-first decisions in [`docs/adr/`](adr/), and known conversion limits are documented instead of promising lossless low-resolution output.

## Current work that would benefit from contributor or tool support

1. Extract the DOM-free conversion engine and keep Worker and test adapters behaviorally identical.
2. Publish reproducible 16/24/32/48/60-cell quality benchmarks using redistributable fixtures.
3. Add keyboard and screen-reader regression coverage for the making workflow.
4. Design a versioned custom-palette contract with provenance, fingerprints, and deterministic project remapping.

These items are tracked in [`ROADMAP.md`](../ROADMAP.md) and GitHub Issues. They are concrete maintenance work, not promises of unsupported platforms or fabricated adoption.

## Evidence boundaries

- Stars, forks, and downloads show public interest; they do not prove active users.
- GitHub Pages has no project analytics in this repository, so visitor counts are unknown.
- Screen colors approximate physical beads; brand, batch, lighting, and display differences still require a physical color-card check.
- Inclusion in this document does not guarantee acceptance by any grant, credit, or open-source support program. Program operators make their own eligibility decisions.
