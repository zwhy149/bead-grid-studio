# Palette provenance

## Default catalog

The community edition ships a **MARD-compatible base 221-code subset**:

| Series | Range | Count |
| --- | --- | ---: |
| A | A1–A26 | 26 |
| B | B1–B32 | 32 |
| C | C1–C29 | 29 |
| D | D1–D26 | 26 |
| E | E1–E24 | 24 |
| F | F1–F25 | 25 |
| G | G1–G21 | 21 |
| H | H1–H23 | 23 |
| M | M1–M15 | 15 |
| Total | 9 series | 221 |

Special/extension series such as P, Q, R, T, Y, and ZG are not part of the default base catalog.

## Machine source

- Project: [`maxcleme/beadcolors`](https://github.com/maxcleme/beadcolors)
- License: MIT
- Pinned commit: `94b99999652866f1a1879d6369fe735f811949e5`
- Generated source: `gen/v1/mard.csv`
- Full 291-row file SHA-256 observed during verification: `898BBEAC2C2BCF41E5293554E46545F42628FBD2CB2BC3E3C9313C889DBBE700`

The base subset is selected by series prefix, not by taking the first 221 rows. The upstream `name` field is generally the code, so this project does not present invented Chinese names as official color names.

## Quantization policy

- `H1`: transparent; kept in the catalog but excluded from ordinary opaque-image matching.
- `H2`: white anchor; catalog RGB is near white and the UI/export renders its fill as `#FFFFFF`.
- `H7`: black anchor (`#000000`).

## Accuracy statement

HEX/RGB data is suitable for deterministic screen matching, not proof of a manufacturer's current physical formula. Compare against a physical color card under your working light before buying large quantities. If a verified physical measurement dataset is contributed, it must include source, date, instrument/lighting method, license, and batch notes.

The use of a brand name or compatible code does not imply affiliation, authorization, or endorsement.
