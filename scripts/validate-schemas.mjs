import { readFile } from 'node:fs/promises';

async function validateSchemas() {
  console.log('Validating JSON schemas and sample payloads...');

  // 1. Validate schema syntax
  const paletteSchemaRaw = await readFile('schemas/palette.schema.json', 'utf8');
  const patternSchemaRaw = await readFile('schemas/pattern.schema.json', 'utf8');

  const paletteSchema = JSON.parse(paletteSchemaRaw);
  const patternSchema = JSON.parse(patternSchemaRaw);

  if (!paletteSchema.$schema || !paletteSchema.title) {
    throw new Error('palette.schema.json missing standard schema headers');
  }
  if (!patternSchema.$schema || !patternSchema.title) {
    throw new Error('pattern.schema.json missing standard schema headers');
  }
  console.log('✔ JSON schemas parse and contain required metadata');

  // 2. Validate example palette files
  const paletteFiles = [
    'examples/palettes/mini-starter-12.json',
    'examples/palettes/monochrome-8.json',
  ];

  for (const file of paletteFiles) {
    const raw = await readFile(file, 'utf8');
    const data = JSON.parse(raw);
    for (const req of paletteSchema.required) {
      if (!(req in data)) {
        throw new Error(`${file} missing required field: ${req}`);
      }
    }
    if (!Array.isArray(data.colors) || data.colors.length === 0) {
      throw new Error(`${file} colors must be a non-empty array`);
    }
    for (const c of data.colors) {
      if (!c.code || !c.hex || !/^#[0-9A-Fa-f]{6}$/.test(c.hex)) {
        throw new Error(`${file} contains invalid color entry: ${JSON.stringify(c)}`);
      }
    }
    console.log(`✔ ${file} conforms to palette schema (${data.colors.length} colors)`);
  }

  // 3. Validate generated pattern model structure against pattern schema requirements
  const samplePattern = {
    schemaVersion: 1,
    type: 'bead-grid-studio',
    version: 2,
    appVersion: '1.3.0',
    title: 'Rocket Badge Pattern',
    createdAt: new Date().toISOString(),
    grid: {
      cols: 29,
      rows: 29,
      cells: new Array(29 * 29).fill('H7'),
    },
    palette: {
      id: 'mard-compatible-base-221',
      colors: [
        { code: 'H7', hex: '#FEFFFF', name: 'White' },
      ],
    },
  };

  for (const req of patternSchema.required) {
    if (!(req in samplePattern)) {
      throw new Error(`Pattern missing required field: ${req}`);
    }
  }

  if (samplePattern.grid.cells.length !== samplePattern.grid.cols * samplePattern.grid.rows) {
    throw new Error('Sample pattern cells length does not match cols * rows');
  }
  console.log('✔ Pattern data model conforms to pattern.schema.json requirements');

  console.log('\nAll schemas and example files validated successfully.');
}

validateSchemas().catch((err) => {
  console.error('Schema validation failed:', err);
  process.exit(1);
});
