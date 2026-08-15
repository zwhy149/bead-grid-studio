import { expect, test } from '@playwright/test';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('loads the full local-first editor without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/豆格工坊/);
  await expect(page.locator('#emptyUploadBtn')).toBeVisible();
  await expect(page.locator('#patternCanvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('built-in conversion regression suite passes', async ({ page }) => {
  const messages = [];
  page.on('console', (message) => messages.push(message.text()));
  await page.goto('/?selftest=1');
  await expect.poll(() => messages.find((message) => message.includes('豆格工坊自检通过'))).toMatch(/80 项/);
  expect(messages.filter((message) => message.includes('自检失败'))).toEqual([]);
});

test('mobile layout stays inside the viewport and exposes tool sheets', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'mobile-only geometry assertion');
  await page.goto('/');
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
  const tools = page.getByRole('button', { name: /工具/ }).last();
  await tools.click();
  await expect(page.locator('.side-panel[data-mobile-open="true"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.side-panel[data-mobile-open="true"]')).toHaveCount(0);
});

test('portable single-file release runs without a server', async ({ page }) => {
  const messages = [];
  const errors = [];
  page.on('console', (message) => messages.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));
  const file = pathToFileURL(resolve('release/bead-grid-studio-v1.0.0.html'));
  file.search = 'selftest=1';
  await page.goto(file.href);
  await expect(page).toHaveTitle(/豆格工坊/);
  await expect.poll(() => messages.find((message) => message.includes('豆格工坊自检通过'))).toMatch(/80 项/);
  expect(errors).toEqual([]);
});

test('uploads a real image, converts at a smaller grid, and exports a construction sheet', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'full download path runs once in Chromium');
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/');
  await page.setInputFiles('#imageInput', resolve('tests/fixtures/rocket-badge.png'));

  await expect.poll(async () => page.locator('#smartTitle').textContent()).toMatch(/^已生成/);
  await expect(page.locator('#convertOverlay')).not.toHaveClass(/is-visible/);
  await page.locator('[data-size="24"]').click();
  await expect.poll(async () => {
    const cols = Number(await page.locator('#gridCols').inputValue());
    const rows = Number(await page.locator('#gridRows').inputValue());
    return Math.max(cols, rows);
  }).toBe(24);
  await expect.poll(async () => page.locator('#statusMessage').textContent()).toMatch(/转换完成/);
  await expect(page.locator('#convertOverlay')).not.toHaveClass(/is-visible/);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportPngBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/24x24\.png$/);
  const outputPath = await download.path();
  expect(outputPath).toBeTruthy();
  expect((await stat(outputPath)).size).toBeGreaterThan(10_000);
});

test('service worker preserves other projects and serves legal pages offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'service-worker storage assertion runs once in Chromium');
  await page.goto('/');
  const cacheNames = await page.evaluate(async () => {
    const other = await caches.open('other-project-cache-v1');
    await other.put('./sentinel.txt', new Response('keep'));
    await navigator.serviceWorker.register('./sw.js', { scope: './' });
    await navigator.serviceWorker.ready;
    await new Promise((resolveController, rejectController) => {
      if (navigator.serviceWorker.controller) return resolveController();
      const timeout = setTimeout(() => rejectController(new Error('service worker did not claim page')), 8_000);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(timeout);
        resolveController();
      }, { once: true });
    });
    return caches.keys();
  });
  expect(cacheNames).toContain('other-project-cache-v1');
  expect(cacheNames.some((name) => name.startsWith('bead-grid-studio-community-'))).toBe(true);

  await page.goto('/privacy.html');
  await expect(page).toHaveTitle(/隐私/);
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle(/隐私/);
  await expect(page.locator('#emptyUploadBtn')).toHaveCount(0);
});
