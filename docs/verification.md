# Verification report

Release target: 1.1.1
Date: 2026-08-17

## Repeatable repository gates

- Source checks: unique DOM ids, relative deploy paths, palette shape, service-worker scope/cache constraints.
- Unit tests: locale priority and normalization, long-side sizing, portrait/EXIF orientation, extreme ratios, real-board placement, contain/cover costs, palette-provider shape, counts, and anchors.
- Browser tests: Chinese/English switching, bundled sample generation, Web Share and Copy Link paths, exact social-card dimensions, 360/390/768/1440 responsive bounds, desktop/mobile layouts, runtime errors, mobile tool-sheet focus behavior, 80 built-in conversion regressions, a real upload → Worker → resize → PNG download path, scoped PWA cache cleanup, offline legal pages, and direct `file://` execution of the portable HTML.
- Build: Vite PWA assets plus a single-file HTML with inlined JavaScript/CSS and SHA-256 output.

Run all gates with:

```bash
npm run qa
```

## Conversion invariants covered in the built-in suite

- deterministic repeated output;
- transparent background remains empty;
- enclosed white subject is not deleted with exterior white background;
- thin black outline support is monotonic;
- dark neutral protection does not erase true deep blue/brown/purple;
- rare semantic red/yellow/blue details survive color limiting fixtures;
- neutral colors are not merged into saturated colors merely to meet a limit;
- document frames/diagonals/blocks and text suppression;
- aspect and physical-board placement;
- all base 221 codes and H1/H2/H7 policy;
- small-line-art connected-component separation, scan-edge rejection, missing-detail diagnostics, and deterministic counts;
- project validation and display-code contrast.

## Interpretation

Passing tests means the stated invariants hold for the fixtures. It does not mean every source image becomes artistically perfect, every physical bead batch matches a screen, or a detail smaller than one target cell can be preserved. Conversion-quality Issues should add the smallest legal fixture that exposes the missing invariant.

GitHub Pages does not apply the repository's optional `public/_headers` file. The
Pages demo therefore relies on GitHub's platform defaults plus the app's local
input validation; deployments that require the documented custom security
headers should use a host that supports `_headers`, such as Cloudflare Pages.
