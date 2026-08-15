# Deployment notes

## GitHub Pages

The default workflow builds, runs the complete QA suite, and deploys `dist/` to
GitHub Pages. Pages hosts only static assets; the application has no image
upload, conversion, account, payment, or license-key backend.

GitHub Pages does **not** interpret `public/_headers`. As a result, the custom
CSP, frame, and permissions headers in that file are not applied by the Pages
demo. GitHub still provides HTTPS for the `github.io` origin, but this project
does not claim custom response-header enforcement on that host.

## Cloudflare Pages and compatible hosts

Hosts that implement the `_headers` convention can apply the included CSP,
HSTS, framing, MIME-sniffing, referrer, and permissions policies. Confirm the
actual response headers after every hosting change; a file in the repository is
not proof that a platform applied it.

## Future paid services

Do not put payment secrets, card-key validation, authorization decisions, or
order data in this static client. Those features require a separately reviewed
server-side service, abuse controls, privacy terms, monitoring, and data
retention rules. The image converter should remain client-side.
