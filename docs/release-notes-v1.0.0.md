## Highlights

- Local-first image conversion: source pixels stay in the browser.
- Topology-aware small-line-art refinement with honest missing-detail diagnostics.
- Aspect-ratio-safe patterns, real-board placement, 221 compatible base color codes, and printable construction sheets.
- Responsive Web/PWA plus a portable single-file HTML download.

## Fixed by design

- Wide images are not stretched into square grids.
- Exterior white background and physical white beads remain distinct.
- Exact black/white anchors prevent common black-to-color and white-to-gray drift.
- Counts, coordinates, filename dimensions, and the editable grid derive from one source of truth.

## Known limitations

- Details smaller than one target cell may be physically unrepresentable.
- Screen colors cannot guarantee an exact match to a physical bead batch.
- Project JSON does not embed the original reference image.
- Paginated vector/PDF export is planned for a later release.

## Integrity

Download `SHA256SUMS.txt` and verify the HTML or ZIP before distribution.
