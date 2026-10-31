// SET Mode – Sammel-Aufnahmen in einzelne Übungs-Dateien schneiden: node tools/vo-split.js
// Eingabe:  audio/_raw/<batch>.mp3, audio/_raw/batches.json, audio/_raw/align.json (aus tools/vo-align.html)
// Ausgabe:  audio/<sprache>/<id>.mp3 + Einträge in audio/manifest.json (hash, marks = Satzanfänge in s)
// Geschnitten wird verlustfrei an MP3-Frame-Grenzen (keine Neukodierung), immer mitten in einer Pause.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RAW = path.join(ROOT, 'audio', '_raw');

const BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/* MP3-Frames (Layer III) mit Byte-Position und Startzeit auflisten */
function mp3Frames(buf) {
  let off = 0;
  if (buf.slice(0, 3).toString('latin1') === 'ID3') {
    const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    off = 10 + size + ((buf[5] & 0x10) ? 10 : 0);
  }
  const frames = [];
  let t = 0;
  while (off + 4 <= buf.length) {
    if (buf[off] !== 0xff || (buf[off + 1] & 0xe0) !== 0xe0) { off++; continue; }
    const ver = (buf[off + 1] >> 3) & 3, layer = (buf[off + 1] >> 1) & 3;
    const bri = (buf[off + 2] >> 4) & 15, sri = (buf[off + 2] >> 2) & 3, pad = (buf[off + 2] >> 1) & 1;
    if (layer !== 1 || bri === 0 || bri === 15 || sri === 3 || ver === 1) { off++; continue; }
    const br = (ver === 3 ? BR1 : BR2)[bri] * 1000, sr = SR[ver][sri], spf = ver === 3 ? 1152 : 576;
    const len = Math.floor((ver === 3 ? 144 : 72) * br / sr) + pad;
    if (off + len > buf.length) break;
    const head = buf.slice(off, Math.min(off + len, off + 200)).toString('latin1');
    const isInfo = frames.length === 0 && (head.includes('Xing') || head.includes('Info'));
    if (!isInfo) { frames.push({ off, len, t }); t += spf / sr; }
    off += len;
  }
  return { frames, duration: t };
}

function cut(buf, frames, start, end) {
  const sel = frames.filter(f => f.t >= start - 1e-6 && f.t < end);
  return { data: Buffer.concat(sel.map(f => buf.slice(f.off, f.off + f.len))), t0: sel[0].t, t1: sel[sel.length - 1].t };
}

const batches = JSON.parse(fs.readFileSync(path.join(RAW, 'batches.json'), 'utf8'));
const align = JSON.parse(fs.readFileSync(path.join(RAW, 'align.json'), 'utf8'));
const manifestPath = path.join(ROOT, 'audio', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.files = manifest.files || {};
manifest.model = batches.model;
manifest.voices = Object.fromEntries(Object.entries(batches.voices).map(([l, v]) => [l, v.name]));

let written = 0;
const problems = [];
for (const [key, res] of Object.entries(align)) {
  const b = batches.batches.find(x => x.key === key) || res.batch;
  if (!b) { problems.push(`${key}: unbekannter Batch`); continue; }
  if (!res.ok) { problems.push(`${key}: Ausrichtung nicht ok – ${res.issues.join('; ')}`); continue; }
  const file = path.join(RAW, `${key}.mp3`);
  if (!fs.existsSync(file)) { problems.push(`${key}: Datei fehlt`); continue; }
  const buf = fs.readFileSync(file);
  const { frames } = mp3Frames(buf);
  manifest.files[b.lang] = manifest.files[b.lang] || {};
  fs.mkdirSync(path.join(ROOT, 'audio', b.lang), { recursive: true });
  for (const ex of res.exercises) {
    const meta = b.exercises.find(e => e.id === ex.id);
    if (!meta) { problems.push(`${key}/${ex.id}: nicht im Batch`); continue; }
    const c = cut(buf, frames, ex.start, ex.end);
    const shift = c.t0 - ex.start;
    const rel = `audio/${b.lang}/${ex.id}.mp3`;
    fs.writeFileSync(path.join(ROOT, rel), c.data);
    manifest.files[b.lang][ex.id] = {
      hash: meta.hash, n: meta.lens.length, ext: 'mp3', file: rel,
      marks: ex.marks.map(m => +Math.max(0, m - shift).toFixed(3)),
      dur: +(ex.end - ex.start).toFixed(2), voice: batches.voices[b.lang].name, model: batches.model,
    };
    written++;
  }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
const total = Object.values(manifest.files).reduce((s, l) => s + Object.keys(l).length, 0);
console.log(`${written} Dateien geschrieben, Manifest: ${total} Einträge`);
if (problems.length) { console.log('Probleme:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
