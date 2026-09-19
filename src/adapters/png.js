import zlib from 'node:zlib';

/**
 * Lightweight, zero-dependency PNG decoder for Node.js environments (CLI, batch pipelines, scripts).
 * Decodes standard 8-bit RGB (type 2), RGBA (type 6), and Grayscale (type 0) PNG files into raw RGBA pixel buffers.
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

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const rowBytes = 1 + width * bytesPerPixel;
  const rawRgba = new Uint8ClampedArray(width * height * 4);

  const prevRow = new Uint8Array(width * bytesPerPixel);
  const currRow = new Uint8Array(width * bytesPerPixel);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    const filterType = decompressed[rowOffset];

    for (let i = 0; i < width * bytesPerPixel; i++) {
      const x = decompressed[rowOffset + 1 + i];
      const a = i >= bytesPerPixel ? currRow[i - bytesPerPixel] : 0;
      const b = prevRow[i];
      const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;

      let val = 0;
      if (filterType === 0) {
        val = x;
      } else if (filterType === 1) {
        val = (x + a) & 0xff;
      } else if (filterType === 2) {
        val = (x + b) & 0xff;
      } else if (filterType === 3) {
        val = (x + Math.floor((a + b) / 2)) & 0xff;
      } else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc) ? b : c;
        val = (x + pr) & 0xff;
      } else {
        val = x;
      }
      currRow[i] = val;
    }

    // Unpack row to RGBA output
    for (let x = 0; x < width; x++) {
      const outIdx = (y * width + x) * 4;
      const inIdx = x * bytesPerPixel;

      if (colorType === 6) {
        rawRgba[outIdx] = currRow[inIdx];
        rawRgba[outIdx + 1] = currRow[inIdx + 1];
        rawRgba[outIdx + 2] = currRow[inIdx + 2];
        rawRgba[outIdx + 3] = currRow[inIdx + 3];
      } else if (colorType === 2) {
        rawRgba[outIdx] = currRow[inIdx];
        rawRgba[outIdx + 1] = currRow[inIdx + 1];
        rawRgba[outIdx + 2] = currRow[inIdx + 2];
        rawRgba[outIdx + 3] = 255;
      } else if (colorType === 0) {
        const g = currRow[inIdx];
        rawRgba[outIdx] = g;
        rawRgba[outIdx + 1] = g;
        rawRgba[outIdx + 2] = g;
        rawRgba[outIdx + 3] = 255;
      }
    }

    prevRow.set(currRow);
  }

  return {
    data: rawRgba,
    width,
    height,
  };
}
