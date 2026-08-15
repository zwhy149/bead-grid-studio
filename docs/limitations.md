# Known limitations

## Information capacity

A 16×16 pattern has only 256 cells. Details smaller than one cell cannot all be represented. The line-art diagnostics distinguish this physical limit from a conversion failure.

## Photographs

Small photographs require artistic simplification. Face identity, smooth gradients, hair strands, and background texture compete for the same cells. Crop one subject tightly and choose a larger long side for better results.

## Text and documents

At 100 cells or less, ordinary document text is usually below readable cell height. Document mode preserves layout, frames, diagrams, and large color blocks; it does not promise readable body text.

## Color

Screen colors vary from physical beads due to display calibration, ambient light, manufacturer, material, and production batch. Use a physical color card for final purchasing decisions.

## Browsers and memory

Very large grids and high zoom levels require substantial Canvas memory. The app caps decode, render, and export pixels and may reduce zoom/export resolution on low-memory devices.

## Project files

JSON projects store the editable grid and settings but do not embed the source image. Reopening a project restores the pattern, not the original reference raster.
