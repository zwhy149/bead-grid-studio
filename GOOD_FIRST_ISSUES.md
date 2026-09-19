# Good First Issues for New Contributors

Welcome to the Bead Grid Studio contributor community! If you are looking to make your first open-source contribution, here are curated areas where beginner and intermediate contributors can make an immediate impact.

---

## 1. Add Community Palettes (No Coding Required)

**Difficulty**: Beginner  
**Tags**: `good first issue`, `palette`, `community`

Help expand our library of standard craft color sets! You can contribute curated color palette JSON files in `examples/palettes/`:
- **Examples**:
  - Pastel 24-color starter kit
  - Earth tone 16-color wildlife palette
  - Neon / Cyberpunk 8-color mini palette
- **Requirements**:
  - Validates against `schema/palette.schema.json`
  - Accurate physical hex codes (`#RRGGBB`)
  - Unique color codes (e.g. `P01`, `P02`) and names
- **Reference**: See [Palette Format Documentation](docs/palette-format.md).

---

## 2. Framework Integration Examples

**Difficulty**: Intermediate  
**Tags**: `ecosystem`, `examples`, `help wanted`

Demonstrate how to embed `@bead-grid/core` into modern web frameworks. Create a minimal standalone demo in `examples/`:
- `examples/react-canvas/` (Next.js or Vite + React)
- `examples/vue-component/` (Vue 3 `<BeadCanvas />`)
- `examples/svelte-app/` (Svelte 5 interactive grid)
- **Requirements**:
  - Clean, minimal boilerplate
  - Self-contained `README.md` with startup instructions
  - 100% client-side execution with zero telemetry

---

## 3. Documentation Localization

**Difficulty**: Beginner  
**Tags**: `documentation`, `i18n`

Help make Bead Grid Studio accessible to crafters worldwide by translating documentation into additional languages:
- Translate `docs/getting-started.md` or `docs/palette-format.md` into Japanese (`ja-JP`), Spanish (`es-ES`), or German (`de-DE`).
- Ensure technical terms (perceptual color space, quantization, pegboard) are accurately translated.

---

## 4. Test Fixtures & Golden Patterns

**Difficulty**: Beginner to Intermediate  
**Tags**: `testing`, `core`

Add test fixtures for challenging edge cases:
- Transparent PNG sprites with semi-transparent alpha borders.
- Highly detailed pixel art with 1-pixel hairline borders.
- Extreme aspect ratio banners (e.g., 100x10 or 12x120).
- Golden pattern test cases in `tests/unit/core.test.js`.

---

## Contribution Workflow

1. Fork the repository and clone your fork locally.
2. Create a feature branch: `git checkout -b feature/my-new-palette`.
3. Verify your changes pass quality checks:
   ```bash
   npm run check
   npm run test:unit
   npm run test:e2e:ci
   ```
4. Push to your fork and submit a Pull Request. We review PRs promptly!
