import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1));
const fixture = join(root, 'tests', 'fixtures', 'rocket-badge.png');
const assets = join(root, 'docs', 'assets');
await mkdir(assets, { recursive: true });

const browser = await chromium.launch();

async function loadFixture(page) {
  await page.goto('http://127.0.0.1:4173/');
  await page.setInputFiles('#imageInput', fixture);
  await page.waitForFunction(() => {
    const card = document.querySelector('#smartCard');
    const overlay = document.querySelector('#convertOverlay');
    return card && !card.hidden && !overlay?.classList.contains('is-visible') && /已生成|可以直接/.test(card.textContent || '');
  }, null, { timeout: 30_000 });
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await loadFixture(desktop);
await desktop.screenshot({ path: join(assets, 'app-desktop.png') });
await desktop.close();

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await loadFixture(mobile);
await mobile.screenshot({ path: join(assets, 'app-mobile.png') });
await mobile.close();

await browser.close();
console.log('Documentation screenshots captured.');
