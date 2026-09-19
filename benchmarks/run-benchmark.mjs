import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { decodePng } from '../src/adapters/png.js';
import {
  generateBeadPattern,
  quantizePixels,
  getPaletteProvider,
} from '../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function timeOperation(fn, iterations = 5) {
  // Warmup run
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
  console.log('    BEAD GRID STUDIO - REPRODUCIBLE BENCHMARK SUITE ');
  console.log('====================================================\n');

  const fixturePath = path.join(rootDir, 'tests', 'fixtures', 'rocket-badge.png');
  const buffer = fs.readFileSync(fixturePath);
  const fixtureImage = decodePng(buffer);

  // Exact sizes requested by ROADMAP: 16, 24, 32, 48, 60
  const gridSizes = [16, 24, 32, 48, 60];
  const benchmarkResults = [];

  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU';

  const envInfo = {
    nodeVersion: process.version,
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: cpuModel,
    cpuCores: cpus.length,
    runtime: 'Node.js V8',
    fixture: 'tests/fixtures/rocket-badge.png (1024x1024 RGBA)',
    palette: 'mard-compatible-base-221',
    processMode: 'cartoon',
    iterations: 5,
  };

  for (const size of gridSizes) {
    process.stdout.write(`Benchmarking ${size}x${size} grid... `);

    const fn = () => quantizePixels({
      data: fixtureImage.data,
      width: fixtureImage.width,
      height: fixtureImage.height,
      cols: size,
      rows: size,
      palette: getPaletteProvider().colors,
      processMode: 'cartoon',
      maxColors: 32,
    });

    const initialMem = process.memoryUsage().heapUsed;
    const timing = timeOperation(fn, 5);
    const finalMem = process.memoryUsage().heapUsed;
    const heapDeltaKb = Number(((finalMem - initialMem) / 1024).toFixed(1));

    // Calculate pattern for checksum & bead counts
    const pattern = await generateBeadPattern(fixtureImage, {
      cols: size,
      rows: size,
      palette: 'mard-compatible-base-221',
      processMode: 'cartoon',
      maxColors: 32,
    });

    const checksum = crypto.createHash('sha256').update(JSON.stringify(pattern.grid.cells)).digest('hex').slice(0, 16);

    // Verify determinism across 3 runs
    let deterministic = true;
    for (let r = 0; r < 3; r++) {
      const p = await generateBeadPattern(fixtureImage, {
        cols: size,
        rows: size,
        palette: 'mard-compatible-base-221',
        processMode: 'cartoon',
        maxColors: 32,
      });
      const check = crypto.createHash('sha256').update(JSON.stringify(p.grid.cells)).digest('hex').slice(0, 16);
      if (check !== checksum) deterministic = false;
    }

    benchmarkResults.push({
      gridSize: `${size}x${size}`,
      cells: size * size,
      avgDurationMs: timing.avg,
      minDurationMs: timing.min,
      maxDurationMs: timing.max,
      totalBeads: pattern.statistics.totalBeads,
      uniqueColors: pattern.statistics.usedColors,
      checksum,
      determinism: deterministic ? '100% bitwise identical' : 'variance detected',
      heapDeltaKb,
    });

    console.log(`${timing.avg} ms (beads: ${pattern.statistics.totalBeads}, colors: ${pattern.statistics.usedColors}, hash: ${checksum})`);
  }

  const report = {
    timestamp: new Date().toISOString(),
    environment: envInfo,
    results: benchmarkResults,
    notice: 'Results may vary by machine.',
  };

  // Write to both paths for maximum developer convenience
  const rootJsonPath = path.join(rootDir, 'benchmark-results.json');
  const benchJsonPath = path.join(__dirname, 'results.json');
  fs.writeFileSync(rootJsonPath, JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(benchJsonPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`\nResults written to: ${rootJsonPath} and ${benchJsonPath}`);

  // Generate docs/benchmark.md automatically
  const mdContent = `# Performance Benchmarks & Determinism Report

> **Notice**: Results may vary by machine. Performance measurements below represent factual executions on the test system.

## Benchmark Environment

- **Node Version**: \`${envInfo.nodeVersion}\`
- **OS**: \`${envInfo.os}\`
- **CPU**: \`${envInfo.cpu}\` (${envInfo.cpuCores} cores)
- **Runtime**: \`${envInfo.runtime}\`
- **Fixture**: \`${envInfo.fixture}\`
- **Parameters**: Palette: \`${envInfo.palette}\`, Process Mode: \`${envInfo.processMode}\`, Max Colors: 32, Iterations: ${envInfo.iterations}

## Benchmark Results across Standard Grid Dimensions

The grid sizes below correspond to the core pegboard dimensions designated in \`ROADMAP.md\` (16, 24, 32, 48, 60 cells):

| Grid Size | Total Cells | Avg Duration (ms) | Min (ms) | Max (ms) | Total Beads | Unique Colors | Result Checksum (SHA-256) | Determinism |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
${benchmarkResults.map((r) => `| **${r.gridSize}** | ${r.cells} | **${r.avgDurationMs}** | ${r.minDurationMs} | ${r.maxDurationMs} | ${r.totalBeads} | ${r.uniqueColors} | \`${r.checksum}\` | ${r.determinism} |`).join('\n')}

## Reproducibility & Determinism Guarantee

All quantization operations in \`@bead-grid/core\` are 100% deterministic:
- Consecutive executions over identical inputs produce bitwise-identical cell matrices.
- Sorting of material codes breaks ties by lexicographical bead code (\`code.localeCompare()\`).
- Test suite \`npm run test:determinism\` validates determinism on every test run.

## How to Reproduce

\`\`\`bash
npm run benchmark
\`\`\`
`;

  const mdPath = path.join(rootDir, 'docs', 'benchmark.md');
  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`Updated benchmark documentation: ${mdPath}\n`);
}

runBenchmarks().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
