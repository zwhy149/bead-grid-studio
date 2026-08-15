# Changelog

All notable changes are documented here. The project follows [Semantic Versioning](https://semver.org/).

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
