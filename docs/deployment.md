# Fork and deploy your own Bead Grid Studio

[简体中文](deployment.zh-CN.md) · **English**

Bead Grid Studio is a static browser application. Image decoding and conversion stay on the user's device; the hosted files do not provide account, payment, license-key, image-upload, or conversion APIs.

## Your own site in four steps

```text
Fork
  ↓
Enable GitHub Actions
  ↓
Settings → Pages → GitHub Actions
  ↓
Run Deploy GitHub Pages
```

After it works, you can change the name, interface, palette, language, or export formats. Deploy the unchanged Fork first, then keep customizations in small commits so GitHub's **Sync fork** action remains easier to review.

## Before choosing a host

- Use the existing [live demo](https://zwhy149.github.io/bead-grid-studio/) when you only want to make patterns.
- Deploy a fork when you want your own URL, branding, update schedule, or security headers.
- Never put payment secrets, card-key validation, authorization decisions, or order data in this static client. Those require a separately reviewed server-side service.

## Option A: GitHub Pages from a fork (recommended for beginners)

This repository already contains `.github/workflows/pages.yml`. It installs dependencies, runs the complete QA suite, uploads `dist`, and deploys it with the official Pages actions.

1. Sign in to GitHub and click **Fork** on the repository page.
2. In the fork, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. GitHub may require you to enable workflows on a newly created fork.
5. Select **Deploy GitHub Pages** and run it, or push a commit to `main`.
6. Wait for both the build and deploy jobs to become green.
7. Open `https://YOUR-USERNAME.github.io/bead-grid-studio/`.

Do not commit the generated `dist` directory. The workflow builds it from source. GitHub documents the required Pages permissions and artifact/deploy actions in [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Updating a fork

Use GitHub's **Sync fork** action, review incoming changes, and run the workflow again. Keep your own branding or behavior changes in separate commits so updates are easier to review.

### GitHub Pages security boundary

GitHub Pages does not interpret `public/_headers`. The optional CSP, frame, MIME-sniffing, referrer, and permissions policies in that file are therefore not applied by the `github.io` demo. GitHub provides HTTPS, but the project does not claim custom response-header enforcement on that host.

## Option B: Cloudflare Pages with Git integration

Use Git integration when you want automatic deployment after every push.

1. Fork the repository.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the fork and production branch `main`.
4. Configure:

   ```text
   Root directory: leave empty (repository root)
   Build command: npm run build
   Build output directory: dist
   Node.js: .nvmrc pins 24; set NODE_VERSION=24 only if the platform does not read it
   ```

5. Deploy and open the generated `pages.dev` address.
6. Add a custom domain from the Pages project only after the preview deployment works.

Cloudflare Pages and other hosts that implement the `_headers` convention can apply the included security policies. Verify the actual HTTP response headers after every hosting change; a file in the repository is not proof that a platform applied it.

## Option C: Cloudflare Pages Direct Upload

Direct Upload is useful when you do not want to connect a Git account.

```bash
git clone https://github.com/zwhy149/bead-grid-studio.git
cd bead-grid-studio
npm ci
npm run build
```

Then upload the **`dist` directory**, not the repository root and not the portable HTML alone.

Dashboard route:

1. Open **Workers & Pages → Create application → Get started → Drag and drop**.
2. Enter a project name.
3. Upload the `dist` directory or a ZIP containing its contents.
4. Select **Deploy site**.

Wrangler alternative:

```bash
npx wrangler pages deploy dist --project-name=YOUR-PROJECT
```

Use only lowercase letters, numbers, and hyphens in the Pages project name.

Cloudflare notes that a Direct Upload project cannot later be switched in place to Git integration; create a new project if that strategy changes. See the [official Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Local preview before deployment

Node.js 22.12 or newer is required.

```bash
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/`. For a full release check, install the test browsers and run QA:

```bash
npm run setup
npm run qa
```

## Post-deployment verification

Check all of the following:

1. `/healthz.json` returns `ok: true` and the expected version.
2. `/version.json` reports the expected project format and palette source.
3. Upload a redistributable test image and export a PNG.
4. Reload once online, then test an offline refresh if PWA behavior matters.
5. Open `/privacy.html`, `/terms.html`, and `/NOTICE.txt`.
6. Inspect response headers when the chosen host is expected to apply `_headers`.

For a host that supports `_headers`, run:

```powershell
# Windows PowerShell
curl.exe -I https://YOUR-SITE.example/
```

```bash
# macOS / Linux
curl -I https://YOUR-SITE.example/
```

The response should include at least `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`. GitHub Pages is the documented exception and will not apply this repository file.

## Common mistakes

- **Blank page or missing assets:** deploy `dist`, not the repository root.
- **GitHub Pages workflow never starts:** enable Actions on the fork and select GitHub Actions as the Pages source.
- **Cloudflare shows the source tree:** the output directory was configured incorrectly; use `dist`.
- **A custom domain fails:** first verify the platform-provided URL, then follow that host's current DNS instructions.
- **A downloaded HTML is not installable as a PWA:** the portable file is for offline use; PWA installation requires the hosted build and a secure origin.

## Future paid services

Keep the converter client-side. Payment, card-key, account, and order features need a separate backend, server-side validation, abuse controls, monitoring, privacy terms, and data-retention rules. Never expose their secrets in `src`, `public`, a browser bundle, or a Pages environment variable that is injected into client code.
