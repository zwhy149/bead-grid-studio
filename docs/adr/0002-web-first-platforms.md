# ADR 0002: Web-first platform strategy

- Status: accepted
- Date: 2026-08-15

## Decision

Ship one responsive PWA and a portable single HTML. Do not create Electron, Tauri, mobile-store, or mini-program directories without a working capability and a maintainer.

## Rationale

The current product depends on standard Canvas, Worker, File, and download capabilities. A responsive PWA already covers the target devices with one tested code path. Platform shells multiply signing, update, security, and release work without improving conversion quality.

## Revisit when

A measurable user segment requires native filesystem/printing integration, app-store discovery, system sharing, or another capability the Web Adapter cannot deliver.
