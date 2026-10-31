// Erzeugt die App-Icons (PNG) ohne externe Abhängigkeiten: node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'icons');
const LIME = [200, 245, 66];
const BG = [12, 13, 10];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Abgerundetes Rechteck: Abstand <= 0 heißt "innen"
function rrect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - hw + r, qy = Math.abs(py - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

// SET-Mode-Zeichen: Schalter „an“ (Pille) mit dunklem Knopf rechts.
// 1 = Akzentfarbe, 2 = Hintergrundfarbe (Knopf), 0 = nichts
function shape(x, y, scale) {
  const u = (x - 0.5) / scale + 0.5, v = (y - 0.5) / scale + 0.5;
  if (Math.hypot(u - 0.64, v - 0.5) <= 0.135) return 2;
  return rrect(u, v, 0.5, 0.5, 0.33, 0.19, 0.19) <= 0 ? 1 : 0;
}

function draw(size, { maskable }) {
  const buf = Buffer.alloc(size * size * 4);
  const SS = 4;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let bgA = 0, fg = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = (x + (sx + 0.5) / SS) / size, py = (y + (sy + 0.5) / SS) / size;
      const inBg = maskable ? true : rrect(px, py, 0.5, 0.5, 0.5, 0.5, 0.22) <= 0;
      if (inBg) { bgA++; if (shape(px, py, maskable ? 0.72 : 0.9) === 1) fg++; }
    }
    const n = SS * SS, a = bgA / n, f = bgA ? fg / bgA : 0;
    const i = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(BG[c] * (1 - f) + LIME[c] * f);
    buf[i + 3] = Math.round(a * 255);
  }
  return png(size, buf);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon-192.png'), draw(192, { maskable: false }));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), draw(512, { maskable: false }));
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), draw(512, { maskable: true }));
console.log('Icons geschrieben nach', OUT);
