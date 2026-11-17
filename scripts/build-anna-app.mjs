import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, 'dist');
const annaDir = join(root, 'anna-app');
const bundleDir = join(annaDir, 'bundle');
const executaDir = join(annaDir, 'executas', 'bead-studio');
const vendorDir = join(executaDir, 'vendor');
const artifactDistDir = join(executaDir, 'dist');

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

async function collectArchiveFiles(dir, baseDir = dir, rels = []) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      await collectArchiveFiles(full, baseDir, rels);
    } else if (ent.isFile()) {
      rels.push(relative(baseDir, full).split(sep).join('/'));
    }
  }
  return rels.sort();
}

function buildTarGz(entries) {
  const chunks = [];
  for (const { name, data, mode } of entries) {
    const nameBytes = Buffer.from(name, 'utf8');
    if (nameBytes.length > 99) {
      throw new Error(`Tar entry name exceeds 99 bytes: ${name}`);
    }
    const header = Buffer.alloc(512, 0);
    nameBytes.copy(header, 0);
    header.write(`${mode.toString(8).padStart(7, '0')}\0`, 100, 'ascii');
    header.write('0000000\0', 108, 'ascii');
    header.write('0000000\0', 116, 'ascii');
    header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124, 'ascii');
    header.write(`${Math.floor(Date.now() / 1000).toString(8).padStart(11, '0')}\0`, 136, 'ascii');
    header.fill(0x20, 148, 156);
    header.write('0', 156, 'ascii');
    header.write('ustar\0', 257, 'ascii');
    header.write('00', 263, 'ascii');

    let sum = 0;
    for (let i = 0; i < 512; i++) sum += header[i];
    header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'ascii');

    chunks.push(header, data);
    const rem = data.length % 512;
    if (rem !== 0) chunks.push(Buffer.alloc(512 - rem, 0));
  }
  chunks.push(Buffer.alloc(1024, 0));
  return gzipSync(Buffer.concat(chunks));
}

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const { name, data, unixMode } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const sum = crc32(data);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(sum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(sum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(((unixMode & 0xffff) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    localParts.push(local, data);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

async function exportExecutaProtocolManifest() {
  const rpcLine = `${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'describe', params: {} })}\n`;
  const stdout = execFileSync(process.execPath, [join(executaDir, 'bead_studio_plugin.js')], {
    cwd: executaDir,
    input: rpcLine,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const firstLine = stdout.trim().split(/\r?\n/)[0];
  const response = JSON.parse(firstLine);
  if (!response?.result?.tools) {
    throw new Error('Failed to extract describe manifest from bead_studio_plugin.js');
  }
  await writeFile(join(executaDir, 'manifest.json'), `${JSON.stringify(response.result, null, 2)}\n`, 'utf8');
}

async function buildExecutaArchives() {
  const vendorRels = await collectArchiveFiles(vendorDir);
  const relFiles = [
    'bin/bead-studio',
    'bin/bead-studio.cmd',
    'bead_studio_plugin.js',
    'manifest.json',
    'package.json',
    ...vendorRels.map((r) => `vendor/${r}`),
  ];

  const entries = [];
  for (const rel of relFiles) {
    let data = await readFile(join(executaDir, rel));
    // Guarantee POSIX shell shim & JS files retain LF inside cross-platform tarballs.
    if (rel === 'bin/bead-studio') {
      data = Buffer.from(data.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    }
    const isExec = rel === 'bin/bead-studio';
    entries.push({
      name: rel,
      data,
      mode: isExec ? 0o755 : 0o644,
      unixMode: isExec ? 0o100755 : 0o100644,
    });
  }

  await mkdir(artifactDistDir, { recursive: true });
  const posixTarGz = buildTarGz(entries);
  const winZip = buildZip(entries);
  await writeFile(join(artifactDistDir, 'bead-studio-posix.tar.gz'), posixTarGz);
  await writeFile(join(artifactDistDir, 'bead-studio-win.zip'), winZip);
  return { posixBytes: posixTarGz.length, winBytes: winZip.length };
}

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

  // 3. Export protocol manifest & cross-platform distribution archives for Anna CDN
  await exportExecutaProtocolManifest();
  const sizes = await buildExecutaArchives();

  console.log(`Synced Anna App bundle -> ${bundleDir}`);
  console.log(`Synced Executa vendor -> ${vendorDir}`);
  console.log(`Built Executa CDN archives -> posix=${sizes.posixBytes}B, win=${sizes.winBytes}B`);
}

buildAnnaApp().catch((err) => {
  console.error('Failed to build Anna App artifacts:', err);
  process.exit(1);
});
