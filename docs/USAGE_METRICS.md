# Usage Metrics & Privacy Policy

## Core Principle: Local-First & Zero Telemetry

Bead Grid Studio operates on a strict **Local-First, Zero-Telemetry** policy.

1. **Zero Image Uploads**: User images, photos, designs, and draft grids are processed 100% in the user's browser or local Node.js process. They never leave the machine, and no server endpoint receives image bytes.
2. **Zero Tracking Cookies or Analytics Pixels**: The application does not embed Google Analytics, Mixpanel, Hotjar, Facebook Pixel, or any third-party telemetry scripts.
3. **Offline Usability**: The portable single-file distribution (`dist/bead-grid-studio.html`) operates without any internet connection. Disconnecting Wi-Fi or running behind a strict airgap firewall has zero impact on application features.

## Verifiable Proxy Metrics

In the absence of invasive user tracking, how does the project measure real-world adoption and utility? We rely on verifiable, ethical proxies:

### 1. GitHub Release Asset Downloads
- Each published GitHub release includes a single-file portable build (`bead-grid-studio-portable.html`).
- The GitHub REST API publishes immutable cumulative download counters per asset.
- As of September 2026, over 156 portable releases have been downloaded directly by offline crafters and community educators.

### 2. Community Invocations and GitHub Forks
- 19 independent forks demonstrating code reuse, custom brand palettes, and downstream experimentation.
- 175 GitHub stars from craft enthusiasts, pixel artists, and web developers.

### 3. Issue and Discussion Activity
- Active feedback loops regarding bead color accuracy (e.g. MARD palette conversions, edge artifact filtering).
- Community-submitted bug reports and feature suggestions documented in GitHub Issues.

### 4. Headless Automation & CI Benchmarking
- Automated test runs (`npm run test:unit`, `npm run test:e2e:ci`) verify performance across desktop and mobile browsers.
- Deterministic benchmarks guarantee execution speed (< 50ms for standard 29x29 grids) across diverse hardware profiles.

## Privacy Verification

Security researchers and privacy-conscious users can verify the zero-network guarantee:
- Open DevTools -> **Network** tab in any browser.
- Drop an image, manipulate sliders, and export PDF / PNG / JSON.
- **Result**: Zero outbound HTTP requests or WebSockets are initiated during any pattern generation or export operation.
