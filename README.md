<p align="center">
  <img src="docs/assets/social-preview.png" alt="Bead Grid Studio — topology-aware fuse-bead pattern generator" width="100%">
</p>

<p align="center">
  <a href="https://zwhy149.github.io/bead-grid-studio/"><strong>Live demo</strong></a> ·
  <a href="https://github.com/zwhy149/bead-grid-studio/releases/latest"><strong>Portable HTML</strong></a> ·
  <a href="docs/algorithm.md"><strong>How it works</strong></a> ·
  <a href="README.zh-CN.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-87351c"></a>
  <a href="https://github.com/zwhy149/bead-grid-studio/releases"><img alt="Release" src="https://img.shields.io/github/v/release/zwhy149/bead-grid-studio?display_name=tag"></a>
</p>

# Bead Grid Studio

Bead Grid Studio (豆格工坊) turns a local image into an editable, printable fuse-bead pattern with per-cell color codes, coordinates, board guides, and material counts.

Its distinguishing goal is not to invent detail that cannot fit. It preserves line-art topology at small grid sizes where possible, protects disconnected features, and reports when a feature is physically smaller than one bead.

All image pixels stay in your browser. There is no upload API, account, analytics SDK, or cloud conversion service in the community edition.

## Why this project exists

Most image-to-pixel converters optimize visual similarity at normal viewing distance. A usable bead pattern has different constraints:

- one output cell must map to exactly one physical bead;
- disconnected eyes, mouth marks, outlines, and openings should not merge accidentally;
- the source aspect ratio must not be stretched to fill a square board;
- empty board space and white beads are different states;
- every exported count must equal the non-empty cells in the pattern.

Bead Grid Studio treats these as invariants rather than visual preferences.

## What is included

- Topology-aware refinement for small black-and-white line art.
- Detail, photo, cartoon, document, and pixel-art conversion modes.
- Aspect-ratio locking, safe auto-trim, cover/contain previews, and crop controls.
- Real-board layouts for common 2.6 mm and 5 mm pegboards without stretching the pattern.
- MARD-compatible base 221-code palette with pinned data provenance.
- Brush, eraser, picker, mirror, rotate, undo, redo, and JSON project files.
- Printable PNG with cell codes, four-side coordinates, thick guide lines, board seams, and counts.
- Responsive desktop/mobile UI, installable PWA, and a portable single-file HTML release.
- Deterministic browser regression tests plus pure geometry tests.

## Screenshots

| Desktop workbench | Mobile workbench |
| --- | --- |
| ![Desktop workbench](docs/assets/app-desktop.png) | ![Mobile workbench](docs/assets/app-mobile.png) |

The rocket artwork in these screenshots is an original fixture stored in `tests/fixtures/` and may be reused under this repository's license.

## One-minute start

Requirements: Node.js 22.12 or newer.

```bash
git clone https://github.com/zwhy149/bead-grid-studio.git
cd bead-grid-studio
npm install
npx playwright install chromium firefox webkit
npm run dev
```

Open `http://127.0.0.1:4173/`.

For a 30-second trial, open the live demo, choose an image, and export the automatically generated construction sheet. No sign-in is required and the image is not uploaded.

For users who do not want a development environment, download `bead-grid-studio-v*.html` from the latest Release and open it directly in a modern browser.

## Quality gates

```bash
npm run check       # source, palette, PWA, and invariant checks
npm run test:unit   # pure geometry tests
npm run build       # PWA build + portable HTML
npm run test:e2e    # desktop and mobile browser tests
npm run qa          # all of the above
```

The browser suite runs against the production `dist` build in Chromium, Firefox, and WebKit and also executes the application's 80 built-in conversion regressions. The public CI must pass before a release is created. See the [verification report](docs/verification.md).

## Small-grid behavior

For line art, the converter analyzes the subject at a target-independent intermediate resolution, tracks source connected-component ownership, and separates components after projection. It may force a best-supported cell for a tiny feature when doing so does not collide with another component.

