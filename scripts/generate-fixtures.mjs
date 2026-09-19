import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '../tests/fixtures');

// CRC32 implementation for standard PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createPngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function encodeRgbaToPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IDAT: scanlines with filter byte 0
  const stride = width * 4;
  const scanlines = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    scanlines[rowOffset] = 0; // Filter 0 (None)
    rgbaBuffer.copy(scanlines, rowOffset + 1, y * stride, (y + 1) * stride);
  }

  const deflated = zlib.deflateSync(scanlines);
  const idatChunk = createPngChunk('IDAT', deflated);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate the 8 standard regression fixtures
const fixtures = [
  // 1. Small size (16x16 icon)
  {
    name: 'small-icon.png',
    width: 16,
    height: 16,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4, 255);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const isCross = (x === 8 || y === 8);
          buf[idx] = isCross ? 220 : 40;
          buf[idx + 1] = isCross ? 40 : 180;
          buf[idx + 2] = isCross ? 40 : 220;
          buf[idx + 3] = 255;
        }
      }
      return buf;
    },
  },
  // 2. High saturation (32x32 primary hues)
  {
    name: 'high-saturation.png',
    width: 32,
    height: 32,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const left = x < w / 2;
          const top = y < h / 2;
          if (top && left) { buf[idx] = 255; buf[idx + 1] = 0; buf[idx + 2] = 0; } // Red
          else if (top && !left) { buf[idx] = 0; buf[idx + 1] = 255; buf[idx + 2] = 0; } // Green
          else if (!top && left) { buf[idx] = 0; buf[idx + 1] = 0; buf[idx + 2] = 255; } // Blue
          else { buf[idx] = 255; buf[idx + 1] = 255; buf[idx + 2] = 0; } // Yellow
          buf[idx + 3] = 255;
        }
      }
      return buf;
    },
  },
  // 3. Low color (32x32 muted 3-tone retro sprite)
  {
    name: 'low-color-mono.png',
    width: 32,
    height: 32,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4);
      const shades = [60, 140, 210];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const tone = shades[(Math.floor(x / 10) + Math.floor(y / 10)) % 3];
          buf[idx] = tone;
          buf[idx + 1] = tone;
          buf[idx + 2] = tone;
          buf[idx + 3] = 255;
        }
      }
      return buf;
    },
  },
  // 4. Transparent PNG (32x32 circular badge with alpha)
  {
    name: 'transparent-badge.png',
    width: 32,
    height: 32,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4, 0);
      const cx = 16;
      const cy = 16;
      const radius = 12;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const dist = Math.hypot(x - cx, y - cy);
          if (dist <= radius) {
            buf[idx] = 250;
            buf[idx + 1] = 100;
            buf[idx + 2] = 50;
            buf[idx + 3] = 255; // Opaque badge
          }
        }
      }
      return buf;
    },
  },
  // 5. Extreme aspect ratio (64x8 ribbon, 8:1)
  {
    name: 'extreme-aspect.png',
    width: 64,
    height: 8,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          buf[idx] = Math.round((x / w) * 255);
          buf[idx + 1] = 120;
          buf[idx + 2] = 200;
          buf[idx + 3] = 255;
        }
      }
      return buf;
    },
  },
  // 6. Monochrome solid (24x24 single uniform color)
  {
    name: 'monochrome-solid.png',
    width: 24,
    height: 24,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4);
      for (let i = 0; i < w * h; i++) {
        const idx = i * 4;
        buf[idx] = 50;
        buf[idx + 1] = 80;
        buf[idx + 2] = 160;
        buf[idx + 3] = 255;
      }
      return buf;
    },
  },
  // 7. Gradient smooth (32x32 diagonal gradient)
  {
    name: 'gradient-smooth.png',
    width: 32,
    height: 32,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          buf[idx] = Math.round((x / w) * 255);
          buf[idx + 1] = Math.round((y / h) * 255);
          buf[idx + 2] = Math.round(((x + y) / (w + h)) * 255);
          buf[idx + 3] = 255;
        }
      }
      return buf;
    },
  },
  // 8. High contrast edge (32x32 sharp geometric edge)
  {
    name: 'high-contrast-edge.png',
    width: 32,
    height: 32,
    generator: (w, h) => {
      const buf = Buffer.alloc(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const isDark = (x + y < 32);
          const val = isDark ? 0 : 255;
          buf[idx] = val;
          buf[idx + 1] = val;
          buf[idx + 2] = val;
          buf[idx + 3] = 255;
        }
      }
      return buf;
    },
  },
];

fs.mkdirSync(fixturesDir, { recursive: true });

for (const fixture of fixtures) {
  const rgba = fixture.generator(fixture.width, fixture.height);
  const pngBuf = encodeRgbaToPng(fixture.width, fixture.height, rgba);
  const outPath = path.join(fixturesDir, fixture.name);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Generated fixture: ${fixture.name} (${fixture.width}x${fixture.height}, ${pngBuf.length} bytes)`);
}
