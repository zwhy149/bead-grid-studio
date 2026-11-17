import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, 'dist');
const annaDir = join(root, 'anna-app');
const bundleDir = join(annaDir, 'bundle');
const vendorDir = join(annaDir, 'executas', 'bead-studio', 'vendor');

async function buildAnnaApp() {
  // 1. Copy production Vite dist into anna-app/bundle/
  await rm(bundleDir, { recursive: true, force: true });
  await mkdir(bundleDir, { recursive: true });
  await cp(distDir, bundleDir, { recursive: true });

  // Inject anna-tool-ids.js sidecar ONLY in the Anna bundle index.html
  const indexPath = join(bundleDir, 'index.html');
  let html = await readFile(indexPath, 'utf8');
  if (!html.includes('anna-tool-ids.js')) {
    html = html.replace(
      /<script type="module"/i,
      '<script src="anna-tool-ids.js" defer></script>\n  <script type="module"',
    );
    await writeFile(indexPath, html, 'utf8');
  }

  // 2. Sync zero-dependency core + PNG adapter into executas/bead-studio/vendor/
  await rm(vendorDir, { recursive: true, force: true });
  await mkdir(join(vendorDir, 'core'), { recursive: true });
  await mkdir(join(vendorDir, 'adapters'), { recursive: true });
  await cp(join(root, 'packages', 'core', 'src'), join(vendorDir, 'core'), { recursive: true });
  await cp(join(root, 'src', 'adapters', 'png.js'), join(vendorDir, 'adapters', 'png.js'));

  console.log(`Synced Anna App bundle -> ${bundleDir}`);
  console.log(`Synced Executa vendor -> ${vendorDir}`);
}

buildAnnaApp().catch((err) => {
  console.error('Failed to build Anna App artifacts:', err);
  process.exit(1);
});
