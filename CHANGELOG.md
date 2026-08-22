# Changelog

All notable changes are documented here. The project follows [Semantic Versioning](https://semver.org/).

## [1.1.2] - 2026-08-22

### Added

- Added a copyable bead shopping list in Material Counts: one tap copies every color code, localized name, quantity, and share as plain text for ordering, with a clipboard fallback for non-secure contexts.
- Added per-color share bars and percentage labels to each material row so dominant colors are readable at a glance.
- Added bilingual (zh-CN / en-US) strings for the list, share labels, and copy feedback, plus two browser self-test regressions for share rounding.

## [1.1.1] - 2026-08-17

### Fixed

- Completed Chinese and English coverage for dynamically selected color-code labels, document diagnostics, image-decoding errors, and conversion failures.
- Hardened the source gate so every runtime translation key literal is checked, including keys selected through conditional expressions.
- Added a browser regression that prevents internal translation keys from leaking into accessible labels or tooltips.

## [1.1.0] - 2026-08-17

### Added

- Added complete Simplified Chinese and English application localization with browser detection, query override, and persisted manual choice.
- Added a first-run Image → Pattern flow, an offline bundled sample, portable-download guidance, and local-processing promises.
- Added post-generation export, save, share/copy-link, community links, and 1200×675 / 1080×1440 Before/After share cards.
- Added a brand-neutral palette-provider contract while retaining the pinned MARD-compatible base 221 catalog as the only shipped provider.
- Added bilingual legal pages, screenshots, social cards, repository metrics tooling, sitemap metadata, and onboarding/deployment documentation.
- Added locale, onboarding, sharing, social-card, and 360/390/768/1440 responsive regression tests.

### Changed

- Localized construction-sheet PNG and paged-print text without changing grid conversion, project format, or palette values.
- Reworked the completion area and mobile top bar to keep core actions readable without horizontal overflow.

## [1.0.2] - 2026-08-16

### Changed

- Made Simplified Chinese the repository landing language and added a complete English README with symmetric language navigation.
- Added beginner instructions for browser use, offline download, local development, GitHub Pages, and Cloudflare Pages.
- Added Chinese and English search terminology to the repository landing content without claiming lossless conversion.
- Normalized embedded legal-text line endings for reproducible portable builds across Windows and Linux.
- Expanded the release ZIP so README links and deployment documentation remain available after extraction.

## [1.0.1] - 2026-08-16

### Fixed

- Synced the public third-party notice with the repository `NOTICE`.
- Embedded the Apache-2.0 license and all third-party notices in the portable single-file HTML for offline redistribution.
- Added release gates that prevent notice and version metadata drift.
- Reworded automatic sizing as a recommendation rather than an unverifiable “clearest” claim.

## [1.0.0] - 2026-08-15

### Added

- Local-first responsive Web/PWA editor.
- Five conversion modes and automatic content analysis.
- Topology-aware small-line-art refinement with missing-component diagnostics.
- Aspect-ratio-safe long-side presets and real-board placement.
- MARD-compatible base 221-code palette with pinned provenance.
- Construction-sheet PNG, editable JSON, material counts, coordinates, guide lines, and board seams.
- Brush, eraser, picker, crop, reference layer, mirror, rotate, undo, and redo.
- PWA build and portable single-file HTML release.
- Source checks, geometry tests, and desktop/mobile browser regression tests.

### Known limitations

- A detail smaller than one target cell may be physically unrepresentable.
- Project JSON does not embed the original reference image.
- Paginated vector/PDF construction sheets are planned but not yet included.
