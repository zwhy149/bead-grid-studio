import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../tests/helpers/png.js';
import {
  generateBeadPattern,
  quantizePixels,
  analyzeSourceComplexity,
  analyzeLineArtSubject,
  getPaletteProvider,
  createCustomPalette,
} from '../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function createProceduralRgba(width, height, type = 'gradient') {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (type === 'gradient') {
        data[idx] = Math.round((x / width) * 255);
        data[idx + 1] = Math.round((y / height) * 255);
        data[idx + 2] = Math.round(((x + y) / (width + height)) * 255);
        data[idx + 3] = 255;
      } else if (type === 'checker') {
        const isWhite = ((Math.floor(x / 16) + Math.floor(y / 16)) % 2) === 0;
        const val = isWhite ? 255 : 20;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
  }
  return { data, width, height };
}

function timeOperation(fn, iterations = 5) {
  // Warmup
  fn();

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    avg: Number(avg.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    iterations,
  };
}

async function runBenchmarks() {
  console.log('====================================================');
  console.log('    BEAD GRID STUDIO - PERFORMANCE BENCHMARK SUITE   ');
  console.log('====================================================\n');

  // Load real fixture
  const fixturePath = path.join(rootDir, 'tests', 'fixtures', 'rocket-badge.png');
  const buffer = fs.readFileSync(fixturePath);
  const fixtureImage = decodePng(buffer);

  // Load custom mini palette
  const miniJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'examples', 'palettes', 'mini-starter-12.json'), 'utf8')
  );
  const miniPalette = createCustomPalette(miniJson);

  const testScenarios = [
    {
      name: 'Small Grid (16x16) - Rocket Badge (1024px source)',
      fn: () => quantizePixels({
        data: fixtureImage.data,
        width: fixtureImage.width,
        height: fixtureImage.height,
        cols: 16,
        rows: 16,
        palette: getPaletteProvider().colors,
        processMode: 'cartoon',
        maxColors: 16,
      }),
    },
    {
      name: 'Mini Pegboard Standard (29x29) - Rocket Badge',
      fn: () => quantizePixels({
        data: fixtureImage.data,
        width: fixtureImage.width,
        height: fixtureImage.height,
        cols: 29,
        rows: 29,
        palette: getPaletteProvider().colors,
        processMode: 'cartoon',
        maxColors: 32,
      }),
    },
    {
      name: 'Large Pegboard (52x52) - Rocket Badge (Cartoon)',
      fn: () => quantizePixels({
        data: fixtureImage.data,
        width: fixtureImage.width,
        height: fixtureImage.height,
        cols: 52,
        rows: 52,
        palette: getPaletteProvider().colors,
        processMode: 'cartoon',
        maxColors: 48,
      }),
    },
    {
      name: 'HD Detail Mode (52x52) - Rocket Badge (Detail Mode)',
      fn: () => quantizePixels({
        data: fixtureImage.data,
        width: fixtureImage.width,
        height: fixtureImage.height,
        cols: 52,
        rows: 52,
        palette: getPaletteProvider().colors,
        processMode: 'detail',
        maxColors: 64,
      }),
    },
    {
      name: 'Constrained Palette (29x29) - 12 Mini Starter Colors',
      fn: () => quantizePixels({
        data: fixtureImage.data,
        width: fixtureImage.width,
        height: fixtureImage.height,
        cols: 29,
        rows: 29,
        palette: miniPalette.colors,
        processMode: 'cartoon',
        maxColors: 12,
      }),
    },
    {
      name: 'High-Entropy Gradient (256x256 source -> 40x40 Photo Mode)',
      fn: () => {
        const grad = createProceduralRgba(256, 256, 'gradient');
        return quantizePixels({
          data: grad.data,
          width: grad.width,
          height: grad.height,
          cols: 40,
          rows: 40,
          palette: getPaletteProvider().colors,
          processMode: 'photo',
          maxColors: 32,
        });
      },
    },
    {
      name: 'Complexity & Line Art Analyzer (1024x1024 Rocket Badge)',
      fn: () => {
        analyzeSourceComplexity(fixtureImage.data, fixtureImage.width, fixtureImage.height);
        analyzeLineArtSubject(fixtureImage.data, fixtureImage.width, fixtureImage.height);
      },
    },
  ];

  const results = [];

  for (const scenario of testScenarios) {
    process.stdout.write(`Benchmarking: ${scenario.name}... `);
    const initialMemory = process.memoryUsage().heapUsed;
    const stats = timeOperation(scenario.fn, 5);
    const finalMemory = process.memoryUsage().heapUsed;
    const memDeltaKb = Number(((finalMemory - initialMemory) / 1024).toFixed(1));

    results.push({
      scenario: scenario.name,
      avgMs: stats.avg,
      minMs: stats.min,
      maxMs: stats.max,
      iterations: stats.iterations,
      heapDeltaKb: memDeltaKb,
    });
    console.log(`${stats.avg} ms (min: ${stats.min} ms, max: ${stats.max} ms)`);
  }

  // End-to-end generateBeadPattern test
  console.log('\nRunning End-to-End Pipeline test...');
  const e2eStart = performance.now();
  const pattern = await generateBeadPattern(fixtureImage, {
    cols: 29,
    rows: 29,
    palette: 'mard-compatible-base-221',
    processMode: 'cartoon',
  });
  const e2eElapsed = Number((performance.now() - e2eStart).toFixed(2));
  console.log(`End-to-end generateBeadPattern: ${e2eElapsed} ms (${pattern.statistics.totalBeads} beads, ${pattern.statistics.usedColors} colors)`);

  const benchmarkReport = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    results,
    e2ePipeline: {
      elapsedMs: e2eElapsed,
      beadCount: pattern.statistics.totalBeads,
      colorCount: pattern.statistics.usedColors,
    },
  };

  const outJson = path.join(__dirname, 'results.json');
  fs.writeFileSync(outJson, JSON.stringify(benchmarkReport, null, 2), 'utf8');
  console.log(`\nResults written to: ${outJson}`);

  console.log('\n--- Summary Table ---');
  console.table(results.map((r) => ({
    Scenario: r.scenario,
    'Avg (ms)': r.avgMs,
    'Min (ms)': r.minMs,
    'Max (ms)': r.maxMs,
  })));
}

runBenchmarks().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
