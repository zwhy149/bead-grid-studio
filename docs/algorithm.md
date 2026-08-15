# Conversion algorithm

## Pipeline

1. **Decode locally** with file type, byte size, declared dimensions, and decoded-pixel limits.
2. **Orient and crop** using decoded orientation and a normalized crop rectangle.
3. **Choose geometry** by source aspect ratio or by fitting a compact pattern inside a real board.
4. **Analyze content** to distinguish line art, photos, documents, transparency, and connected background.
5. **Sample cells** using the selected mode rather than one universal average.
6. **Match colors** against the allowed palette, with exact-code preservation and neutral-dark protection.
7. **Limit materials** without simply taking the first N colors or discarding every rare semantic color.
8. **Refine small line art** using a target-independent intermediate mask and source component ownership.
9. **Validate** grid length, indices, selected codes, counts, diagnostics, and deterministic output.
10. **Render/export** from that same validated grid.

## Color distance

The default matcher uses perceptual color spaces rather than plain sRGB Euclidean distance. Candidate selection is accelerated, but the final decision is computed from the original cell color, not from whichever pixel first occupied a cache bucket. Exact palette colors remain exact in normal image modes.

White and black have explicit anchors. For opaque input, transparent `H1` is excluded. Near-white semantic cells can map to `H2`, rendered as pure white on screen and in flat construction sheets. Connected exterior white background remains empty when automatic background removal is enabled.

## Line art below 60 cells

Independent per-cell majority voting tends to thicken lines and merge disconnected features. The small-line-art path instead:

1. removes only high-confidence uniform scan-edge artifacts;
2. analyzes the subject at an intermediate long side independent of the final grid;
3. labels connected ink components before projection;
4. accumulates per-owner support for target cells;
5. skeletonizes/refines candidates without treating all black pixels as one component;
6. resolves collisions while protecting articulation cells;
7. gives an unclaimed tiny owner its best non-conflicting supported cell when possible;
8. reports missing or unresolved owners when the grid cannot represent them.

This approach improves scale stability and prevents two originally separate parts from becoming one merely because the source raster was larger.

## Aspect ratio and physical boards

“24 cells” means a 24-cell long side, not an automatic 24×24 square. A 5560×3992 image becomes approximately 24×17. A 52×52 board can contain a 52×37 pattern with 7/8 blank rows above/below. Those blank rows are normal board capacity, not distortion.

Contain keeps all content and may leave space. Cover fills the target by cropping and must disclose the crop cost. Non-uniform scaling is never used.

## Determinism

The same pixels, crop, grid, palette, and settings must produce the same cells and selected-code order. There is no random k-means seed. Browser self-tests run repeated inputs and compare them cell by cell.

## What the algorithm cannot do

- recover text that is less than a few cells high;
- preserve more independent details than the number and arrangement of target cells allow;
- guarantee screen colors equal a physical bead batch;
- infer the user's preferred artistic simplification for every photo.

The editor exists because a deterministic first pass still benefits from human judgment.
