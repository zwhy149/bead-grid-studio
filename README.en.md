<p align="center">
  <img src="docs/assets/social-preview.png" alt="Bead Grid Studio — local-first fuse-bead pattern generator" width="100%">
</p>

<p align="center">
  <a href="README.md"><strong>简体中文</strong></a> · <strong>English</strong>
</p>

<p align="center">
  <a href="https://zwhy149.github.io/bead-grid-studio/"><strong>Live demo</strong></a> ·
  <a href="https://github.com/zwhy149/bead-grid-studio/releases/latest"><strong>Offline download</strong></a> ·
  <a href="#first-use"><strong>Beginner guide</strong></a> ·
  <a href="#deploy-your-own-site"><strong>Deploy</strong></a>
</p>

<p align="center">
  <a href="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/zwhy149/bead-grid-studio/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-87351c"></a>
  <a href="https://github.com/zwhy149/bead-grid-studio/releases"><img alt="Release" src="https://img.shields.io/github/v/release/zwhy149/bead-grid-studio?display_name=tag"></a>
</p>

# Bead Grid Studio: a local-first fuse-bead pattern generator

Bead Grid Studio (豆格工坊) converts an image into an editable, printable fuse-bead / perler-bead pattern with per-cell color codes, four-side coordinates, board guides, seams, and material counts.

All source pixels stay in the browser. The community edition has no image-upload API, account, analytics SDK, or cloud conversion service.

The project does not promise lossless reproduction at 16 or 24 cells. It protects outlines, openings, and disconnected features when the target grid can represent them, then reports details that are physically smaller than one bead.

## Choose your path

