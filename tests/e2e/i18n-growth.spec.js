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
  const exposedLabels = await page.locator('[aria-label],[title]').evaluateAll((nodes) => nodes.flatMap((node) => [
    node.getAttribute('aria-label'),
    node.getAttribute('title'),
  ]).filter(Boolean));
  expect(exposedLabels.filter((value) => /^[a-z][\w-]*\.[\w.-]+$/.test(value))).toEqual([]);
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

test('making assistant tracks one color, survives recovery, and exports materials CSV', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'making-state and download workflow runs once in Chromium');
  await page.goto('/?lang=en-US');
  await page.locator('#trySampleBtn').click();
  await waitForPattern(page);

  await expect(page.locator('.stat-percent').first()).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedMaterialList=text;}}}));
  await page.locator('#copyStatsBtn').click();
  await expect.poll(() => page.evaluate(() => window.__copiedMaterialList || '')).toMatch(/Fuse bead shopping list[\s\S]+beads/);

  await page.locator('#readyMakeBtn').click();
  await expect(page.locator('#makingAssistant')).toBeVisible();
  await expect(page.locator('#makingProgressBar')).toHaveAttribute('aria-valuenow', '0');
  await page.locator('#makingCompleteBtn').click();
  await expect.poll(async () => Number(await page.locator('#makingProgressBar').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await expect(page.locator('.stat-row.is-complete')).toHaveCount(1);

  for (const [width, height] of [[1280, 720], [390, 844]]) {
    await page.setViewportSize({ width, height });
    const geometry = await page.evaluate(() => {
      const box=node=>{const rect=node.getBoundingClientRect();return {left:rect.left,right:rect.right,width:rect.width,height:rect.height};};
      const assistant=box(document.querySelector('#makingAssistant'));
      const stage=box(document.querySelector('.stage-panel'));
      const palette=box(document.querySelector('#palettePanel'));
      const controls=[...document.querySelectorAll('#makingAssistant button')].map(box);
      return {viewport:innerWidth,document:document.documentElement.scrollWidth,assistant,stage,palette,controls,paletteVisible:palette.width>100};
    });
    expect(geometry.document, `${width}px making document width`).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.assistant.left).toBeGreaterThanOrEqual(0);
    expect(geometry.assistant.right).toBeLessThanOrEqual(geometry.viewport+.5);
    if(width>=960&&geometry.paletteVisible)expect(geometry.stage.right).toBeLessThanOrEqual(geometry.palette.left+.5);
    for(const control of geometry.controls){
      expect(control.left).toBeGreaterThanOrEqual(geometry.assistant.left-.5);
      expect(control.right).toBeLessThanOrEqual(geometry.assistant.right+.5);
      expect(control.height).toBeGreaterThanOrEqual(width<960?44:30);
    }
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  await expect.poll(() => page.evaluate(() => {
    const project = JSON.parse(localStorage.getItem('bead-grid-studio:draft:v2') || 'null');
    return project?.making?.completedColorCodes?.length || 0;
  })).toBe(1);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportCsvBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-materials\.csv$/);
  const csv = await readFile(await download.path(), 'utf8');
  expect(csv.replace(/^\uFEFF/, '')).toMatch(/^Code,Color name,Screen-reference HEX,Count,Completed\r?\n/);
  expect(csv).toMatch(/,Yes\r?\n/);

  await page.reload();
  await expect(page.locator('#restoreDraftBtn')).toBeVisible();
  await page.locator('#restoreDraftBtn').click();
  await waitForPattern(page);
  await page.locator('#readyMakeBtn').click();
  await expect.poll(async () => Number(await page.locator('#makingProgressBar').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await expect(page.locator('.stat-row.is-complete')).toHaveCount(1);

  page.once('dialog', dialog=>dialog.accept());
  await page.locator('[data-size="24"]').click();
  await expect(page.locator('#makingAssistant')).toBeHidden();
  await expect(page.locator('#totalBeads')).toHaveText('0');
  await page.locator('#undoBtn').click();
  await expect.poll(async () => Number((await page.locator('#totalBeads').textContent())?.replace(/\D/g,'')||0)).toBeGreaterThan(0);
  await page.locator('#readyMakeBtn').click();
  await expect.poll(async () => Number(await page.locator('#makingProgressBar').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
});

test('standalone hides Anna AI panel while hover-highlight and Anna host workflow function cleanly', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Anna mock host workflow runs once in Chromium');

  // 1. Standalone visit must keep Anna AI panel hidden.
  await page.goto('/?lang=en-US');
  await expect(page.locator('#annaAiPanel')).toBeHidden();
  await page.locator('#trySampleBtn').click();
  await waitForPattern(page);
  await page.locator('#statsList .stat-row').first().hover();

  // 2. Inside Anna OS iframe runtime (?wid=...&t=...), panel activates and syncs theme/storage/coach/simplify.
  await page.addInitScript(() => {
    window.__annaSavedStates = [];
    window.__annaChatArtifacts = [];
    const handlers = {};
    window.__ANNA_MOCK_RUNTIME__ = {
      theme: 'dark',
      locale: 'en_US',
      entryPayload: {
        pattern: {
          schemaVersion: 1,
          type: 'bead-grid-studio',
          version: 2,
          appVersion: '1.5.0',
          title: 'Mock Anna Heart',
          createdAt: '2026-11-17T00:00:00.000Z',
          grid: {
            cols: 6,
            rows: 6,
            cells: [
              'H7', 'H7', 'H7', 'H7', 'H7', 'H7',
              'H7', 'F5', 'F5', 'F5', 'F5', 'H7',
              'H7', 'F5', 'F4', 'F5', 'F5', 'H7',
              'H7', 'F5', 'F5', 'F5', 'F5', 'H7',
              'H7', 'F5', 'F5', 'F5', 'F5', 'H7',
              'H7', 'H7', 'H7', 'H7', 'H7', 'H7',
            ],
          },
          palette: { id: 'mard-compatible-base-221' },
        },
      },
      on(evt, fn) {
        handlers[evt] = fn;
      },
      storage: {
        async get() { return { exists: false }; },
        async set({ key, value }) {
          window.__annaSavedStates.push({ key, value });
          return { ok: true };
        },
      },
      llm: {
        async complete() {
          return { content: 'Build H7 border first, then F5 body; iron medium heat for 12s.' };
        },
      },
      chat: {
        async append_artifact(payload) {
          window.__annaChatArtifacts.push(payload);
          return { ok: true };
        },
      },
      mobile: {
        async haptics() {},
      },
    };
  });

  await page.goto('/?wid=win-e2e&t=tok-e2e');
  await expect(page.locator('#annaAiPanel')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await waitForPattern(page);
  await expect(page.locator('#totalBeads')).toHaveText('36');
  await expect(page.locator('#usedColors')).toHaveText('3');
  await expect(page.locator('#rareColorHint')).toBeVisible();

  await page.locator('#simplifyColorsBtn').click();
  await expect(page.locator('#usedColors')).toHaveText('2');
  await expect(page.locator('#rareColorHint')).toBeHidden();

  await page.locator('#annaCoachBtn').click();
  await expect(page.locator('#annaCoachOutput')).toBeVisible();
  await expect(page.locator('#annaCoachOutput')).toContainText('Build H7 border first');

  await page.locator('#annaSendChatBtn').click();
  await expect.poll(() => page.evaluate(() => window.__annaChatArtifacts.length)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__annaSavedStates.length)).toBeGreaterThan(0);
});

test('Anna sandboxed iframe opens sample without data-fetch or blob-worker, recovers AI simplify on fal.ai 422, and restores drawing on reopen', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Anna sandboxed iframe review regression runs in Chromium');

  const rocketPngB64 = (await readFile('tests/fixtures/rocket-badge.png')).toString('base64');
  const rocketDataUrl = `data:image/png;base64,${rocketPngB64}`;

  const context = await browser.newContext();
  let persistedApsValue = null;
  let lastUploadArgs = null;

  await context.exposeFunction('__testApsGet', (key) => {
    if (key === 'projects/active' && persistedApsValue) {
      return { exists: true, value: persistedApsValue };
    }
    return { exists: false, value: null };
  });
  await context.exposeFunction('__testApsSet', (key, value) => {
    if (key.includes(':')) throw new Error(`invalid_path: ${key}`);
    persistedApsValue = value;
    return { etag: 'W/"1"', generation: 1 };
  });
  await context.exposeFunction('__testRecordUpload', (args) => {
    lastUploadArgs = args;
  });

  await context.addInitScript((sampleOutUrl) => {
    // Enforce Anna iframe CSP constraints: block fetch('data:...') and blob: Web Workers.
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (url.startsWith('data:')) {
        throw new TypeError("Refused to connect to 'data:...' because it violates CSP directive connect-src 'self'");
      }
      return nativeFetch(input, init);
    };
    window.Worker = class BlockedByIframeCspWorker {
      constructor() {
        throw new DOMException("Refused to create a worker from 'blob:...' because it violates CSP script-src 'self'", 'SecurityError');
      }
    };

    // Match real AnnaAppRuntime.connect() v0.29.0 where entryPayload defaults to `{}` (truthy empty object).
    window.__ANNA_MOCK_RUNTIME__ = {
      theme: 'light',
      locale: 'en-US',
      entryPayload: {},
      on() {},
      storage: {
        async get({ key }) { return window.__testApsGet(key); },
        async set({ key, value }) { return window.__testApsSet(key, value); },
      },
      upload: {
        async inline(args) {
          await window.__testRecordUpload(args);
          return {
            r2_key: 'uploads/review/bead-input.png',
            download_url: 'https://r2.anna.example/transient/bead-input.png',
            expires_in: 1800,
          };
        },
      },
      image: {
        async edit() {
          const err = new Error('image edit failed: Exception: fal.ai image API call failed (HTTP 422): Failed to download the file.');
          err.code = 'APP_PROVIDER_ERROR';
          throw err;
        },
        async generate() {
          return { images: [{ url: sampleOutUrl }] };
        },
      },
      llm: {
        async complete() {
          return { role: 'assistant', content: { type: 'text', text: 'cute chibi rocket emblem on white background' } };
        },
      },
      chat: { async append_artifact() { return { ok: true }; } },
      mobile: { async haptics() {} },
    };
  }, rocketDataUrl);

  const page1 = await context.newPage();
  await page1.goto('/?wid=win-review-1&t=tok-review-1');
  await expect(page1.locator('#annaAiPanel')).toBeVisible();

  // Issue #1: Clicking "View Sample Drawing" must open cleanly with no fetch('data:...') and no Worker.
  await page1.locator('#trySampleBtn').click();
  await waitForPattern(page1);
  const initialBeads = Number((await page1.locator('#totalBeads').textContent())?.replace(/\D/g, '') || 0);
  expect(initialBeads).toBeGreaterThan(50);

  // Issue #2: Clicking "AI Simplify Photo" stages image_input PNG and recovers cleanly from fal.ai HTTP 422.
  await page1.locator('#annaSimplifyPhotoBtn').click();
  await expect(page1.locator('#annaCoachOutput')).toBeHidden({ timeout: 15000 });
  expect(lastUploadArgs?.purpose).toBe('image_input');
  expect(lastUploadArgs?.mime_type).toBe('image/png');
  expect((lastUploadArgs?.content_b64 || '').length).toBeGreaterThan(100);
  await waitForPattern(page1);

  const savedBeadsBeforeClose = Number((await page1.locator('#totalBeads').textContent())?.replace(/\D/g, '') || 0);
  expect(savedBeadsBeforeClose).toBeGreaterThan(50);
  await expect.poll(() => Boolean(persistedApsValue)).toBe(true);
  await page1.close();

  // Issue #3: Closing and reopening the app in a fresh Anna window (?wid=win-review-2) must auto-restore the drawing!
  const page2 = await context.newPage();
  await page2.goto('/?wid=win-review-2&t=tok-review-2');
  await waitForPattern(page2);
  await expect(page2.locator('#emptyState')).toBeHidden();
  const restoredBeads = Number((await page2.locator('#totalBeads').textContent())?.replace(/\D/g, '') || 0);
  expect(restoredBeads).toBe(savedBeadsBeforeClose);

  await context.close();
});
