# Privacy-Preserving Aggregate Metrics Proposal

> **Status**: Design Proposal (NOT Deployed). Bead Grid Studio currently operates with **zero analytics and zero telemetry**.

This document outlines an ethical, privacy-preserving event measurement specification for future maintainer evaluation. It defines how aggregate product signals could be measured without harvesting personal data, tracking cookies, or user creative artwork.

---

## 1. Core Privacy Boundaries

If an aggregate telemetry pipeline is ever adopted by repository maintainers in the future, it **MUST** strictly adhere to the following invariants:

### What Is NEVER Collected
- **NO User Images**: Raw image files, downscaled thumbnails, or canvas pixel buffers are never uploaded.
- **NO Pattern Artwork**: Cell arrangements, color selections, or exported JSON designs never leave the client device.
- **NO Personal Identifiers**: No IP addresses, device serial numbers, advertising IDs, or browser fingerprints.
- **NO Cross-Site Tracking**: Zero third-party tracker scripts (no Google Analytics, Facebook Pixel, Hotjar, or Mixpanel).
- **NO Tracking Cookies**: No persistent cookies stored on the user's computer.

### What Could Be Collected (Proposed Aggregate Events)
Only stateless, high-level counter events:

| Event Name | Trigger Condition | Payload Properties |
| :--- | :--- | :--- |
| `app_open` | Web application or PWA launched | `app_version`, `locale` (e.g. `zh-CN` or `en-US`), `is_pwa` (boolean) |
| `pattern_generated` | Image converted into bead pattern | `grid_cols`, `grid_rows`, `process_mode`, `duration_ms` bucket (e.g. `<200ms`) |
| `pattern_exported` | User downloads PNG/SVG/JSON sheet | `export_format` (e.g. `png`, `svg`, `json`, `csv`) |
| `offline_install` | PWA service worker successfully cached | `app_version` |
| `custom_palette_imported` | Custom palette JSON successfully parsed | `color_count` (integer bucket) |

---

## 2. Technical Implementation Architecture

1. **Differential Privacy / Coarse Bucketing**: Numbers like duration or grid dimensions are bucketed (e.g. `10-25`, `25-50`) to prevent fine-grained fingerprinting.
2. **Stateless Edge Dispatch**: Pings would be transmitted over HTTPS POST to a self-hosted edge worker that strips `X-Forwarded-For` and `User-Agent` before aggregating hourly counters into an ephemeral time-series database.
3. **Data Retention**: Raw access logs are discarded immediately. Hourly aggregate counters are retained for at most 90 days.
4. **Opt-Out & Do Not Track (DNT)**:
   - Honors browser `navigator.doNotTrack === "1"` or Global Privacy Control (GPC).
   - Clear UI toggle in Settings: *"Allow anonymous, privacy-preserving usage counters"*, default opt-out for privacy-first environments.
   - Zero telemetry runs under `file://` protocol (the portable single-file HTML build remains strictly zero-network).

---

## 3. Decision for Maintainers

Because current verifiable public metrics (GitHub Releases asset downloads, Git forks, community stars, and issue tracker feedback) already provide evidence of meaningful usage, Bead Grid Studio chooses to **refrain from deploying any client telemetry**. This preserves trust, guarantees airgapped compatibility, and respects the creative rights of artists and crafters.
