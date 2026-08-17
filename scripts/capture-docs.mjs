import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = join(root, 'tests', 'fixtures', 'rocket-badge.png');
const assets = join(root, 'docs', 'assets');
const baseUrl = process.env.DOCS_BASE_URL || 'http://127.0.0.1:4173';
const outputDefinitions = [
  { locale: 'zh-CN', viewport: { width: 1440, height: 900 }, mobile: false, file: 'app-desktop-zh.png' },
  { locale: 'en-US', viewport: { width: 1440, height: 900 }, mobile: false, file: 'app-desktop-en.png' },
  { locale: 'zh-CN', viewport: { width: 390, height: 844 }, mobile: true, file: 'app-mobile-zh.png' },
  { locale: 'en-US', viewport: { width: 390, height: 844 }, mobile: true, file: 'app-mobile-en.png' },
];

await mkdir(assets, { recursive: true });

async function reachable() {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(processHandle) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) throw new Error(`Preview server exited with code ${processHandle.exitCode}.`);
    if (await reachable()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview server did not become ready at ${baseUrl}.`);
}

async function startPreviewIfNeeded() {
  if (await reachable()) return null;
  const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: root,
    stdio: 'inherit',
  });
  await waitForServer(preview);
  return preview;
}

async function stopPreview(preview) {
  if (!preview || preview.exitCode !== null) return;
  preview.kill();
  await Promise.race([
    new Promise((resolve) => preview.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
}

async function loadRocket(page, locale) {
  await page.goto(`${baseUrl}/?lang=${encodeURIComponent(locale)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (expected) => document.documentElement.lang === expected,
    locale,
    { timeout: 10_000 },
  );

  await page.addStyleTag({
    content: '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}',
  });

  const sampleSelectors = [
    '#trySampleBtn',
    '#emptySampleBtn',
    '#sampleBtn',
    '[data-action="try-sample"]',
  ];
  let usedSample = false;
  for (const selector of sampleSelectors) {
    const button = page.locator(selector).first();
    if (await button.count() && await button.isVisible()) {
      await button.click();
      usedSample = true;
      break;
    }
  }
  if (!usedSample) await page.setInputFiles('#imageInput', fixture);

  await page.waitForFunction(() => {
    const readyBar = document.querySelector('#patternReadyBar');
    const smartCard = document.querySelector('#smartCard');
    const overlay = document.querySelector('#convertOverlay');
    const total = Number((document.querySelector('#totalBeads')?.textContent || '').replace(/[^0-9]/g, ''));
    const canvas = document.querySelector('#patternCanvas');
    const visibleCompletion = (readyBar && !readyBar.hidden) || (smartCard && !smartCard.hidden);
    return Boolean(
      visibleCompletion
      && !overlay?.classList.contains('is-visible')
      && canvas instanceof HTMLCanvasElement
      && canvas.width > 0
      && canvas.height > 0
      && total > 0,
    );
  }, null, { timeout: 45_000 });
  await page.evaluate(() => document.fonts?.ready);
}

async function captureShareCard(page, locale) {
  await page.locator('#readyShareCardBtn').click();
  await page.locator('#shareFormat').selectOption('wide');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#shareCardDownloadBtn').click();
  const download = await downloadPromise;
  const suffix = locale === 'zh-CN' ? 'zh' : 'en';
  const target = join(assets, `social-card-${suffix}.png`);
  await download.saveAs(target);
  if (locale === 'zh-CN') await copyFile(target, join(root, 'public', 'social-preview.png'));
  console.log(`Captured social-card-${suffix}.png`);
}

const preview = await startPreviewIfNeeded();
const browser = await chromium.launch();

try {
  for (const definition of outputDefinitions) {
    const context = await browser.newContext({
      viewport: definition.viewport,
      deviceScaleFactor: 1,
      isMobile: definition.mobile,
      hasTouch: definition.mobile,
      locale: definition.locale,
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });
    const page = await context.newPage();
    await loadRocket(page, definition.locale);
    await page.screenshot({ path: join(assets, definition.file) });
    if (!definition.mobile) await captureShareCard(page, definition.locale);
    await context.close();
    console.log(`Captured ${definition.file}`);
  }
} finally {
  await browser.close();
  await stopPreview(preview);
}

console.log('Bilingual documentation screenshots captured from the real rocket fixture.');
