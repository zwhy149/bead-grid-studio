# Bead Grid Studio v1.1.1

## What's fixed

- Completed Simplified Chinese and English messages for the per-cell code toggle, document-mode guidance, safe image-decoding failures, and conversion recovery paths.
- Strengthened the repository source gate to detect missing runtime translation keys even when a key is chosen through a conditional expression.
- Added an end-to-end accessibility regression so internal translation key names cannot appear as labels or tooltips.

The conversion algorithm, project format, palette values, and v1.1.0 onboarding/share workflow are unchanged.

## Who should update

All v1.1.0 users should update. The patch primarily improves accessibility and rare error-path guidance; generated patterns do not change.

## Download

For offline use, download `bead-grid-studio-v1.1.1.html` from **Assets**. The ZIP is for redistribution with documentation. GitHub's automatically generated Source Code archives are not the offline app.

## Checksums

Compare downloaded assets only with `SHA256SUMS.txt` from the same Release.

```bash
sha256sum --check SHA256SUMS.txt
```
