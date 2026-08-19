import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import enUS from '../src/i18n/en-US.js';
import zhCN from '../src/i18n/zh-CN.js';
import { DEFAULT_PALETTE_PROVIDER_ID, getPaletteProvider } from '../src/palettes/catalog.js';
import { PALETTE } from '../src/palettes/mard221.js';

const [html, app, geometry, manifest, worker, ciWorkflow, pagesWorkflow, license, publicLicense, notice, publicNotice, packageJson, versionJson, healthJson, readmeZh, readmeEn, readmeRedirect, licenseAdr, deployZh, deployEn, privacyEn, termsEn, robots, sitemap] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('src/app.js', 'utf8'),
  readFile('src/core/geometry.js', 'utf8'),
  readFile('public/manifest.webmanifest', 'utf8'),
  readFile('public/sw.js', 'utf8'),
  readFile('.github/workflows/ci.yml', 'utf8'),
  readFile('.github/workflows/pages.yml', 'utf8'),
  readFile('LICENSE', 'utf8'),
  readFile('public/LICENSE.txt', 'utf8'),
  readFile('NOTICE', 'utf8'),
  readFile('public/NOTICE.txt', 'utf8'),
  readFile('package.json', 'utf8'),
  readFile('public/version.json', 'utf8'),
  readFile('public/healthz.json', 'utf8'),
  readFile('README.md', 'utf8'),
  readFile('README.en.md', 'utf8'),
  readFile('README.zh-CN.md', 'utf8'),
  readFile('docs/adr/0003-apache-license.md', 'utf8'),
  readFile('docs/deployment.zh-CN.md', 'utf8'),
  readFile('docs/deployment.md', 'utf8'),
  readFile('public/privacy.en.html', 'utf8'),
  readFile('public/terms.en.html', 'utf8'),
  readFile('public/robots.txt', 'utf8'),
  readFile('public/sitemap.xml', 'utf8'),
]);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const normalizeText = (value) => value.replace(/\r\n?/g, '\n');

