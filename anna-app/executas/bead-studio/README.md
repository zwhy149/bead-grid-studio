# bead-studio Executa Plugin (Node.js)

Stdio JSON-RPC 2.0 tool plugin for **Anna AI OS** powered by `@bead-grid/core`.

## Tools

- `create_pixel_pattern` — Compile an ASCII/character matrix + `colorMap` into a validated MARD-221 pattern + SVG sheet.
- `generate_pattern` — Quantize a PNG file into a bead grid with optional stray-bead despeckling.
- `optimize_pattern` — Clean stray beads, merge rare colors, and compute crafting complexity metrics.
- `lookup_palette` — Match HEX colors or codes against MARD-compatible 221 bead codes via CIEDE2000.

## Smoke Test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"describe"}' | node bead_studio_plugin.js
```
