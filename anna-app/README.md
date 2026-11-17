# Bead Grid Studio — Anna AI OS Edition

This directory packages **Bead Grid Studio** as a native **Anna AI OS App** (`schema: 4`) eligible for the Anna App Store and Founding Builder Program.

## Architecture

- **`manifest.json` (`schema: 4`)** — Declares the static SPA bundle (`bundle/`), desktop + mobile form factors (`["desktop", "mobile"]`), small-screen-safe window geometry (`min_size: 360x520`), and bundled Executas (`bead-studio` + `bead-craft-coach`).
- **`app.json`** — Store listing metadata (category: `creative`, screenshots, privacy link, bundled Executa paths).
- **`executas/bead-studio/`** — Self-contained Node.js JSON-RPC 2.0 stdio Executa powered by `@bead-grid/core` (zero external npm dependencies):
  - `create_pixel_pattern`: turns LLM-designed character matrices into MARD-221 patterns + SVG sheets.
  - `generate_pattern`: quantizes PNG files into MARD-221 bead grids.
  - `optimize_pattern`: runs stray-bead despeckling, rare-color merge recommendations, and crafting complexity analysis.
  - `lookup_palette`: perceptual CIEDE2000 lookup against the 221-code catalog.
- **`executas/bead-craft-coach/`** — Declarative `SKILL.md` guiding Anna Assistant to design matrices, optimize kits, and launch/update the interactive canvas.
- **`bundle/`** — Built automatically from root Vite output (`npm run build:anna` from repo root).

## Local Development & Publishing

1. Build the bundle and sync the self-contained Executa vendor files from the repository root:

   ```bash
   npm run build:anna
   ```

2. Validate and run locally with `@anna-ai/cli`:

   ```bash
   cd anna-app
   anna-app validate --strict
   anna-app dev
   ```

3. Before publishing to [Anna Developer Console](https://anna.partners/executa):
   - Mint real `tool_id`s for `bead-studio` and `bead-craft-coach` and update `executa.json` / `manifest.json` (or publish directly with `anna-app apps publish` when using `bundled:<handle>`).