| Goal | Fastest route | Installation |
| --- | --- | --- |
| Convert an image now | [Open the live demo](https://zwhy149.github.io/bead-grid-studio/) | None |
| Work offline or carry the app on a USB drive | [Download the portable HTML](https://github.com/zwhy149/bead-grid-studio/releases/latest) | None |
| Publish your own copy | [GitHub Pages / Cloudflare Pages guide](docs/deployment.md) | GitHub account; Cloudflare optional |
| Modify or contribute code | [Run locally](#run-locally-for-development) | Node.js |

## First use

1. Open the [live demo](https://zwhy149.github.io/bead-grid-studio/) and choose an image.
2. Select PNG, JPEG, WebP, or GIF. The image remains in the current browser.
3. Wait for Beginner mode to prepare a recommended pattern. Check its aspect ratio, grid size, color count, and warnings.
4. Increase the long-side cell count when the result is too coarse. Crop to one subject when the source contains excessive empty space. Do not force a wide image into a square pattern.
5. Use the brush, eraser, picker, mirror, rotate, undo, and redo tools for final corrections.
6. Export a construction-sheet PNG with cell codes, coordinates, guide lines, board seams, and material counts.

Save the JSON project when you need to continue editing. Project JSON deliberately does not embed the reference image; choose the source image again when you need the visual reference.

## Download the offline edition

Regular users do not need the source code or Node.js:

1. Open the [latest Release](https://github.com/zwhy149/bead-grid-studio/releases/latest).
2. Expand **Assets** near the bottom of the Release page.
3. Download the file named like `bead-grid-studio-vX.Y.Z.html`, where `X.Y.Z` is the version. Do not use GitHub's automatically generated `Source code` archive as the app.
4. Double-click the HTML and open it with Chrome, Edge, Firefox, or Safari.
5. To update, download the newer HTML. Older JSON projects remain subject to the documented project-format migration rules.

The Release also includes a ZIP and `SHA256SUMS.txt`. Compare a download only with checksums from the **same Release**:

```powershell
# Windows PowerShell: run from the download directory
Get-FileHash .\bead-grid-studio-vX.Y.Z.html -Algorithm SHA256
Get-Content .\SHA256SUMS.txt
```

```bash
# Linux, after downloading the HTML, ZIP, and SHA256SUMS.txt from one Release
sha256sum --check SHA256SUMS.txt

# macOS: calculate one file and compare it with SHA256SUMS.txt
shasum -a 256 bead-grid-studio-vX.Y.Z.html
```

The portable HTML embeds its JavaScript, CSS, Apache-2.0 license, and third-party notices, with no CDN dependency.

On phones, prefer the hosted PWA and use the browser's “Add to Home Screen” action. Mobile operating systems vary in how they open a downloaded local HTML file.

The PWA must load once from an HTTPS site before its cached pages can open offline. Drafts live in the current browser's site storage; export a JSON project before switching browsers or clearing site data.

## What each area does

- **Image and conversion**: upload, crop, contain/cover choice, and reference-layer opacity.
- **Pattern size**: “clarity” controls the pattern's long side; “real board” centers an aspect-safe pattern inside a physical board.
- **Advanced settings**: conversion mode, maximum colors, and similar-color merging. Beginners can keep the recommendation.
- **Drawing and transforms**: brush, eraser, picker, mirror, rotate, undo, and redo.
- **Palette**: 221 compatible base codes; opaque images use 220 solid codes, while transparent `H1` is manual-only.
- **Export**: construction PNG, editable JSON, and print preview. Verify warnings, codes, bead total, and board count before buying materials.

## Screenshots

| Desktop workbench | Mobile workbench |
| --- | --- |
| ![Desktop workbench](docs/assets/app-desktop.png) | ![Mobile workbench](docs/assets/app-mobile.png) |

The rocket artwork is an original fixture in `tests/fixtures/` and may be reused under this repository's license.

## Deploy your own site

### GitHub Pages: easiest first deployment

1. **Fork** this repository into your GitHub account.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. If Actions are disabled on the fork, enable them from the **Actions** tab.
4. Run `Deploy GitHub Pages`, or push a commit to `main`.
5. The resulting URL is normally `https://YOUR-NAME.github.io/bead-grid-studio/`.

The repository already contains the build, complete QA, and Pages workflow. Do not commit `dist` manually. See the [deployment guide](docs/deployment.md) and [GitHub's official custom-workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Cloudflare Pages: custom domains and `_headers`

Connect a forked Git repository with:

```text
Root directory: leave empty (repository root)
Build command: npm run build
Build output directory: dist
Node.js: .nvmrc pins 24; set NODE_VERSION=24 only if the platform does not read it
```

Alternatively, run `npm ci && npm run build`, then upload the **dist directory** with Cloudflare Pages Direct Upload. Do not upload the repository root. A Direct Upload project cannot later be converted in place to Git integration, so choose the project type deliberately. See the [deployment guide](docs/deployment.md) and [Cloudflare's official Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Run locally for development

Node.js 22.12 or newer is required:

```bash
git clone https://github.com/zwhy149/bead-grid-studio.git
cd bead-grid-studio
npm ci
npm run dev
```

Open the address printed in the terminal; the default is `http://127.0.0.1:4173/`.
The server uses a strict port: if 4173 is occupied it exits instead of silently choosing another port. Stop the conflicting process or change `vite.config.js`.

To install test browsers and run every quality gate:

```bash
npm run setup
npm run qa
```

`npm run qa` checks source/license/palette invariants, eight pure-function tests, Chromium/Firefox/WebKit E2E, and the application's 80 built-in conversion regressions.

## Main capabilities

- Topology-aware refinement for small black-and-white line art.
- Line-art/cartoon, detail, photo, document, and pixel-sampling modes.
- Aspect locking, safe auto-trim, contain/cover previews, and manual crop.
- Common 2.6 mm and 5 mm real-board layouts without non-uniform pattern scaling.
- MARD-compatible base 221-code catalog with pinned provenance.
- Brush, eraser, picker, mirror, rotate, undo, redo, and JSON projects.
- Construction-sheet PNG with codes, coordinates, thick guides, seams, and counts.
- Responsive desktop/mobile UI, installable PWA, and portable single-file HTML.
- Deterministic conversion regressions, pure geometry tests, and public CI.

## Why a small grid cannot be “identical”

A grid is an information budget: 16×16 provides only 256 physical positions. A facial mark, thin letter, or highlight smaller than one cell cannot always remain an independent bead.

For line art, the converter analyzes a target-independent intermediate grid, tracks source connected-component ownership, and prevents separate components from merging after projection. It may preserve a best-supported cell for a tiny component when that does not create a conflict. Otherwise it reports the missing detail and suggests a larger grid or manual edit. See [Algorithm](docs/algorithm.md) and [Known limitations](docs/limitations.md).

## Palette and physical color accuracy

The default catalog is the base 221-code subset (`A/B/C/D/E/F/G/H/M`) from a pinned MIT-licensed data source. `H1` is transparent and excluded from opaque-image quantization; `H2` is the white anchor; `H7` is black.

Screen HEX values are approximations. Displays, room light, printers, manufacturers, and production batches introduce differences. Verify expensive builds against the physical color card for the exact bead brand and batch. See [Palette provenance](docs/palette-provenance.md).

MARD, Artkal, Hama, and Perler are third-party marks. This project is not affiliated with or endorsed by those brands. See [TRADEMARKS.md](TRADEMARKS.md).

## Privacy and security

- Images are decoded, converted, and exported locally.
- Project JSON does not embed the reference image or its original filename.
- SVG and HTML image uploads are rejected.
- File, decoded-pixel, JSON, render, and export sizes are bounded.
- Conversion runs in a cancellable Worker with stale-result rejection.
- The service worker caches only same-origin application assets.

Report security issues through [SECURITY.md](SECURITY.md). Do not attach private, customer, or unlicensed images to a public Issue.

GitHub Pages does not apply the optional `_headers` file. See [Deployment notes](docs/deployment.md) for the exact hosting boundary.

## Repository and contributing

```text
src/                      browser app, geometry Module, and palette data
public/                   PWA shell, offline cache, privacy, and legal pages
tests/unit/               pure invariant tests
tests/e2e/                desktop and mobile browser tests
tests/fixtures/           original or explicitly licensed fixtures
scripts/                  source checks, screenshots, and portable build
docs/                     architecture, algorithm, deployment, provenance, ADRs
```

A useful conversion-quality Issue includes source dimensions, target grid, selected mode, expected structure, actual defect, and a fixture you may legally publish. Read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing. See [ROADMAP.md](ROADMAP.md) for acceptance criteria.

## Platform direction

The main product is one responsive Web/PWA plus a portable HTML, targeting modern browsers on Windows, macOS, Linux, Android, and iOS. Tauri, Capacitor, or mini-program Adapters should only be considered after real file/printing/store demand and a maintainer exist.

## License

Code is licensed under [Apache-2.0](LICENSE). Third-party data and build-tool notices are in [NOTICE](NOTICE). The license permits commercial reuse; it does not grant rights to the Bead Grid Studio name, logo, or third-party marks.

If the project saves you a manual redraw, consider starring it, sharing it with another maker, or filing a reproducible improvement. Stars never unlock features.
