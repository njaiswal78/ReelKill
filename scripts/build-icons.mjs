// Generates 16/48/128 PNG icons for the Chrome extension at build time.
// Uses only Node built-ins (zlib + Buffer) so we avoid a heavy
// native image dependency. The icons render a stylized clock/shield
// matching the brand: rounded square + clock; indigo when protection can be on,
// slate when idle (paired with toolbar icon swap in background.ts).

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'dist-extension', 'icons');

const SIZES = [16, 48, 128];

// Brand palettes: active toolbar icon (indigo) vs muted (protection off / idle).
const BG_GRADIENT_ACTIVE = [
  [99, 102, 241], // top-left  (#6366f1)
  [67, 56, 202], // bottom-right (#4338ca)
];
const BG_GRADIENT_OFF = [
  [148, 163, 184], // top-left (#94a3b8 slate-400)
  [100, 116, 139], // bottom-right (#64748b slate-500)
];
const WHITE = [255, 255, 255];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function gradientPixel(x, y, size, gradient) {
  const t = (x + y) / (2 * (size - 1));
  return [
    lerp(gradient[0][0], gradient[1][0], t),
    lerp(gradient[0][1], gradient[1][1], t),
    lerp(gradient[0][2], gradient[1][2], t),
  ];
}

// Simple antialiased rounded-square mask: returns 0..1 alpha.
function roundedMask(x, y, size, radius) {
  const half = (size - 1) / 2;
  const dx = Math.abs(x - half) - (half - radius);
  const dy = Math.abs(y - half) - (half - radius);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  const dist = Math.sqrt(ax * ax + ay * ay);
  // 1px feathering around the edge.
  return clamp(1 - (dist - radius + 0.5), 0, 1);
}

function ringMask(x, y, cx, cy, radius, thickness) {
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.sqrt(dx * dx + dy * dy);
  const inner = radius - thickness / 2;
  const outer = radius + thickness / 2;
  if (d < inner - 0.5 || d > outer + 0.5) return 0;
  return clamp(Math.min(d - (inner - 0.5), (outer + 0.5) - d), 0, 1);
}

function lineMask(x, y, x1, y1, x2, y2, thickness) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  const t = clamp(((x - x1) * dx + (y - y1) * dy) / lenSq, 0, 1);
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const d = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
  return clamp(thickness / 2 + 0.5 - d, 0, 1);
}

function dotMask(x, y, cx, cy, radius) {
  const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
  return clamp(radius + 0.5 - d, 0, 1);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function blend(base, overlay, alpha) {
  return [
    lerp(base[0], overlay[0], alpha),
    lerp(base[1], overlay[1], alpha),
    lerp(base[2], overlay[2], alpha),
  ];
}

function renderIcon(size, gradient) {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const cornerRadius = Math.max(2, Math.round(size * 0.22));
  const ringRadius = size * 0.3;
  const ringThickness = Math.max(1, size * 0.05);
  const handLen = ringRadius - ringThickness;
  const handThickness = Math.max(1, size * 0.045);

  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const bgAlpha = roundedMask(x, y, size, cornerRadius);
      if (bgAlpha <= 0) {
        const idx = (y * size + x) * 4;
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }
      let color = gradientPixel(x, y, size, gradient);

      const ring = ringMask(x, y, cx, cy, ringRadius, ringThickness);
      const handVertical = lineMask(x, y, cx, cy, cx, cy - handLen + 1, handThickness);
      const handHoriz = lineMask(x, y, cx, cy, cx + handLen * 0.7, cy, handThickness);
      const center = dotMask(x, y, cx, cy, Math.max(1, size * 0.04));
      const fg = Math.max(ring, handVertical, handHoriz, center);
      if (fg > 0) {
        color = blend(color, WHITE, fg);
      }

      const idx = (y * size + x) * 4;
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = Math.round(bgAlpha * 255);
    }
  }
  return encodePng(pixels, size, size);
}

function crc32(buf) {
  let c;
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(rgba, width, height) {
  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    scanlines[y * (stride + 1)] = 0;
    rgba.copy(scanlines, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(scanlines, { level: 9 });

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  for (const { suffix, gradient } of [
    { suffix: '', gradient: BG_GRADIENT_ACTIVE },
    { suffix: '-off', gradient: BG_GRADIENT_OFF },
  ]) {
    const png = renderIcon(size, gradient);
    const file = resolve(OUT_DIR, `icon${size}${suffix}.png`);
    writeFileSync(file, png);
    console.log(`  ✓ ${file} (${size}x${size}, ${png.length} bytes)`);
  }
}
