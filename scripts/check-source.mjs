import { readFile } from 'node:fs/promises';
import { PALETTE } from '../src/palettes/mard221.js';

const [html, app, geometry, manifest, worker, notice, publicNotice, packageJson, versionJson, healthJson] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('src/app.js', 'utf8'),
  readFile('src/core/geometry.js', 'utf8'),
  readFile('public/manifest.webmanifest', 'utf8'),
  readFile('public/sw.js', 'utf8'),
  readFile('NOTICE', 'utf8'),
  readFile('public/NOTICE.txt', 'utf8'),
  readFile('package.json', 'utf8'),
  readFile('public/version.json', 'utf8'),
  readFile('public/healthz.json', 'utf8'),
]);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
check(duplicates.length === 0, `duplicate HTML ids: ${duplicates.join(', ')}`);
check(!/(?:href|src)="\//.test(html), 'root-relative asset path found in index.html');
check(!/<script[^>]+https?:\/\//i.test(html), 'external script found in index.html');
check(app.includes('window.runBeadStudioSelfTests=runSelfTests'), 'browser self-test hook missing');
check(app.includes("from './core/geometry.js'"), 'geometry Module is not wired into the app');
check(geometry.includes('export function fitPatternInsideBoard'), 'geometry public Interface missing');

const paletteCodes = PALETTE.map((color) => color.code);
check(paletteCodes.length === 221, `expected 221 base palette entries, found ${paletteCodes.length}`);
check(new Set(paletteCodes).size === 221, 'duplicate MARD-compatible palette codes found');
check(PALETTE.every((color) => /^[A-HM]\d{1,2}$/.test(color.code)), 'non-base series leaked into MARD 221 data');

const parsedManifest = JSON.parse(manifest);
check(parsedManifest.start_url === './', 'manifest start_url must remain repository-subpath safe');
check(parsedManifest.scope === './', 'manifest scope must remain repository-subpath safe');
check(!worker.includes("cache.put('/')"), 'service worker must not overwrite the root shell with a subpage');
check(!/https?:/.test(worker), 'service worker must not cache cross-origin requests');
check(worker.includes("key.startsWith(CACHE_PREFIX)"), 'service worker cache cleanup is not scoped to this project');
check(worker.includes('caches.match(request, { ignoreSearch: true })'), 'offline navigation must prefer a cached requested page');
check(publicNotice === notice, 'public/NOTICE.txt must exactly match the repository NOTICE');
check(notice.includes('Copyright (c) 2019-present, VoidZero Inc. and Vite contributors'), 'Vite MIT attribution is missing');

const packageVersion = JSON.parse(packageJson).version;
const publicVersion = JSON.parse(versionJson);
check(publicVersion.version === packageVersion, 'public/version.json does not match package.json');
check(JSON.parse(healthJson).version === packageVersion, 'public/healthz.json does not match package.json');
check(app.includes(`const APP_VERSION = '${packageVersion}'`), 'APP_VERSION does not match package.json');
check(app.includes(`const BUILD_DATE = '${publicVersion.buildDate}'`), 'BUILD_DATE does not match public/version.json');
check(worker.includes(`v${packageVersion}`), 'service-worker cache version does not match package.json');

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Source checks passed: ${ids.length} ids, ${paletteCodes.length} palette colors.`);
}
