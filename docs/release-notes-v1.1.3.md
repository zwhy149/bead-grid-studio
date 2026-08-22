# Bead Grid Studio v1.1.3

## What's new

- **Copyable bead shopping list.** Material Counts now has a one-tap “复制购豆清单 / Copy bead list” action. It copies every color code, localized name, quantity, and share as plain text — ready to paste into notes or an order message — with a fallback path for browsers without the async clipboard API.
- **Per-color share visualization.** Every material row shows its share of total beads as a percentage plus a proportional bar, so dominant colors stand out before you order.
- Added complete Simplified Chinese and English strings for the new UI and two browser self-test regressions covering share rounding.

The conversion algorithm, project format, and palette values are unchanged.

## Why v1.1.3 and not v1.1.2

The v1.1.2 tag name is permanently reserved by GitHub: the first v1.1.2 release was created as an immutable release and then deleted to correct commit authorship, and GitHub never allows reusing a tag name from a deleted immutable release. The features below ship unchanged as v1.1.3.

## Who should update

Everyone who orders beads from the generated counts. Patterns generated with v1.1.0 or v1.1.1 load and export identically.

## Download

For offline use, download `bead-grid-studio-v1.1.3.html` from **Assets**. The ZIP is for redistribution with documentation. GitHub's automatically generated Source Code archives are not the offline app.

## Checksums

Compare downloaded assets only with `SHA256SUMS.txt` from the same Release.

```bash
sha256sum --check SHA256SUMS.txt
```