This does **not** make every image identical at 16 or 24 cells. A one-pixel facial mark can become smaller than one physical bead. When that happens, diagnostics report the unrepresentable component instead of silently claiming a perfect result. See [Algorithm](docs/algorithm.md) and [Known limitations](docs/limitations.md).

## Project layout

```text
src/
  app.js                  browser editor and conversion pipeline
  core/geometry.js        pure aspect-ratio and board geometry Module
  palettes/mard221.js     versioned 221-code PaletteCatalog data
public/                   PWA shell, legal pages, and offline cache
tests/
  unit/                   pure invariant tests
  e2e/                    desktop/mobile browser tests
  fixtures/               original or explicitly licensed fixtures
scripts/                  source checks, screenshots, portable build
docs/                     architecture, algorithm, provenance, ADRs
```

The current first release intentionally extracts the highest-risk geometry Interface without rewriting the stable conversion pipeline. The next architecture milestone is a DOM-free `ConversionEngine` Module with Worker and inline Adapters. See [Architecture](docs/architecture.md).

## Palette and brand accuracy

The default palette is the base 221-code subset (`A/B/C/D/E/F/G/H/M`) derived from the pinned MIT-licensed `maxcleme/beadcolors` dataset. `H1` is transparent and excluded from opaque-image quantization; `H2` is the white anchor; `H7` is black.

Screen HEX values are approximations. Displays, room light, printers, manufacturers, and production batches all introduce differences. Verify expensive builds against the physical color card for the beads you will actually use. Details are in [Palette provenance](docs/palette-provenance.md).

MARD, Artkal, Hama, and Perler are third-party marks. This independent project is not affiliated with or endorsed by those brands. See [TRADEMARKS.md](TRADEMARKS.md).

## Privacy and security

- Images are decoded and converted locally.
- Project JSON does not embed the source image.
- SVG and HTML uploads are rejected.
- Image size, decoded pixels, JSON size, render pixels, and export pixels are bounded.
- Conversion runs in a cancellable Worker with stale-result rejection.
- The service worker caches only same-origin application assets.

Security reports should follow [SECURITY.md](SECURITY.md). Do not attach private or copyrighted customer images to a public Issue.

The GitHub Pages demo cannot apply the optional `_headers` file; see [Deployment notes](docs/deployment.md) for the exact hosting boundary.

## Contributing

Conversion-quality reports are especially valuable when they include the source dimensions, target grid, selected mode, expected structure, and an image you are legally allowed to publish. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the dedicated conversion-quality Issue Form.

Good first contributions include tests, translations, accessible interaction fixes, verified palette provenance, print layouts, and small pure-function extractions. A new platform directory should only be added with a working Adapter and a maintainer.

## Roadmap

The community edition is Web/PWA first. Native-looking empty shells are not a goal.

1. Extract the conversion engine into a DOM-free tested Module.
2. Add golden fixtures and benchmark reports for 16–60-cell patterns.
3. Add focus/assembly progress mode and paginated vector export.
4. Consider a Tauri desktop Adapter only after demonstrated file/printing demand.
5. Consider mobile-store or mini-program Adapters only with maintainers and real channel demand.

See [ROADMAP.md](ROADMAP.md) for the acceptance criteria.

## Inspiration and independent implementation

The open-source project [Zippland/perler-beads](https://github.com/Zippland/perler-beads) helped demonstrate demand for a local-first responsive bead-pattern PWA. Bead Grid Studio does not copy its code, UI text, artwork, icons, or palette files; the conversion pipeline and interface are independently implemented. The referenced repository is AGPL-3.0 licensed.

## License

Code is licensed under [Apache License 2.0](LICENSE). Third-party data notices are in [NOTICE](NOTICE). The license permits commercial reuse; it does not grant rights to the project name, logo, or third-party brand marks.

Bead Grid Studio grows through reproducible bug reports, redistributable fixtures, documentation, translations, and code contributions. If it saves you a manual redraw, consider starring the repository or sharing it with another maker; stars never unlock features.
