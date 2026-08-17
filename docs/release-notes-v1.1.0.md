# Bead Grid Studio v1.1.0

## What's new

- A complete Simplified Chinese / English interface, including runtime messages, accessibility labels, construction sheets, and paged printing.
- A beginner first screen with **Try a Sample**, **Choose Image**, and an offline-download path.
- A post-generation action bar for exporting, saving, sharing or copying the official link, reporting issues, and contributing.
- Optional Before/After share cards in 1200×675 landscape and 1080×1440 portrait formats.
- A brand-neutral palette-provider contract; the pinned MARD-compatible base 221 catalog remains the only built-in provider.
- Real bilingual screenshots, bilingual legal pages, SEO metadata, sitemap, and opt-in GitHub repository metrics tooling.

The conversion algorithm, project format, and palette values are unchanged from v1.0.2.

## Who should update

Update if you need English UI, simpler first-run guidance, social sharing, or clearer contribution and deployment paths. This is not an urgent security release.

## Download

For offline use, download `bead-grid-studio-v1.1.0.html` from **Assets**. The ZIP is for redistribution with documentation. GitHub's automatically generated Source Code archives are not the offline app.

## Known limitations

- A detail smaller than one target cell may still be physically unrepresentable.
- Project JSON intentionally does not embed the source image, so a loaded project cannot create a Before/After share card until the source image is selected again.
- Screen colors remain approximations; verify large purchases against a physical card for the exact brand and batch.

See [`docs/limitations.md`](limitations.md) for the complete maintained list.

## Checksums

Compare downloaded assets only with `SHA256SUMS.txt` from the same Release.

```bash
sha256sum --check SHA256SUMS.txt
```
