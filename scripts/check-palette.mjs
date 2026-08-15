import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PALETTE } from '../src/palettes/mard221.js';

const SOURCE_PATH = 'src/palettes/provenance/mard-291.csv';
const EXPECTED_SHA256 = '898BBEAC2C2BCF41E5293554E46545F42628FBD2CB2BC3E3C9313C889DBBE700';
const BASE_SERIES = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'M']);

const source = await readFile(SOURCE_PATH);
const sha256 = createHash('sha256').update(source).digest('hex').toUpperCase();
if (sha256 !== EXPECTED_SHA256) {
  throw new Error(`${SOURCE_PATH} SHA-256 mismatch: ${sha256}`);
}

const rows = source.toString('utf8').trim().split(/\r?\n/).map((line, index) => {
  const [code, name, r, g, b, hex, contributor] = line.split(',');
  if (!code || !hex || !contributor) throw new Error(`Malformed palette row ${index + 1}`);
  return { code, name, r: Number(r), g: Number(g), b: Number(b), hex: hex.toUpperCase(), contributor };
});

if (rows.length !== 291) throw new Error(`Expected 291 source rows, found ${rows.length}`);

const naturalCodeOrder = (left, right) => {
  const seriesOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'M'];
  const leftSeries = left.code[0];
  const rightSeries = right.code[0];
  return seriesOrder.indexOf(leftSeries) - seriesOrder.indexOf(rightSeries)
    || Number(left.code.slice(1)) - Number(right.code.slice(1));
};

const upstreamBase = rows
  .filter((row) => BASE_SERIES.has(row.code[0]))
  .sort(naturalCodeOrder);
const localBase = [...PALETTE].sort(naturalCodeOrder);

if (upstreamBase.length !== 221 || localBase.length !== 221) {
  throw new Error(`Expected 221 base colors, found upstream=${upstreamBase.length}, local=${localBase.length}`);
}

for (let index = 0; index < upstreamBase.length; index += 1) {
  const upstream = upstreamBase[index];
  const local = localBase[index];
  if (local.code !== upstream.code || local.hex.toUpperCase() !== upstream.hex) {
    throw new Error(`Palette mismatch at ${index}: local ${local.code} ${local.hex}, upstream ${upstream.code} ${upstream.hex}`);
  }
}

console.log(`Palette provenance passed: ${rows.length} pinned rows, ${localBase.length} verified base colors, SHA-256 ${sha256}.`);
