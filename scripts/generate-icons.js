import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple CRC32 table implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(size) {
  const width = size;
  const height = size;

  // IHDR: width(4), height(4), bitDepth(1)=8, colorType(1)=6(RGBA), comp(0), filter(0), interlace(0)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Scanlines with filter byte 0
  const scanlineLen = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLen * height);

  const cx = width / 2;
  const cy = height / 2;
  const rCorner = width * 0.22; // rounded app icon background

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLen;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle test
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const halfW = width * 0.44;
      const halfH = height * 0.44;

      let inIcon = false;
      if (dx <= halfW - rCorner && dy <= halfH) inIcon = true;
      else if (dx <= halfW && dy <= halfH - rCorner) inIcon = true;
      else if (dx <= halfW && dy <= halfH) {
        const cornerDist = Math.hypot(dx - (halfW - rCorner), dy - (halfH - rCorner));
        if (cornerDist <= rCorner) inIcon = true;
      }

      if (!inIcon) {
        // Transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      // Base background: Indigo to Violet gradient (top-left #4f46e5 to bottom-right #7c3aed)
      const grad = (x + y) / (width + height);
      let r = Math.round(79 + (124 - 79) * grad);
      let g = Math.round(70 + (58 - 70) * grad);
      let b = Math.round(229 + (237 - 229) * grad);
      let a = 255;

      // Draw stylized Book + Audio Waves icon in center
      // Normalize nx, ny in [-1, 1] relative to center
      const nx = (x - cx) / (width * 0.35);
      const ny = (y - cy) / (height * 0.35);

      // Book pages: Left page and Right page
      const inLeftPage = nx >= -0.75 && nx <= -0.05 && ny >= -0.45 && ny <= 0.55;
      const inRightPage = nx >= 0.05 && nx <= 0.75 && ny >= -0.45 && ny <= 0.55;

      if (inLeftPage || inRightPage) {
        // White page
        r = 255;
        g = 255;
        b = 255;

        // Subtle lines on left page (representing text lines)
        if (inLeftPage) {
          const lineY = Math.abs((ny + 0.3) % 0.2);
          if (lineY < 0.04 && nx >= -0.65 && nx <= -0.15) {
            r = 199; g = 210; b = 254; // indigo-200
          }
        }

        // Audio waves on right page
        if (inRightPage) {
          // 3 sound arcs centered at nx: 0.15, ny: 0.05
          const arcDist = Math.hypot(nx - 0.15, ny - 0.05);
          if (
            (arcDist >= 0.18 && arcDist <= 0.24 && nx >= 0.15) ||
            (arcDist >= 0.34 && arcDist <= 0.40 && nx >= 0.15) ||
            (arcDist >= 0.50 && arcDist <= 0.56 && nx >= 0.15)
          ) {
            r = 99; g = 102; b = 241; // indigo-500
          }
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512));
console.log('Successfully generated icon-192.png and icon-512.png in', publicDir);
