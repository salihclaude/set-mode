// SET Mode – Sammel-Texte für ElevenLabs bauen: node tools/vo-batches.js [--max 2400] [--skip sq_bb]
// Mehrere Übungen pro Aufnahme (gleiche Kosten pro Zeichen, viel weniger Aufrufe).
// Zwischen Sätzen [pause], zwischen Übungen [long pause] – daran schneidet tools/vo-split.js später.
// Ausgabe: audio/_raw/batches.json (+ Textdateien pro Batch zum Kopieren)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i < 0 ? d : args[i + 1]; };
const MAX = +opt('max', 2400);
const SKIP = String(opt('skip', '')).split(',').filter(Boolean);

const ctx = { console, Math, navigator: { languages: ['de'] }, document: { documentElement: {} } };
vm.createContext(ctx);
for (const f of ['i18n.js', 'lang/de.js', 'lang/en.js', 'lang/es.js', 'lang/tr.js', 'data.js', 'voice.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext('this.__V = VOICE; this.__EX = EX; this.__I = I18N;', ctx);
const { __V: VOICE, __EX: EX, __I: I18N } = ctx;

// Stimmen je Sprache (ElevenLabs-Bibliothek, Modell eleven_v4)
const VOICES = {
  de: { id: 'yamcvgNdKmgh0Ron7Bsz', name: 'Hans – Calm German Explainer' },
  en: { id: 'tJG2ZSOV1NzFs52wkbUv', name: 'Justin Harris – Elite Protocols' },
  es: { id: 'i5wTsPXr1Iu8jjeVDHfK', name: 'Leandro – Training, Narrative' },
  tr: { id: 'y2ckQ27j8N0l1u59Q6eV', name: 'Enes – Conversational & Friendly' },
};

const out = { model: 'eleven_v4', voices: VOICES, batches: [] };
const dir = path.join(ROOT, 'audio', '_raw');
fs.mkdirSync(dir, { recursive: true });
for (const lang of I18N.order) {
  let cur = null, n = 0;
  const flush = () => { if (cur) { cur.text = '[warmly] ' + cur.parts.join(' [long pause] '); delete cur.parts; out.batches.push(cur); } cur = null; };
  for (const x of EX) {
    const sc = VOICE._.script(x.id, lang);
    // übersprungene Übungen wurden einzeln aufgenommen (audio/_raw/<sprache>_<id>.mp3)
    if (SKIP.includes(x.id)) {
      out.batches.push({ key: `${lang}_${x.id}`, lang, voice: VOICES[lang].id, single: true,
        exercises: [{ id: x.id, hash: sc.hash, lens: sc.sentences.map(s => s.length) }] });
      continue;
    }
    const part = sc.sentences.join(' [pause] ');
    if (cur && cur.chars + part.length + 14 > MAX) flush();
    if (!cur) cur = { key: `${lang}_b${++n}`, lang, voice: VOICES[lang].id, exercises: [], parts: [], chars: 10 };
    cur.exercises.push({ id: x.id, hash: sc.hash, lens: sc.sentences.map(s => s.length) });
    cur.parts.push(part);
    cur.chars += part.length + 14;
  }
  flush();
}
fs.writeFileSync(path.join(dir, 'batches.json'), JSON.stringify(out, null, 1));
for (const b of out.batches) if (b.text) fs.writeFileSync(path.join(dir, `${b.key}.txt`), b.text);
console.log(out.batches.map(b => `${b.key}: ${b.exercises.length} Übungen, ${b.single ? 'Einzelaufnahme' : b.text.length + ' Zeichen'}`).join('\n'));
console.log(`\n${out.batches.length} Batches, ${out.batches.reduce((s, b) => s + (b.text || '').length, 0)} Zeichen gesamt`);
