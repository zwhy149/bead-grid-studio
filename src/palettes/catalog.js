import { MARD_PALETTE_SOURCE, MARD_SERIES, PALETTE } from './mard221.js';

/**
 * Versioned palette-provider registry.
 *
 * The UI and conversion engine consume this contract instead of treating a
 * manufacturer name as an application-wide identity. Future providers must
 * bring their own documented, licensed color data; this registry must never
 * imply a brand relationship or invent cross-brand code mappings.
 */
export const DEFAULT_PALETTE_PROVIDER_ID = 'mard-compatible-base-221';

const mardCompatibleBase221 = Object.freeze({
  id: DEFAULT_PALETTE_PROVIDER_ID,
  labelKey: 'palette.provider',
  colors: PALETTE,
  source: MARD_PALETTE_SOURCE,
  series: Object.freeze(Object.keys(MARD_SERIES)),
  anchors: Object.freeze({ transparent: 'H1', white: 'H2', black: 'H7' }),
  autoMatchable: (color) => !color.isTransparent,
});

export const PALETTE_PROVIDERS = Object.freeze({
  [mardCompatibleBase221.id]: mardCompatibleBase221,
});

export function getPaletteProvider(id = DEFAULT_PALETTE_PROVIDER_ID) {
  return PALETTE_PROVIDERS[id] || mardCompatibleBase221;
}