const ignoredSourceDirectories = new Set(['.git', 'dist', 'node_modules', 'playwright-report', 'release', 'test-results']);
const searchableSourceExtensions = new Set(['.cff', '.css', '.html', '.js', '.json', '.md', '.mjs', '.txt', '.yaml', '.yml']);
async function collectSearchableSource(directory = '.') {
  const chunks = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredSourceDirectories.has(entry.name)) chunks.push(...await collectSearchableSource(join(directory, entry.name)));
      continue;
    }
    if (searchableSourceExtensions.has(extname(entry.name).toLowerCase()) || ['LICENSE', 'NOTICE'].includes(entry.name)) {
      chunks.push(await readFile(join(directory, entry.name), 'utf8'));
    }
  }
  return chunks;
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
check(duplicates.length === 0, `duplicate HTML ids: ${duplicates.join(', ')}`);
check(!/(?:href|src)="\//.test(html), 'root-relative asset path found in index.html');
check(!/<script[^>]+https?:\/\//i.test(html), 'external script found in index.html');
check((html.match(/<h1\b/g) || []).length === 1, 'application must expose exactly one stable h1');
check(/<h1\b[^>]*data-i18n="app\.heading"/.test(html), 'stable translated application h1 is missing');
check(app.includes('window.runBeadStudioSelfTests=runSelfTests'), 'browser self-test hook missing');
check(app.includes("from './core/geometry.js'"), 'geometry Module is not wired into the app');
check(geometry.includes('export function fitPatternInsideBoard'), 'geometry public Interface missing');

const zhKeys = Object.keys(zhCN).sort();
const enKeys = Object.keys(enUS).sort();
check(JSON.stringify(zhKeys) === JSON.stringify(enKeys), 'zh-CN and en-US dictionaries must expose the same keys');
const markupI18nKeys = [...html.matchAll(/\bdata-i18n(?:-aria|-title|-placeholder|-alt)?="([^"]+)"/g)].map((match) => match[1]);
const missingMarkupKeys = [...new Set(markupI18nKeys.filter((key) => !(key in zhCN) || !(key in enUS)))];
check(missingMarkupKeys.length === 0, `HTML references missing i18n keys: ${missingMarkupKeys.join(', ')}`);
const i18nPrefixes = new Set(zhKeys.map((key) => key.split('.')[0]));
const runtimeI18nKeys = [...app.matchAll(/['"]([a-z][\w-]*\.[\w.-]+)['"]/g)]
  .map((match) => match[1])
  .filter((key) => i18nPrefixes.has(key.split('.')[0]));
const missingRuntimeKeys = [...new Set(runtimeI18nKeys.filter((key) => !(key in zhCN) || !(key in enUS)))];
check(missingRuntimeKeys.length === 0, `app references missing i18n keys: ${missingRuntimeKeys.join(', ')}`);
check(app.includes("from './i18n/index.js'"), 'i18n runtime is not wired into the app');

const paletteCodes = PALETTE.map((color) => color.code);
check(paletteCodes.length === 221, `expected 221 base palette entries, found ${paletteCodes.length}`);
check(new Set(paletteCodes).size === 221, 'duplicate MARD-compatible palette codes found');
check(PALETTE.every((color) => /^[A-HM]\d{1,2}$/.test(color.code)), 'non-base series leaked into MARD 221 data');
const provider = getPaletteProvider();
check(provider.id === DEFAULT_PALETTE_PROVIDER_ID && provider.colors === PALETTE, 'default palette provider is not wired to the pinned 221 colors');
check(provider.colors.filter(provider.autoMatchable).length === 220, 'transparent H1 must stay outside automatic image matching');

const parsedManifest = JSON.parse(manifest);
check(parsedManifest.start_url === './', 'manifest start_url must remain repository-subpath safe');
check(parsedManifest.scope === './', 'manifest scope must remain repository-subpath safe');
check(!worker.includes("cache.put('/')"), 'service worker must not overwrite the root shell with a subpage');
check(!/https?:/.test(worker), 'service worker must not cache cross-origin requests');
check(worker.includes("key.startsWith(CACHE_PREFIX)"), 'service worker cache cleanup is not scoped to this project');
check(worker.includes('caches.match(request, { ignoreSearch: true })'), 'offline navigation must prefer a cached requested page');
check(worker.includes("'./LICENSE.txt'"), 'service worker must cache the Apache-2.0 license');
check(worker.includes("'./privacy.en.html'") && worker.includes("'./terms.en.html'"), 'service worker must cache English legal pages');
const hasBoundedPlaywrightInstall = (workflow) => [
  'PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: 120000',
  'for attempt in 1 2',
  'timeout --signal=TERM --kill-after=30s 480s',
  'npx playwright install-deps chromium',
  'npx playwright install chromium',
  'rm -rf "$HOME/.cache/ms-playwright"',
  'uses: actions/cache/restore@5a3ec84eff668545956fd18022155c47e93e2684',
  'uses: actions/cache/save@5a3ec84eff668545956fd18022155c47e93e2684',
  'path: ~/.cache/ms-playwright',
  "if: steps.playwright-cache.outputs.cache-hit != 'true'",
  'cache-primary-key',
  'run: npm run qa:ci',
].every((fragment) => workflow.includes(fragment));
check(ciWorkflow.includes('timeout-minutes: 30'), 'CI job needs enough time for one bounded browser-install retry and the test suite');
check((ciWorkflow.match(/timeout-minutes: 20/g) || []).length >= 1, 'CI browser-install step needs a retry safety buffer');
check(hasBoundedPlaywrightInstall(ciWorkflow), 'CI must use a bounded, retrying Playwright browser installation');
check((pagesWorkflow.match(/timeout-minutes: 20/g) || []).length >= 1, 'Pages browser-install step needs a retry safety buffer');
check(hasBoundedPlaywrightInstall(pagesWorkflow), 'Pages verification must use the same bounded Playwright browser installation');
check(normalizeText(publicLicense) === normalizeText(license), 'public/LICENSE.txt must match the repository LICENSE');
check(publicNotice === notice, 'public/NOTICE.txt must exactly match the repository NOTICE');
check(notice.includes('pinned data commit 94b99999652866f1a1879d6369fe735f811949e5'), 'pinned palette attribution is missing');
check(notice.includes('Copyright (c) 2020 maxcleme'), 'palette MIT attribution is missing');
check(notice.includes('Copyright (c) 2019-present, VoidZero Inc. and Vite contributors'), 'Vite MIT attribution is missing');

const parsedPackage = JSON.parse(packageJson);
check(
  parsedPackage.scripts['test:e2e:ci'] === 'npm run build && playwright test --project=desktop-chromium --project=mobile-chromium',
  'CI browser smoke suite must cover both desktop and mobile Chromium projects',
);
check(
  parsedPackage.scripts['qa:ci'] === 'npm run check && npm run test:unit && npm run test:e2e:ci',
  'CI quality command must include source checks, unit tests, and Chromium smoke tests',
);
const packageVersion = parsedPackage.version;
const publicVersion = JSON.parse(versionJson);
check(publicVersion.version === packageVersion, 'public/version.json does not match package.json');
check(JSON.parse(healthJson).version === packageVersion, 'public/healthz.json does not match package.json');
check(app.includes(`const APP_VERSION = '${packageVersion}'`), 'APP_VERSION does not match package.json');
check(app.includes(`const BUILD_DATE = '${publicVersion.buildDate}'`), 'BUILD_DATE does not match public/version.json');
check(worker.includes(`v${packageVersion}`), 'service-worker cache version does not match package.json');

const publishedText = (await collectSearchableSource()).join('\n');
const removedReferenceTerms = ['Zip' + 'pland', 'perler' + '-beads', 'AG' + 'PL', 'Aff' + 'ero'];
check(!removedReferenceTerms.some((term) => publishedText.toLowerCase().includes(term.toLowerCase())), 'removed project-reference term found in published source');
check(['拼豆图纸生成器', '图片转拼豆', '拼豆像素画', '逐格色号', '辅助线', '用料统计'].every((term) => readmeZh.includes(term)), 'Chinese README search terms are incomplete');
check(['local-first fuse-bead pattern generator', 'editable', 'printable', 'per-cell color codes', 'board guides', 'material counts'].every((term) => readmeEn.includes(term)), 'English README search terms are incomplete');
check(readmeZh.includes('README.en.md') && readmeEn.includes('README.md'), 'README language switch is incomplete');
check(deployZh.includes('GitHub Pages') && deployZh.includes('Cloudflare Pages') && deployEn.includes('GitHub Pages') && deployEn.includes('Cloudflare Pages'), 'bilingual deployment guide is incomplete');
check(privacyEn.includes('<html lang="en-US">') && termsEn.includes('<html lang="en-US">'), 'English privacy or terms page is missing');
const canonicalSitemapUrl = 'https://zwhy149.github.io/bead-grid-studio/sitemap.xml';
const robotDirectives = new Set(robots.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
check(robotDirectives.has(`Sitemap: ${canonicalSitemapUrl}`), 'robots.txt does not expose the canonical sitemap');

const sitemapUrls = new Set([
  ...[...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1]),
  ...[...sitemap.matchAll(/<xhtml:link\b[^>]*\bhref="([^"]+)"[^>]*\/?\s*>/g)].map((match) => match[1]),
]);
const isOfficialSiteUrl = (value) => {
  try {
    const url = new URL(value);
    return url.origin === 'https://zwhy149.github.io'
      && url.pathname.startsWith('/bead-grid-studio/')
      && url.username === ''
      && url.password === ''
      && url.hash === '';
  } catch {
    return false;
  }
};
check([...sitemapUrls].every(isOfficialSiteUrl), 'sitemap contains a malformed or non-project URL');
const requiredSitemapUrls = [
  'https://zwhy149.github.io/bead-grid-studio/',
  'https://zwhy149.github.io/bead-grid-studio/?lang=zh-CN',
  'https://zwhy149.github.io/bead-grid-studio/?lang=en-US',
  'https://zwhy149.github.io/bead-grid-studio/privacy.html',
  'https://zwhy149.github.io/bead-grid-studio/privacy.en.html',
  'https://zwhy149.github.io/bead-grid-studio/terms.html',
  'https://zwhy149.github.io/bead-grid-studio/terms.en.html',
];
check(requiredSitemapUrls.every((url) => sitemapUrls.has(url)), 'sitemap is missing a required localized URL');

const markdownFiles = [
  ['README.md', readmeZh],
  ['README.en.md', readmeEn],
  ['README.zh-CN.md', readmeRedirect],
  ['docs/deployment.zh-CN.md', deployZh],
  ['docs/deployment.md', deployEn],
];
for (const [file, content] of markdownFiles) {
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1].trim().replace(/^<|>$/g, '');
    if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    const target = decodeURIComponent(href.split('#')[0]);
    try {
      await access(resolve(dirname(file), target));
    } catch {
      failures.push(`${file} has a broken local link: ${href}`);
    }
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Source checks passed: ${ids.length} ids, ${paletteCodes.length} palette colors.`);
}
