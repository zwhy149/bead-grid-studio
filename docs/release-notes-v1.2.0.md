# Bead Grid Studio v1.2.0

## What's new

- **Making Assistant** isolates one active color on the working canvas, dims unrelated cells, and marks completed colors with a clear check.
- Color-by-color progress shows completed beads and colors, moves to the next unfinished code, and supports previous, next, show-all, and reset controls.
- Editable project files and local recovery drafts now retain completed color codes and the active color without embedding the source image.
- The material panel can export a UTF-8 CSV containing code, localized color name, screen-reference HEX, quantity, and completion state.
- Material rows now provide accessible focus and completion controls in both Simplified Chinese and English.

The 221-color catalog, screen-reference values, conversion algorithm, grid geometry, and project format version remain unchanged.

## Who should update

Update if you build directly from the screen, need to resume a long pattern across sessions, or want a spreadsheet-friendly purchasing and progress list.

## Download

For offline use, download `bead-grid-studio-v1.2.0.html` from **Assets**. The ZIP is for redistribution with documentation. GitHub's automatically generated Source Code archives are not the offline app.

## Known limitations

- Completion is tracked per color, not per arbitrary region of a large board.
- The CSV HEX column is a screen reference and does not replace a physical color card for the exact brand and production batch.
- A detail smaller than one target cell is still physically unrepresentable.

## Checksums

Compare downloaded assets only with `SHA256SUMS.txt` from the same Release.

```bash
sha256sum --check SHA256SUMS.txt
```
