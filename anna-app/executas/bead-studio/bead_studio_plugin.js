#!/usr/bin/env node
/**
 * bead-studio — Anna AI OS Executa stdio tool plugin (Node.js)
 *
 * Protocol: JSON-RPC 2.0 over stdio (newline-delimited)
 * Methods : describe, invoke, health
 *
 * Exposes four AI-native fuse-bead tools powered by @bead-grid/core:
 *   - create_pixel_pattern : turn an LLM-designed character matrix + colorMap into a MARD 221 pattern + SVG
 *   - generate_pattern     : quantize a local PNG image into a MARD 221 bead pattern + SVG
 *   - optimize_pattern     : despeckle isolated stray beads, suggest color merges, and compute build complexity
 *   - lookup_palette       : match CSS HEX / series / codes against the MARD-compatible 221 catalog
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {
  analyzeBuildComplexity,
  createPattern,
  createPatternFromMatrix,
  despeckleGrid,
  findNearestPaletteColor,
  generateBeadPattern,
  getPaletteProvider,
  parsePattern,
  renderPatternSvg,
  replaceGridColor,
  suggestColorMerges,
} from './vendor/core/index.js';
import { decodePng } from './vendor/adapters/png.js';

const MANIFEST = {
  name: 'bead-studio',
  display_name: 'Bead Grid Studio Engine',
  version: '1.5.2',
  description:
    'Deterministic fuse-bead pattern quantization, AI matrix-to-pattern compilation, stray-bead despeckling, perceptual color matching (CIEDE2000), and SVG construction-sheet rendering.',
  author: 'zwhy149',
  homepage: 'https://github.com/zwhy149/bead-grid-studio',
  icon: '🎨',
  category: 'creative',
  license: 'Apache-2.0',
  tags: ['creative', 'fuse-beads', 'pixel-art', 'quantization', 'anna-app'],
  tools: [
    {
      name: 'create_pixel_pattern',
      description:
        'Compile an ASCII/character pixel matrix or 2D token grid plus optional colorMap into a validated MARD-compatible bead pattern JSON, crafting complexity summary, and optional SVG sheet.',
      parameters: [
        {
          name: 'matrix',
          type: 'array',
          description: 'Array of equal-length row strings (e.g. ["..RR..", ".RRRR."]) or 2D array of color tokens. Use "." or " " for empty cells.',
          required: true,
        },
        {
          name: 'colorMap',
          type: 'object',
          description: 'Map of matrix character/token -> MARD code (e.g. "F5") or CSS HEX (e.g. "#E7002F").',
          required: false,
          default: {},
        },
        {
          name: 'title',
          type: 'string',
          description: 'Pattern title (max 80 chars).',
          required: false,
          default: 'AI Pixel Pattern',
        },
        {
          name: 'includeSvg',
          type: 'boolean',
          description: 'When true, returns a rendered SVG construction sheet string.',
          required: false,
          default: true,
        },
      ],
    },
    {
      name: 'generate_pattern',
      description:
        'Convert a local PNG image file into a MARD-compatible 221-code fuse-bead pattern with optional stray-bead despeckling and SVG construction sheet.',
      parameters: [
        {
          name: 'imagePath',
          type: 'string',
          description: 'Path to an existing PNG file on disk.',
          required: true,
        },
        {
          name: 'width',
          type: 'integer',
          description: 'Target grid columns (4-160). Default: 32.',
          required: false,
          default: 32,
        },
        {
          name: 'height',
          type: 'integer',
          description: 'Target grid rows (4-160). Defaults to width.',
          required: false,
        },
        {
          name: 'processMode',
          type: 'string',
          description: 'Quantization mode: cartoon | detail | document | photo | pixel. Default: cartoon.',
          required: false,
          default: 'cartoon',
        },
        {
          name: 'maxColors',
          type: 'integer',
          description: 'Maximum active colors (2-64). Default: 24.',
          required: false,
          default: 24,
        },
        {
          name: 'despeckle',
          type: 'boolean',
          description: 'Clean isolated 1-bead noise after quantization. Default: true.',
          required: false,
          default: true,
        },
        {
          name: 'includeSvg',
          type: 'boolean',
          description: 'Include rendered SVG construction sheet. Default: false.',
          required: false,
          default: false,
        },
      ],
    },
    {
      name: 'optimize_pattern',
      description:
        'Optimize an existing bead-grid-studio pattern JSON: clean isolated stray beads, optionally merge rare colors (<=2 beads), and compute build complexity metrics.',
      parameters: [
        {
          name: 'pattern',
          type: 'object',
          description: 'A valid bead-grid-studio pattern object.',
          required: true,
        },
        {
          name: 'despeckle',
          type: 'boolean',
          description: 'Run isolated-bead despeckling. Default: true.',
          required: false,
          default: true,
        },
        {
          name: 'mergeRareColors',
          type: 'boolean',
          description: 'Auto-merge <=2-bead rare colors with deltaE <= 18 into closest used neighbor. Default: false.',
          required: false,
          default: false,
        },
      ],
    },
    {
      name: 'lookup_palette',
      description:
        'Search the MARD-compatible 221 bead palette by CSS HEX color (perceptual CIEDE2000), exact code, or color series (A/B/C/D/E/F/G/H/M).',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Hex color (#RRGGBB), MARD code (e.g. "H7"), or series letter ("A"-"M").',
          required: true,
        },
      ],
    },
  ],
  runtime: { type: 'node', min_version: '18.0.0' },
};

function serializePublicPattern(model) {
  return {
    schemaVersion: model.schemaVersion,
    type: model.type,
    version: model.version,
    appVersion: model.appVersion,
    title: model.title,
    createdAt: model.createdAt,
    grid: model.grid,
    palette: model.palette,
    statistics: model.statistics,
  };
}

async function toolCreatePixelPattern(args) {
  const model = createPatternFromMatrix({
    matrix: args.matrix,
    colorMap: args.colorMap || {},
    title: String(args.title || 'AI Pixel Pattern').slice(0, 80),
  });
  const complexity = analyzeBuildComplexity(model);
  const publicPattern = serializePublicPattern(model);
  const result = {
    pattern: publicPattern,
    complexity,
  };
  if (args.includeSvg !== false) {
    result.svg = renderPatternSvg(model);
  }
  return result;
}

async function toolGeneratePattern(args) {
  const imagePath = path.resolve(String(args.imagePath || ''));
  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new Error(`PNG file not found: ${args.imagePath}`);
  }
  const png = decodePng(fs.readFileSync(imagePath));
  const cols = Math.max(4, Math.min(160, Number(args.width) || 32));
  const rows = Math.max(4, Math.min(160, Number(args.height) || cols));
  let model = await generateBeadPattern(png, {
    cols,
    rows,
    processMode: args.processMode || 'cartoon',
    maxColors: Math.max(2, Math.min(64, Number(args.maxColors) || 24)),
    title: path.basename(imagePath, path.extname(imagePath)),
  });

  let despeckledCount = 0;
  if (args.despeckle !== false) {
    const cleaned = despeckleGrid(model.rawIndices, cols, rows, { minNeighbors: 1 });
    despeckledCount = cleaned.changedCount;
    if (despeckledCount > 0) {
      model = createPattern({
        width: cols,
        height: rows,
        cells: cleaned.cells,
        title: model.title,
      });
    }
  }

  const complexity = analyzeBuildComplexity(model);
  const mergeSuggestions = suggestColorMerges(model.rawIndices, getPaletteProvider().colors);
  const result = {
    pattern: serializePublicPattern(model),
    complexity,
    despeckledCount,
    mergeSuggestions,
  };
  if (args.includeSvg === true) {
    result.svg = renderPatternSvg(model);
  }
  return result;
}

async function toolOptimizePattern(args) {
  const parsed = parsePattern(args.pattern);
  const provider = getPaletteProvider(parsed.palette?.id);
  let working = new Int16Array(parsed.rawIndices);
  const cols = parsed.grid.cols;
  const rows = parsed.grid.rows;

  let despeckledCount = 0;
  if (args.despeckle !== false) {
    const cleaned = despeckleGrid(working, cols, rows, { minNeighbors: 1 });
    working = cleaned.cells;
    despeckledCount = cleaned.changedCount;
  }

  let mergedRareColors = 0;
  let mergedBeads = 0;
  if (args.mergeRareColors === true) {
    const merges = suggestColorMerges(working, provider.colors, { maxBeadCount: 2, maxDeltaE: 18 });
    for (const m of merges) {
      const res = replaceGridColor(working, m.fromIndex, m.toIndex);
      working = res.cells;
      mergedBeads += res.replacedCount;
      if (res.replacedCount > 0) mergedRareColors++;
    }
  }

  const updated = createPattern({
    width: cols,
    height: rows,
    cells: working,
    palette: provider,
    title: parsed.title,
  });

  return {
    pattern: serializePublicPattern(updated),
    despeckledCount,
    mergedRareColors,
    mergedBeads,
    remainingMergeSuggestions: suggestColorMerges(working, provider.colors),
    complexity: analyzeBuildComplexity(updated),
  };
}

async function toolLookupPalette(args) {
  const query = String(args.query || '').trim();
  const provider = getPaletteProvider();
  if (!query) throw new Error('query cannot be empty');

  if (/^[A-HM]$/i.test(query)) {
    const series = query.toUpperCase();
    return {
      mode: 'series',
      series,
      colors: provider.colors
        .filter((c) => c.series === series)
        .map((c) => ({ code: c.code, hex: c.hex, name: c.name })),
    };
  }

  const matched = findNearestPaletteColor(query, provider.colors, { includeTransparent: true });
  if (!matched) {
    throw new Error(`No palette match found for "${query}". Pass #RRGGBB, MARD code (e.g. A1), or series letter (A-M).`);
  }
  return {
    mode: matched.deltaE === 0 ? 'exact' : 'perceptual_ciede2000',
    deltaE: matched.deltaE,
    color: {
      code: matched.color.code,
      hex: matched.color.hex,
      name: matched.color.name,
      series: matched.color.series,
      isTransparent: matched.color.isTransparent,
    },
  };
}

const TOOL_DISPATCH = {
  create_pixel_pattern: toolCreatePixelPattern,
  generate_pattern: toolGeneratePattern,
  optimize_pattern: toolOptimizePattern,
  lookup_palette: toolLookupPalette,
};

async function handleInvoke(params) {
  const tool = params.tool;
  const args = params.arguments && typeof params.arguments === 'object' ? params.arguments : {};
  const fn = TOOL_DISPATCH[tool];
  if (!fn) throw new Error(`unknown tool: ${JSON.stringify(tool)}`);
  try {
    const payload = await fn(args);
    return { success: true, data: payload };
  } catch (err) {
    return { success: false, error: `${err.name}: ${err.message}` };
  }
}

const METHOD_DISPATCH = {
  describe: async () => MANIFEST,
  invoke: handleInvoke,
  health: async () => ({ status: 'ok', version: MANIFEST.version }),
};

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function main() {
  process.stderr.write(`[bead-studio] ${MANIFEST.display_name} v${MANIFEST.version} ready (node ${process.versions.node})\n`);
  const rl = readline.createInterface({ input: process.stdin });
  let chain = Promise.resolve();
  rl.on('line', (raw) => {
    const line = raw.trim();
    if (!line) return;
    let req;
    try {
      req = JSON.parse(line);
    } catch (err) {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: `parse error: ${err.message}` } });
      return;
    }
    const reqId = req.id;
    const method = req.method;
    const params = req.params || {};
    const handler = METHOD_DISPATCH[method];
    chain = chain.then(async () => {
      if (!handler) {
        send({ jsonrpc: '2.0', id: reqId, error: { code: -32601, message: `method not found: ${method}` } });
        return;
      }
      try {
        const result = await handler(params);
        send({ jsonrpc: '2.0', id: reqId, result });
      } catch (err) {
        send({ jsonrpc: '2.0', id: reqId, error: { code: -32000, message: err.message || String(err) } });
      }
    });
  });
}

main();
