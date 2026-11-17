import {
  deltaE2000,
  hexToRgb,
  rgbToCielab,
  rgbToOklab,
} from './color.js';

export const MARD_PALETTE_SOURCE =
  'maxcleme/beadcolors@94b99999652866f1a1879d6369fe735f811949e5';

export const MARD_SERIES = Object.freeze({
  A: '黄橙系',
  B: '绿色系',
  C: '蓝青系',
  D: '蓝紫系',
  E: '粉玫系',
  F: '红色系',
  G: '棕肤系',
  H: '黑白灰系',
  M: '大地系',
});

export const MARD_221_DATA = `
  A1:#FAF4C8 A2:#FFFFD5 A3:#FEFF8B A4:#FBED56 A5:#F4D738 A6:#FEAC4C A7:#FE8B4C A8:#FFDA45 A9:#FF995B A10:#F77C31 A11:#FFDD99 A12:#FE9F72 A13:#FFC365 A14:#FD543D A15:#FFF365 A16:#FFFF9F A17:#FFE36E A18:#FEBE7D A19:#FD7C72 A20:#FFD568 A21:#FFE395 A22:#F4F57D A23:#E6C9B7 A24:#F7F8A2 A25:#FFD67D A26:#FFC830
  B1:#E6EE31 B2:#63F347 B3:#9EF780 B4:#5DE035 B5:#35E352 B6:#65E2A6 B7:#3DAF80 B8:#1C9C4F B9:#27523A B10:#95D3C2 B11:#5D722A B12:#166F41 B13:#CAEB7B B14:#ADE946 B15:#2E5132 B16:#C5ED9C B17:#9BB13A B18:#E6EE49 B19:#24B88C B20:#C2F0CC B21:#156A6B B22:#0B3C43 B23:#303A21 B24:#EEFCA5 B25:#4E846D B26:#8D7A35 B27:#CCE1AF B28:#9EE5B9 B29:#C5E254 B30:#E2FCB1 B31:#B0E792 B32:#9CAB5A
  C1:#E8FFE7 C2:#A9F9FC C3:#A0E2FB C4:#41CCFF C5:#01ACEB C6:#50AAF0 C7:#3677D2 C8:#0F54C0 C9:#324BCA C10:#3EBCE2 C11:#28DDDE C12:#1C334D C13:#CDE8FF C14:#D5FDFF C15:#22C4C6 C16:#1557A8 C17:#04D1F6 C18:#1D3344 C19:#1887A2 C20:#176DAF C21:#BEDDFF C22:#67B4BE C23:#C8E2FF C24:#7CC4FF C25:#A9E5E5 C26:#3CAED8 C27:#D3DFFA C28:#BBCFED C29:#34488E
  D1:#AEB4F2 D2:#858EDD D3:#2F54AF D4:#182A84 D5:#B843C5 D6:#AC7BDE D7:#8854B3 D8:#E2D3FF D9:#D5B9F8 D10:#361851 D11:#B9BAE1 D12:#DE9AD4 D13:#B90095 D14:#8B279B D15:#2F1F90 D16:#E3E1EE D17:#C4D4F6 D18:#A45EC7 D19:#D8C3D7 D20:#9C32B2 D21:#9A009B D22:#333A95 D23:#EBDAFC D24:#7786E5 D25:#494FC7 D26:#DFC2F8
  E1:#FDD3CC E2:#FEC0DF E3:#FFB7E7 E4:#E8649E E5:#F551A2 E6:#F13D74 E7:#C63478 E8:#FFDBE9 E9:#E970CC E10:#D33793 E11:#FCDDD2 E12:#F78FC3 E13:#B5006D E14:#FFD1BA E15:#F8C7C9 E16:#FFF3EB E17:#FFE2EA E18:#FFC7DB E19:#FEBAD5 E20:#D8C7D1 E21:#BD9DA1 E22:#B785A1 E23:#937A8D E24:#E1BCE8
  F1:#FD957B F2:#FC3D46 F3:#F74941 F4:#FC283C F5:#E7002F F6:#943630 F7:#971937 F8:#BC0028 F9:#E2677A F10:#8A4526 F11:#5A2121 F12:#FD4E6A F13:#F35744 F14:#FFA9AD F15:#D30022 F16:#FEC2A6 F17:#E69C79 F18:#D37C46 F19:#C1444A F20:#CD9391 F21:#F7B4C6 F22:#FDC0D0 F23:#F67E66 F24:#E698AA F25:#E54B4F
  G1:#FFE2CE G2:#FFC4AA G3:#F4C3A5 G4:#E1B383 G5:#EDB045 G6:#E99C17 G7:#9D5B3E G8:#753832 G9:#E6B483 G10:#D98C39 G11:#E0C593 G12:#FFC890 G13:#B7714A G14:#8D614C G15:#FCF9E0 G16:#F2D9BA G17:#78524B G18:#FFE4CC G19:#E07935 G20:#A94023 G21:#B88558
  H1:#FDFBFF H2:#FEFFFF H3:#B6B1BA H4:#89858C H5:#48464E H6:#2F2B2F H7:#000000 H8:#E7D6DB H9:#EDEDED H10:#EEE9EA H11:#CECDD5 H12:#FFF5ED H13:#F5ECD2 H14:#CFD7D3 H15:#98A6A8 H16:#1D1414 H17:#F1EDED H18:#FFFDF0 H19:#F6EFE2 H20:#949FA3 H21:#FFFBE1 H22:#CACAD4 H23:#9A9D94
  M1:#BCC6B8 M2:#8AA386 M3:#697D80 M4:#E3D2BC M5:#D0CCAA M6:#B0A782 M7:#B4A497 M8:#B38281 M9:#A58767 M10:#C5B2BC M11:#9F7594 M12:#644749 M13:#D19066 M14:#C77362 M15:#757D78
`;

