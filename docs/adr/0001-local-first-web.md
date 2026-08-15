# ADR 0001: Local-first Web/PWA

- Status: accepted
- Date: 2026-08-15

## Decision

Image decode, conversion, editing, and export run in the browser. The public community edition has no image-upload or conversion backend.

## Consequences

- User pixels stay on the device.
- Static hosting scales independently of conversion CPU.
- Conversion must respect browser memory and Worker limits.
- Cloud accounts, collaboration, and server-side project recovery are out of scope unless introduced by a separate explicit design.
