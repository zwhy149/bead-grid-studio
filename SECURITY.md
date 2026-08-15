# Security policy

## Supported versions

Security fixes target the latest tagged release and `main`.

## Reporting a vulnerability

Use GitHub's **Private vulnerability reporting** for this repository. The maintainer enables that channel before publishing a release. If GitHub temporarily disables it, do not publish exploit details; wait for the private reporting channel to return.

Do not open a public Issue for a suspected vulnerability and do not attach credentials, private images, or customer projects.

Include:

- affected commit/release and browser;
- reproduction steps or a minimal proof of concept;
- impact and preconditions;
- whether source-image data can leave the device;
- suggested mitigation, if known.

You should receive an acknowledgement within 7 days. A confirmed report will be coordinated before public disclosure when practical.

## Security model

The community edition is a static local-first application. It has no account, payment, key, or image-upload backend. Future authentication, licensing, payment, or order features must use a separate server-side design; secrets and authorization decisions must never be implemented only in client JavaScript.