export const PALETTE = Object.freeze(
  MARD_221_DATA.trim()
    .split(/\s+/)
    .map((token, index) => {
      const [code, hex] = token.split(':');
      const series = code[0];
      const isTransparent = code === 'H1';
      const name = isTransparent
        ? '透明'
        : code === 'H2'
          ? '白色'
          : code === 'H7'
            ? '黑色'
            : MARD_SERIES[series] || series;
      const rgb = hexToRgb(hex);
      const lab = rgbToOklab(rgb);
      const cieLab = rgbToCielab(rgb);
      return Object.freeze({
        code,
        name,
        hex,
        displayHex: code === 'H2' ? '#FFFFFF' : hex,
        index,
        series,
        isTransparent,
        rgb,
        lab,
        cieLab,
      });
    }),
);

export const LEGACY_64_DATA = `
  N01:#FFFFFF N02:#FFF1CC N03:#DCC49A N04:#B8875E N05:#75503B N06:#3A2924 N07:#D8D9D6 N08:#969993 N09:#5E625F N10:#2F3332 N11:#141716
  P01:#FFF8B3 P02:#FFF066 P03:#FFDE38 P04:#FF9900 P05:#FF7700 P06:#F05423 P07:#C2272D P08:#8A1C14 P09:#F24974 P10:#D62262 P11:#9E1B4F
  P12:#66123A P13:#FFA8CC P14:#FF70A6 P15:#D98CB3 P16:#9E668A P17:#FFD1DC P18:#F0A3B5 P19:#8F596B P20:#D6B8FF P21:#A870FF P22:#7A2EFF
  P23:#4C1499 P24:#290A54 P25:#7F6B99 P26:#382E47 P27:#BBEBFF P28:#70D1FF P29:#1FA8FF P30:#0066CC P31:#003D7A P32:#002244 P33:#598099
  P34:#263B47 P35:#C7F5D9 P36:#70E0A6 P37:#14B866 P38:#0B7A40 P39:#054724 P40:#4F8069 P41:#1C3328 P42:#E8F5A3 P43:#C4E642 P44:#99CC00
  P45:#688A00 P46:#425700 P47:#5C663D P48:#7D804D P49:#FFE0B3 P50:#FFC285 P51:#D48A54 P52:#A35C29 P53:#FFCCAA
`;

