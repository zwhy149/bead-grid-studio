import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ANNA_DIR = path.join(ROOT_DIR, 'anna-app');
const EXECUTA_ENTRY = path.join(ANNA_DIR, 'executas', 'bead-studio', 'bead_studio_plugin.js');
const ROCKET_PNG = path.join(ROOT_DIR, 'tests', 'fixtures', 'rocket-badge.png');
const CLI_ENTRY = path.join(ROOT_DIR, 'bin', 'bead-grid.mjs');

function runExecutaRpcSession(requests) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [EXECUTA_ENTRY], {
      cwd: path.join(ANNA_DIR, 'executas', 'bead-studio'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const responses = new Map();
    let stdoutBuffer = '';
    let stderrText = '';

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Executa RPC session timed out. stderr=${stderrText}`));
    }, 15000);

    child.stderr.on('data', (chunk) => {
      stderrText += chunk.toString('utf8');
    });

    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString('utf8');
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? '';
      for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (!trimmed) continue;
        const msg = JSON.parse(trimmed);
        responses.set(msg.id, msg);
        if (responses.size >= requests.length) {
          clearTimeout(timer);
          child.stdin.end();
        }
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (responses.size < requests.length) {
        reject(new Error(`Executa exited (${code}) with ${responses.size}/${requests.length} responses. stderr=${stderrText}`));
        return;
      }
      resolve({ responses, stderrText });
    });

    for (const req of requests) {
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...req })}\n`);
    }
  });
}

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => {
      stdout += c.toString('utf8');
    });
    child.stderr.on('data', (c) => {
      stderr += c.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('anna-app manifests conform to schema 4 and self-contained packaging rules', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ANNA_DIR, 'manifest.json'), 'utf8'));
  const appMeta = JSON.parse(fs.readFileSync(path.join(ANNA_DIR, 'app.json'), 'utf8'));
  const studioExecuta = JSON.parse(fs.readFileSync(path.join(ANNA_DIR, 'executas', 'bead-studio', 'executa.json'), 'utf8'));
  const coachExecuta = JSON.parse(fs.readFileSync(path.join(ANNA_DIR, 'executas', 'bead-craft-coach', 'executa.json'), 'utf8'));

  assert.equal(manifest.schema, 4);
  assert.equal('host_api' in (manifest.ui || {}), false);
  assert.ok(Array.isArray(manifest.ui?.form_factors));
  assert.ok(manifest.ui.form_factors.includes('desktop'));
  assert.ok(manifest.ui.form_factors.includes('mobile'));
  assert.ok(manifest.ui.views[0].min_size.h <= 600);
  assert.equal(manifest.ui.bundle.format, 'static-spa');

  assert.equal(appMeta.slug, 'bead-grid-studio');
  assert.ok(appMeta.bundled_executas['bead-studio']);
  assert.ok(appMeta.bundled_executas['bead-craft-coach']);
  assert.equal(studioExecuta.type, 'node');
  assert.equal(coachExecuta.executa_type, 'skill');

  assert.ok(fs.existsSync(path.join(ANNA_DIR, 'executas', 'bead-studio', 'vendor', 'core', 'index.js')));
  assert.ok(fs.existsSync(path.join(ANNA_DIR, 'executas', 'bead-studio', 'vendor', 'adapters', 'png.js')));

  const buildScript = fs.readFileSync(path.join(ROOT_DIR, 'scripts', 'build-anna-app.mjs'), 'utf8');
  assert.match(buildScript, /anna-tool-ids\.js/);

  const bundleHtmlPath = path.join(ANNA_DIR, 'bundle', 'index.html');
  if (fs.existsSync(bundleHtmlPath)) {
    const bundleHtml = fs.readFileSync(bundleHtmlPath, 'utf8');
    assert.match(bundleHtml, /anna-tool-ids\.js/);
  }
});

