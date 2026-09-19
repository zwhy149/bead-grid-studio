/**
 * TypeScript definitions for @bead-grid/core
 */

export interface PixelBuffer {
  data: Uint8Array | Uint8ClampedArray | number[];
  width: number;
  height: number;
}

export interface PaletteColor {
  code: string;
  name: string;
  hex: string;
  displayHex: string;
  index: number;
  series: string;
  isTransparent: boolean;
  rgb?: [number, number, number];
  lab?: [number, number, number];
  cieLab?: [number, number, number];
}

export interface PaletteProvider {
  id: string;
  name?: string;
  labelKey?: string;
  colors: readonly PaletteColor[];
  source: string;
  series: readonly string[];
  anchors: {
    transparent?: string | null;
    white?: string | null;
    black?: string | null;
  };
  autoMatchable: (color: PaletteColor) => boolean;
}

export interface GridDimensions {
  cols: number;
  rows: number;
  ratioLimited: boolean;
}

export interface BoardLayout {
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  blankLeft: number;
  blankRight: number;
  blankTop: number;
  blankBottom: number;
  aspectError: number;
}

export interface GeometryMetrics {
  sourceAspect: number;
  targetAspect: number;
  mismatch: number;
  letterboxFraction: number;
  cropFraction: number;
  contentCols: number;
  contentRows: number;
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface QuantizeOptions {
  data: Uint8Array | Uint8ClampedArray | number[];
  width: number;
  height: number;
  cols: number;
  rows: number;
  palette?: PaletteColor[];
  maxColors?: number;
  whiteMode?: 'auto' | 'keep';
  processMode?: 'cartoon' | 'detail' | 'document' | 'photo' | 'pixel';
  mergeStrength?: number;
  protectDark?: boolean;
}

export interface QuantizeDiagnostics {
  usedBeforeMerge: number;
  backgroundPixels: number;
  edgeArtifactPixels: number;
  darkThreshold: number;
  outlineCutoff: number;
  monochromeLineArt: boolean;
  smallLineArtRefinement: boolean;
  lineSourceComponents: number;
  lineSeparatedConflicts: number;
  lineUnresolvedConflicts: number;
  lineUnrepresentableComponents: number;
  lineForcedCandidatePlacements: number;
  mode: string;
}

export interface QuantizeResult {
  buffer: ArrayBuffer;
  cells: Int16Array;
  selected: number[];
  nonEmpty: number;
  diagnostics: QuantizeDiagnostics;
}

export interface ColorUsage {
  code: string;
  name: string;
  hex: string;
  count: number;
  share: number;
}

export interface PatternStatistics {
  totalBeads: number;
  emptyCells: number;
  usedColors: number;
  density: number;
  colors: ColorUsage[];
  beadCounts: Record<string, number>;
}

export interface PatternModel {
  schemaVersion: number;
  type: 'bead-grid-studio';
  version: number;
  appVersion: string;
  title: string;
  createdAt: string;
  grid: {
    cols: number;
    rows: number;
    cells: (string | null)[];
  };
  palette: {
    id: string;
    name: string;
    source: string;
  };
  statistics: PatternStatistics;
  rawIndices: Int16Array;
  metadata: Record<string, any>;
}

export interface GeneratePatternOptions {
  cols?: number;
  rows?: number;
  width?: number;
  height?: number;
  palette?: string | PaletteProvider;
  maxColors?: number;
  whiteMode?: 'auto' | 'keep';
  processMode?: 'cartoon' | 'detail' | 'document' | 'photo' | 'pixel';
  mergeStrength?: number;
  protectDark?: boolean;
  title?: string;
}

export function generateBeadPattern(
  imageData: PixelBuffer,
  options?: GeneratePatternOptions,
): Promise<PatternModel>;

export function quantizePixels(payload: QuantizeOptions): QuantizeResult;

export function analyzePattern(
  cells: (string | number | null)[],
  palette?: readonly PaletteColor[],
): PatternStatistics;

export function createPattern(options: {
  width: number;
  height: number;
  cells: (string | number | null)[];
  palette?: PaletteProvider | readonly PaletteColor[];
  title?: string;
  metadata?: Record<string, any>;
}): PatternModel;

export function serializePattern(pattern: PatternModel, space?: number): string;
export function parsePattern(input: string | object, options?: { paletteId?: string; lenient?: boolean }): PatternModel;
export const deserializePattern: typeof parsePattern;
export function validatePattern(input: any): { valid: boolean; errors: string[] };

export function gridForLongSide(width: number, height: number, longSide: number, minSide?: number, maxSide?: number): GridDimensions;
export function gridFromAspectAnchor(width: number, height: number, value: number, axis?: 'cols' | 'rows', minSide?: number, maxSide?: number): GridDimensions;
export function fitPatternInsideBoard(sourceWidth: number, sourceHeight: number, boardCols: number, boardRows: number): BoardLayout;
export function fitGeometryMetrics(sourceWidth: number, sourceHeight: number, cols: number, rows: number, fitMode?: 'contain' | 'cover'): GeometryMetrics;
export function normalizeCrop(crop?: Partial<CropRect>): CropRect;
export function cropSourceRect(width: number, height: number, crop: CropRect): { x: number; y: number; w: number; h: number };

export function deltaE2000(first: [number, number, number], second: [number, number, number]): number;
export function hexToRgb(hex: string): [number, number, number];
export function rgbToHex(r: number, g: number, b: number): string;
export function rgbToOklab(rgb: [number, number, number]): [number, number, number];
export function rgbToCielab(rgb: [number, number, number]): [number, number, number];

export function getPaletteProvider(id?: string): PaletteProvider;
export function registerPaletteProvider(provider: PaletteProvider): PaletteProvider;
export function createCustomPalette(config: {
  id: string;
  name: string;
  colors: Array<{ code?: string; id?: string; hex: string; name?: string; series?: string; isTransparent?: boolean }>;
  source?: string;
  anchors?: { transparent?: string; white?: string; black?: string };
}): PaletteProvider;

export const PALETTE: readonly PaletteColor[];
export const DEFAULT_PALETTE_PROVIDER_ID: string;
export const MARD_SERIES: Record<string, string>;
export const MARD_PALETTE_SOURCE: string;