export const LEGACY_64_HEX = Object.freeze(
  new Map(
    LEGACY_64_DATA.trim()
      .split(/\s+/)
      .map((token) => token.split(':')),
  ),
);

export const LEGACY_TO_MARD = Object.freeze(
  new Map(
    [...LEGACY_64_HEX].map(([code, hex]) => {
      const target = rgbToCielab(hexToRgb(hex));
      let best = PALETTE.findIndex((color) => color.code === 'H2');
      let distance = Infinity;
      PALETTE.forEach((color) => {
        if (color.isTransparent) return;
        const value = deltaE2000(target, color.cieLab);
        if (value < distance) {
          distance = value;
          best = color.index;
        }
      });
      return [code, best];
    }),
  ),
);

export const DEFAULT_PALETTE_PROVIDER_ID = 'mard-compatible-base-221';

const mardCompatibleBase221 = Object.freeze({
  id: DEFAULT_PALETTE_PROVIDER_ID,
  labelKey: 'palette.provider',
  name: 'MARD-Compatible Base 221',
  colors: PALETTE,
  source: MARD_PALETTE_SOURCE,
  series: Object.freeze(Object.keys(MARD_SERIES)),
  anchors: Object.freeze({ transparent: 'H1', white: 'H2', black: 'H7' }),
  autoMatchable: (color) => !color.isTransparent,
});

export const PALETTE_PROVIDERS = {
  [mardCompatibleBase221.id]: mardCompatibleBase221,
};

export function getPaletteProvider(id = DEFAULT_PALETTE_PROVIDER_ID) {
  return PALETTE_PROVIDERS[id] || mardCompatibleBase221;
}

export function registerPaletteProvider(provider) {
  if (!provider?.id || !Array.isArray(provider?.colors)) {
    throw new Error('Invalid palette provider shape');
  }
  PALETTE_PROVIDERS[provider.id] = Object.freeze({ ...provider });
  return PALETTE_PROVIDERS[provider.id];
}

/**
 * Creates and validates a custom palette configuration.
 * Automatically computes RGB, OKLab, and CIELAB color spaces for each entry.
 */
export function createCustomPalette({ id, name, colors, source = 'custom', anchors = {} }) {
  if (!id || typeof id !== 'string') throw new Error('Palette id is required');
  if (!name || typeof name !== 'string') throw new Error('Palette name is required');
  if (!Array.isArray(colors) || colors.length === 0) throw new Error('Palette colors array cannot be empty');

  const normalizedColors = colors.map((entry, index) => {
    const code = String(entry.code || entry.id || index + 1);
    const hex = String(entry.hex).toUpperCase();
    if (!/^#[0-9A-F]{6}$/i.test(hex)) {
      throw new Error(`Invalid hex color "${hex}" for code ${code}`);
    }
    const isTransparent = Boolean(entry.isTransparent);
    const rgb = hexToRgb(hex);
    const lab = rgbToOklab(rgb);
    const cieLab = rgbToCielab(rgb);
    return Object.freeze({
      code,
      name: entry.name || code,
      hex,
      displayHex: entry.displayHex || hex,
      index,
      series: entry.series || code[0] || 'A',
      isTransparent,
      rgb,
      lab,
      cieLab,
    });
  });

  const provider = Object.freeze({
    id,
    name,
    colors: Object.freeze(normalizedColors),
    source,
    series: Object.freeze([...new Set(normalizedColors.map((c) => c.series))]),
    anchors: Object.freeze({
      transparent: anchors.transparent || normalizedColors.find((c) => c.isTransparent)?.code || null,
      white: anchors.white || normalizedColors.find((c) => c.code === 'H2' || c.hex === '#FFFFFF')?.code || null,
      black: anchors.black || normalizedColors.find((c) => c.code === 'H7' || c.hex === '#000000')?.code || null,
    }),
    autoMatchable: (color) => !color.isTransparent,
  });

  return provider;
}
