# Contributing

Thanks for helping make physical bead patterns more reliable.

## Before opening an Issue

- Search existing Issues.
- Reproduce on the latest live demo or `main` build.
- Remove private data from project titles and screenshots.
- Only upload images you have the right to publish.

Use the conversion-quality form for extra/missing beads, merged components, wrong colors, background mistakes, or scale instability. Include source dimensions, target grid, fit mode, conversion mode, expected structure, and actual result. A minimal synthetic fixture is preferable to a copyrighted character image.

## Development

```bash
npm run setup
npm run dev
npm run qa
```

Node.js 22.12 or newer is required. `npm run setup` installs dependencies and the Chromium/Firefox/WebKit test browsers. Pull requests should keep `npm run qa` green.

## Design and architecture rules

- Preserve the invariants in `CONTEXT.md`.
- Use Module, Interface, Implementation, Depth, Seam, Adapter, Leverage, and Locality in architecture proposals.
- Do not add a Seam for a hypothetical platform without two real Adapters or an immediate test use.
- Keep conversion changes deterministic; random algorithms need a fixed seed in the public Interface.
- Add a failing regression before fixing an algorithm defect.
- Avoid combining framework migration, visual redesign, and conversion changes in one pull request.
- Delete the replaced Implementation when a refactor is complete.

## Fixtures

Accepted fixtures must be original, CC0, public-domain, or accompanied by clear redistribution permission. Add a short provenance note when the answer is not obvious. Do not submit customer images, private photos, copyrighted characters, shop screenshots, or scraped social-media examples.

## Palette data

Palette changes require:

- stable codes;
- source URL and pinned version/date;
- redistribution license;
- measurement method when values come from physical samples;
- migration and exact-code tests.

Do not label community-created color names as official manufacturer names.

## Pull request scope

A useful pull request explains:

1. the observed problem;
2. the invariant or user outcome that should hold;
3. the smallest Implementation change;
4. the tests that would fail without it;
5. visual/memory/performance trade-offs.

By submitting a contribution, you agree that it is licensed under Apache License 2.0, the repository's inbound license.
