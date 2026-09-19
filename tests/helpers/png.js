import zlib from 'node:zlib';

/**
 * Lightweight, zero-dependency PNG decoder for Node.js test suites, benchmarks, and CLI.
 * Decodes standard 8-bit RGB and RGBA PNG files into raw RGBA image data buffers.
 *
 * @param {Buffer | Uint8Array} buffer - Raw PNG file buffer
 * @returns {{ data: Uint8ClampedArray, width: number, height: number }}
 */
export function decodePng(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) {
    throw new Error('Invalid PNG header signature');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idatChunks = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (bitDepth !== 8) {
        throw new Error(`Unsupported PNG bit depth: ${bitDepth}. Only 8-bit PNGs are supported.`);
      }
      if (colorType !== 2 && colorType !== 6 && colorType !== 0) {
        throw new Error(`Unsupported PNG color type: ${colorType}. Only Grayscale (0), RGB (2), and RGBA (6) are supported.`);
      }
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (!width || !height) {
    throw new Error('Missing or corrupt IHDR chunk in PNG');
  }

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = width * bpp;
  const rawRgba = new Uint8ClampedArray(width * height * 4);
  const prevRow = new Uint8Array(stride);
  const currentRow = new Uint8Array(stride);
  let srcPos = 0;

  for (let y = 0; y < height; y++) {
    const filterType = inflated[srcPos++];
    for (let i = 0; i < stride; i++) {
      const raw = inflated[srcPos++];
      const a = i >= bpp ? currentRow[i - bpp] : 0;
      const b = prevRow[i];
      const c = i >= bpp ? prevRow[i - bpp] : 0;
      let val = 0;

      if (filterType === 0) {
        val = raw;
      } else if (filterType === 1) {
        val = (raw + a) & 0xff;
      } else if (filterType === 2) {
        val = (raw + b) & 0xff;
      } else if (filterType === 3) {
        val = (raw + Math.floor((a + b) / 2)) & 0xff;
      } else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = (raw + pr) & 0xff;
      } else {
        throw new Error(`Unknown PNG filter type: ${filterType}`);
      }
      currentRow[i] = val;
    }

    const rowOffset = y * width * 4;
    if (colorType === 2) {
      for (let x = 0; x < width; x++) {
        const outIdx = rowOffset + x * 4;
        const inIdx = x * 3;
        rawRgba[outIdx] = currentRow[inIdx];
        rawRgba[outIdx + 1] = currentRow[inIdx + 1];
        rawRgba[outIdx + 2] = currentRow[inIdx + 2];
        rawRgba[outIdx + 3] = 255;
      }
    } else if (colorType === 6) {
      rawRgba.set(currentRow, rowOffset);
    } else if (colorType === 0) {
      for (let x = 0; x < width; x++) {
        const outIdx = rowOffset + x * 4;
        const gray = currentRow[x];
        rawRgba[outIdx] = gray;
        rawRgba[outIdx + 1] = gray;
        rawRgba[outIdx + 2] = gray;
        rawRgba[outIdx + 3] = 255;
      }
    }

    prevRow.set(currentRow);
  }

  return { data: rawRgba, width, height };
}
