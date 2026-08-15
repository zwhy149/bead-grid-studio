# Pinned palette source

`mard-291.csv` is an unmodified snapshot of `gen/v1/mard.csv` from
[`maxcleme/beadcolors`](https://github.com/maxcleme/beadcolors) at commit
`94b99999652866f1a1879d6369fe735f811949e5`.

- Upstream license: MIT (reproduced in the repository `NOTICE`)
- File SHA-256: `898BBEAC2C2BCF41E5293554E46545F42628FBD2CB2BC3E3C9313C889DBBE700`
- Rows: 291, without a header
- Columns: `ref,name,r,g,b,hex,contributor`

The shipped base catalog is derived by filtering the `A/B/C/D/E/F/G/H/M`
series, not by slicing the first 221 rows. Run `npm run check` to verify every
local base code and HEX value against this immutable snapshot.
