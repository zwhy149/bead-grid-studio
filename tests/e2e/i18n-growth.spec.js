import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const officialUrl = 'https://zwhy149.github.io/bead-grid-studio/';

async function waitForPattern(page) {
  await expect(page.locator('#convertOverlay')).not.toHaveClass(/is-visible/, { timeout: 20_000 });
  await expect(page.locator('#patternReadyBar')).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => Number((await page.locator('#totalBeads').textContent())?.replace(/\D/g, '') || 0)).toBeGreaterThan(0);
}

test('query locale overrides storage and a manual choice persists', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bead-grid-studio:locale', 'zh-CN'));
  await page.goto('/?lang=en-US');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('#trySampleBtn')).toHaveText(/Try a Sample/i);

  await page.locator('[data-locale="zh-CN"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('#trySampleBtn')).toHaveText(/试试示例/);
});

test('browser language selects English on a clean first visit', async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => {
    localStorage.removeItem('bead-grid-studio:locale');
    Object.defineProperty(navigator, 'languages', { configurable: true, get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'en-US' });
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.locator('#emptyUploadBtn')).toHaveText(/Choose Image/i);
});

test('English onboarding generates the bundled sample without network image upload', async ({ page }) => {
  const shared = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (payload) => { window.__sharedPayload = payload; },
    });
  });
  page.on('request', (request) => {
    if (/rocket-badge/i.test(request.url())) shared.push(request.url());
  });
  await page.goto('/?lang=en-US');
  await expect(page.locator('#heroTitle')).toHaveText('Image → Fuse Bead Pattern');
  await page.locator('#trySampleBtn').click();
  await waitForPattern(page);
  expect(shared).toEqual([]);
  const renderedCopy = await page.locator('#projectSubtitle,#fileDetails,#legendStrip,#statusMessage,.toast').allTextContents();
  expect(renderedCopy.join(' ')).not.toMatch(/\{(?:width|height|suffix|message|background|merged)\}/);

  await page.locator('#readyShareBtn').click();
  await expect.poll(() => page.evaluate(() => window.__sharedPayload)).toMatchObject({
    url: `${officialUrl}?lang=en-US`,
  });
  const payload = await page.evaluate(() => window.__sharedPayload);
  expect(payload.title).toMatch(/Bead Grid Studio/);
  expect(payload.text).toMatch(/fuse-bead pattern/i);
});

test('English key interface contains no accidental Chinese UI', async ({ page }) => {
  await page.goto('/?lang=en-US');
  const selectors = [
    '.topbar', '#controlPanel', '#emptyState', '#palettePanel', '#productDialog', '#cropDialog', '#shareDialog', '.mobile-dock',
  ];
  const text = await page.locator(selectors.join(',')).allTextContents();
  const visibleCopy = text.join(' ').replace(/豆格工坊|中文|MARD/g, '');
  expect(visibleCopy).not.toMatch(/[\u4e00-\u9fff]/);
});

test('onboarding and core actions do not overflow at supported widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'explicit viewport matrix runs once in Chromium');
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto('/?lang=en-US');
    const geometry = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      actions: [...document.querySelectorAll('#trySampleBtn,#emptyUploadBtn,#downloadOfflineLink,[data-locale]')]
        .filter((node) => node.getClientRects().length)
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
        }),
    }));
    expect(geometry.document, `${width}px document width`).toBeLessThanOrEqual(geometry.viewport);
    for (const action of geometry.actions) {
      expect(action.left, `${width}px action starts in viewport`).toBeGreaterThanOrEqual(0);
      expect(action.right, `${width}px action ends in viewport`).toBeLessThanOrEqual(geometry.viewport + 0.5);
      expect(action.height, `${width}px action touch height`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('share-card exports have exact social dimensions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'download dimensions run once in Chromium');
  await page.goto('/?lang=en-US');
  await page.locator('#trySampleBtn').click();
  await waitForPattern(page);

  for (const [format, expectedWidth, expectedHeight] of [
    ['wide', 1200, 675],
    ['portrait', 1080, 1440],
  ]) {
    await page.locator('#readyShareCardBtn').click();
    await expect(page.locator('#shareDialog')).toBeVisible();
    await page.locator('#shareFormat').selectOption(format);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#shareCardDownloadBtn').click();
    const download = await downloadPromise;
    const bytes = await readFile(await download.path());
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(expectedWidth);
    expect(bytes.readUInt32BE(20)).toBe(expectedHeight);
    if (await page.locator('#shareDialog').isVisible()) await page.locator('#shareCardCloseBtn').click();
  }
});
