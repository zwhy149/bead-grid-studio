/**
 * Pure color math and perceptual color difference engine.
 * Supports sRGB, Linear sRGB, OKLab, CIELAB, and CIEDE2000 color distance.
 */

export const clamp01 = (value) => Math.max(0, Math.min(1, value));

export const srgbLinear = (value) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

export const linearSrgb = (value) => {
  value = clamp01(value);
  return 255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055);
};

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function rgbToHex(r, g, b) {
  const toHex = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToOklab(rgb) {
  const r = srgbLinear(rgb[0]);
  const g = srgbLinear(rgb[1]);
  const b = srgbLinear(rgb[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function labDistance(a, b) {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

export function rgbToCielab(rgb) {
  const r = srgbLinear(rgb[0]);
  const g = srgbLinear(rgb[1]);
  const b = srgbLinear(rgb[2]);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (value) => (value > 216 / 24389 ? Math.cbrt(value) : (24389 / 27 * value + 16) / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaE2000(first, second) {
  const [l1, a1, b1] = first;
  const [l2, a2, b2] = second;
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const cBar = (c1 + c2) / 2;
  const cBar7 = Math.pow(cBar, 7);
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + Math.pow(25, 7))));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const hue = (b, a) => {
    const value = Math.atan2(b, a) * deg;
    return value < 0 ? value + 360 : value;
  };
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);
  const dLp = l2 - l1;
  const dCp = c2p - c1p;
  let dhp = 0;
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(dhp * rad / 2);
  const lBar = (l1 + l2) / 2;
  const cBarp = (c1p + c2p) / 2;
  let hBar = h1p + h2p;
  if (c1p * c2p !== 0) {
    hBar = Math.abs(h1p - h2p) <= 180
      ? (h1p + h2p) / 2
      : (h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2);
  }
  const t = 1 - 0.17 * Math.cos((hBar - 30) * rad)
    + 0.24 * Math.cos(2 * hBar * rad)
    + 0.32 * Math.cos((3 * hBar + 6) * rad)
    - 0.20 * Math.cos((4 * hBar - 63) * rad);
  const deltaTheta = 30 * Math.exp(-1 * Math.pow((hBar - 275) / 25, 2));
  const cBarp7 = Math.pow(cBarp, 7);
  const rc = 2 * Math.sqrt(cBarp7 / (cBarp7 + Math.pow(25, 7)));
  const sl = 1 + 0.015 * Math.pow(lBar - 50, 2) / Math.sqrt(20 + Math.pow(lBar - 50, 2));
  const sc = 1 + 0.045 * cBarp;
  const sh = 1 + 0.015 * cBarp * t;
  const rt = -Math.sin(2 * deltaTheta * rad) * rc;
  const dl = dLp / sl;
  const dc = dCp / sc;
  const dh = dHp / sh;
  return Math.sqrt(Math.max(0, dl * dl + dc * dc + dh * dh + rt * dc * dh));
}

export function visiblyChromaticRgb(r, g, b) {
  const maximum = Math.max(r, g, b);
  const spread = maximum - Math.min(r, g, b);
  return spread >= 16 && spread / Math.max(1, maximum) >= 0.24;
}

export function preparePaletteColor(color) {
  const rgb = color.rgb || hexToRgb(color.hex);
  const lab = color.lab || rgbToOklab(rgb);
  const cieLab = color.cieLab || rgbToCielab(rgb);
  return {
    ...color,
    rgb,
    lab,
    cieLab,
  };
}
