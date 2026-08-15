# Domain context

This file defines the language used in code, Issues, and architecture discussions.

## Core terms

- **Source image**: the decoded local image before crop or scaling.
- **Subject crop**: the normalized source rectangle selected manually or by safe auto-trim.
- **Pattern grid**: the editable `cols × rows` matrix. Each cell is empty or references one palette code.
- **Physical board**: a pegboard capacity and bead pitch. It is not the pattern resolution.
- **Placement**: a compact pattern plus its offset inside a physical board.
- **Bead count**: the number of non-empty pattern cells. Empty board capacity is not a bead.
- **Palette code**: a stable string such as `H2` or `F12`; JSON never relies on array position.
- **Component owner**: the connected source-line component responsible for a projected black cell.
- **Unrepresentable component**: a source component that cannot claim even one target cell without an invalid collision.
- **Construction sheet**: the exported flat pattern with codes, coordinates, guide lines, seams, and counts.

## Invariants

1. `cells.length === cols * rows`.
2. Every cell is empty or a known palette code/index.
3. `sum(materialCounts) === numberOfNonEmptyCells`.
4. A contain conversion never crops source content.
5. A pattern is never non-uniformly stretched into a board.
6. Geometry, conversion, statistics, preview, and export derive from the same grid.
7. Stale asynchronous conversion results cannot replace a newer project state.
8. A diagnostic may acknowledge lost information; UI copy must not contradict it.

## Architecture vocabulary

Use **Module**, **Interface**, **Implementation**, **Depth**, **Seam**, **Adapter**, **Leverage**, and **Locality** when discussing architecture. A proposed Seam should have at least two real Adapters or an immediate test need. A Module should hide more decisions than its Interface exposes.