test('bead-studio Executa responds to describe, health, lookup_palette, create_pixel_pattern, generate_pattern, and optimize_pattern over stdio JSON-RPC', async () => {
  const noisyPattern = {
    schemaVersion: 1,
    type: 'bead-grid-studio',
    version: 2,
    appVersion: '1.5.0',
    title: 'Noisy Test Sprite',
    createdAt: '2026-11-17T00:00:00.000Z',
    grid: {
      cols: 6,
      rows: 6,
      cells: [
        'H7', 'H7', 'H7', 'H7', 'H7', 'H7',
        'H7', 'F5', 'F5', 'F5', 'F5', 'H7',
        'H7', 'F5', 'F4', 'F4', 'F5', 'H7',
        'H7', 'F5', 'E5', 'F5', 'F5', 'H7',
        'H7', 'F5', 'F5', 'F5', 'F5', 'H7',
        'H7', 'H7', 'H7', 'H7', 'H7', 'H7',
      ],
    },
    palette: { id: 'mard-compatible-base-221' },
  };

  const requests = [
    { id: 1, method: 'health', params: {} },
    { id: 2, method: 'describe', params: {} },
    { id: 3, method: 'invoke', params: { tool: 'lookup_palette', arguments: { query: '#E7002F' } } },
    { id: 4, method: 'invoke', params: { tool: 'lookup_palette', arguments: { query: 'H' } } },
    {
      id: 5,
      method: 'invoke',
      params: {
        tool: 'create_pixel_pattern',
        arguments: {
          title: 'Mini Heart',
          matrix: ['..R..R..', '.RRRRRR.', '.RRRRRR.', '..RRRR..', '...RR...'],
          colorMap: { R: 'F5' },
          includeSvg: true,
        },
      },
    },
    {
      id: 6,
      method: 'invoke',
      params: {
        tool: 'generate_pattern',
        arguments: {
          imagePath: ROCKET_PNG,
          width: 24,
          height: 24,
          processMode: 'cartoon',
          maxColors: 12,
          despeckle: true,
          includeSvg: true,
        },
      },
    },
    {
      id: 7,
      method: 'invoke',
      params: {
        tool: 'optimize_pattern',
        arguments: {
          pattern: noisyPattern,
          despeckle: true,
          mergeRareColors: true,
        },
      },
    },
    { id: 8, method: 'invoke', params: { tool: 'missing_tool', arguments: {} } },
  ];

  const { responses } = await runExecutaRpcSession(requests);

  assert.equal(responses.get(1).result.status, 'ok');
  assert.equal(responses.get(2).result.tools.length, 4);

  const hexLookup = responses.get(3).result;
  assert.equal(hexLookup.success, true);
  assert.ok(hexLookup.data.color.code);

  const seriesLookup = responses.get(4).result;
  assert.equal(seriesLookup.success, true);
  assert.equal(seriesLookup.data.mode, 'series');
  assert.ok(seriesLookup.data.colors.length >= 10);

  const matrixRes = responses.get(5).result;
  assert.equal(matrixRes.success, true);
  assert.equal(matrixRes.data.pattern.statistics.totalBeads, 20);
  assert.match(matrixRes.data.svg, /<svg/);
  assert.ok(matrixRes.data.complexity.estimatedMinutes > 0);

  const genRes = responses.get(6).result;
  assert.equal(genRes.success, true);
  assert.equal(genRes.data.pattern.grid.cols, 24);
  assert.ok(genRes.data.pattern.statistics.totalBeads > 100);
  assert.match(genRes.data.svg, /<svg/);

  const optRes = responses.get(7).result;
  assert.equal(optRes.success, true);
  assert.ok(optRes.data.despeckledCount >= 1);
  assert.ok(optRes.data.mergedBeads >= 2);
  assert.equal(optRes.data.pattern.statistics.usedColors, 2);

  assert.ok(responses.get(8).error);
});

test('CLI supports --format svg and --despeckle on PNG fixtures', async () => {
  const { code, stdout, stderr } = await runCli([ROCKET_PNG, '-w', '24', '--despeckle', '--format', 'svg']);
  assert.equal(code, 0, stderr);
  assert.match(stdout, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(stdout, /24x24 · \d+ colors · \d+ beads/);
  assert.match(stdout, /<\/svg>\s*$/);
});
