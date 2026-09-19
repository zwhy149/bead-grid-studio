/**
 * Test helper re-exporting the production PNG adapter.
 * Ensures tests consume production adapters rather than production code consuming test helpers.
 */
export { decodePng } from '../../src/adapters/png.js';
