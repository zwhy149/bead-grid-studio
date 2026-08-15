# Roadmap

The roadmap is evidence-driven. An item moves into a release only when it has acceptance tests and a maintainer.

## 1.1 — Conversion core extraction

- [ ] DOM-free `ConversionEngine` Module with a small public Interface.
- [ ] Worker and inline test Adapters with identical result validation.
- [ ] Golden fixtures for transparent art, black/white line art, photos, documents, and extreme aspect ratios.
- [ ] Public benchmark table for 16/24/32/48/60-cell outputs.
- [ ] Versioned diagnostics contract.

## 1.2 — Making workflow

- [ ] Focus mode with current-color isolation and completed-region tracking.
- [ ] Progress saved locally without source-image upload.
- [ ] Keyboard and screen-reader workflow for marking sections complete.
- [ ] Paginated SVG/PDF export by physical board.

## 1.3 — Palette extension

- [ ] Versioned custom palette import with provenance fields.
- [ ] Palette exclusion/remapping that preserves project codes.
- [ ] Additional catalogs only with verifiable data and redistribution rights.

## Platform decision gates

- **Tauri desktop**: consider after repeated requests for native file/print integration and a Windows maintainer.
- **Capacitor mobile**: consider after app-store discovery or system-share requirements are demonstrated.
- **Mini program**: consider only with a dedicated maintainer and a tested Canvas/Worker/file Adapter.
- **Electron**: not planned unless a fixed Chromium/Node runtime becomes a hard requirement.

Creating empty platform shells is not a roadmap milestone.
