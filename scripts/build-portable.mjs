import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const release = join(root, 'release');
let html = await readFile(join(dist, 'index.html'), 'utf8');

const stylesheet = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
const moduleScript = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
if (!stylesheet || !moduleScript) throw new Error('Unable to locate Vite build assets.');

const resolveAsset = (href) => join(dist, href.replace(/^\.\//, ''));
const [css, js, license, notice] = await Promise.all([
  readFile(resolveAsset(stylesheet[1]), 'utf8'),
  readFile(resolveAsset(moduleScript[1]), 'utf8'),
  readFile(join(root, 'LICENSE'), 'utf8'),
  readFile(join(root, 'NOTICE'), 'utf8'),
]);

const normalizeText = (value) => value.replace(/\r\n?/g, '\n');
const asInertText = (value) => normalizeText(value).replace(/<\/script/gi, '<\\/script');
const embeddedLegal = [
  '<!-- The following non-executable blocks make the portable file license-complete offline. -->',
  `<script type="text/plain" id="bead-grid-studio-license">\n${asInertText(license)}\n</script>`,
  `<script type="text/plain" id="bead-grid-studio-third-party-notices">\n${asInertText(notice)}\n</script>`,
].join('\n');

html = html
  .replace(stylesheet[0], `<style>\n${css}\n</style>`)
  .replace(moduleScript[0], `<script type="module">\n${js}\n</script>`)
  .replace(/\s*<link rel="manifest"[^>]*>/, '')
  .replaceAll('href="./privacy.html"', 'href="https://zwhy149.github.io/bead-grid-studio/privacy.html"')
  .replaceAll('href="./terms.html"', 'href="https://zwhy149.github.io/bead-grid-studio/terms.html"')
  .replaceAll('href="./LICENSE.txt"', 'href="https://github.com/zwhy149/bead-grid-studio/blob/main/LICENSE"')
  .replaceAll('href="./NOTICE.txt"', 'href="https://github.com/zwhy149/bead-grid-studio/blob/main/NOTICE"')
  .replaceAll('href="./version.json"', 'href="https://zwhy149.github.io/bead-grid-studio/version.json"')
  .replace('href="./app-icon.svg"', 'href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect width=%2232%22 height=%2232%22 rx=%227%22 fill=%22%2324221f%22/><circle cx=%2210%22 cy=%2210%22 r=%223%22 fill=%22%23dc6b55%22/><circle cx=%2222%22 cy=%2210%22 r=%223%22 fill=%22%23f4e0d6%22/><circle cx=%2210%22 cy=%2222%22 r=%223%22 fill=%22%23f4e0d6%22/><circle cx=%2222%22 cy=%2222%22 r=%223%22 fill=%22%23dc6b55%22/></svg>"')
  .replace('</body>', `${embeddedLegal}\n</body>`);

if (/<script[^>]+src=/i.test(html) || /<link[^>]+rel="stylesheet"/i.test(html)) {
  throw new Error('Portable release still depends on an external script or stylesheet.');
}
if (html.includes('href="./LICENSE.txt"')) {
  throw new Error('Portable release contains a broken relative license link.');
}
if (!html.includes('Apache License')
  || !html.includes('pinned data commit 94b99999652866f1a1879d6369fe735f811949e5')
  || !html.includes('Copyright (c) 2020 maxcleme')
  || !html.includes('Copyright (c) 2019-present, VoidZero Inc. and Vite contributors')) {
  throw new Error('Portable release is missing embedded license or third-party notices.');
}
const removedReferenceTerms = ['Zip' + 'pland', 'perler' + '-beads', 'AG' + 'PL', 'Aff' + 'ero'];
if (removedReferenceTerms.some((term) => html.toLowerCase().includes(term.toLowerCase()))) {
  throw new Error('Portable release contains a removed project-reference term.');
}

await mkdir(release, { recursive: true });
const version = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version;
const output = join(release, `bead-grid-studio-v${version}.html`);
await writeFile(output, html, 'utf8');
const bytes = Buffer.from(html);
const digest = createHash('sha256').update(bytes).digest('hex').toUpperCase();
await writeFile(join(release, 'SHA256SUMS.txt'), `${digest}  ${basename(output)}\n`, 'utf8');
console.log(`Portable release: ${output} (${bytes.length} bytes, SHA-256 ${digest})`);
