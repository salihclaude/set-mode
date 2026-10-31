// SET Mode – Voiceover-Dateien erzeugen (Google Cloud Text-to-Speech)
//
//   GOOGLE_TTS_API_KEY=… node tools/generate-voiceover.js            alle Sprachen, alle Übungen
//   GOOGLE_TTS_API_KEY=… node tools/generate-voiceover.js --lang de  nur Deutsch
//   node tools/generate-voiceover.js --ids sq_bb,dl --lang en         einzelne Übungen
//   node tools/generate-voiceover.js --export                         nur Sprechtexte als Text exportieren
//                                                                      (z. B. für Sprecher:innen) → audio/scripts/<lang>.txt
//   --force   auch unveränderte Texte neu erzeugen
//   --mock    statt TTS kurze Testtöne (WAV) schreiben – nur zum lokalen Testen, nie veröffentlichen
//
// Pro Satz entsteht eine Datei audio/<lang>/<id>/<n>.mp3; audio/manifest.json hält Hash und Anzahl fest.
// Die App spielt Dateien nur ab, wenn der Hash zum aktuellen Text passt – sonst Gerätestimme.
// Stimmen lassen sich per Umgebungsvariable ändern: VOICE_DE, VOICE_EN, VOICE_ES, VOICE_TR.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(`--${name}`); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };

// Stimmen (ruhig, gut verständlich). Vor dem Einsatz in der Google-Cloud-Konsole anhören und ggf. ändern.
const VOICES = {
  de: { languageCode: 'de-DE', name: process.env.VOICE_DE || 'de-DE-Neural2-B' },
  en: { languageCode: 'en-GB', name: process.env.VOICE_EN || 'en-GB-Neural2-B' },
  es: { languageCode: 'es-ES', name: process.env.VOICE_ES || 'es-ES-Neural2-B' },
  tr: { languageCode: 'tr-TR', name: process.env.VOICE_TR || 'tr-TR-Wavenet-B' },
};
const AUDIO_CONFIG = { audioEncoding: 'MP3', speakingRate: 0.95, pitch: -1.0, effectsProfileId: ['handset-class-device'] };
const ENDPOINT = process.env.GOOGLE_TTS_ENDPOINT || 'https://texttospeech.googleapis.com/v1/text:synthesize';

// App-Code laden, damit Sprechtexte exakt wie in der App gebildet werden
const ctx = { console, Math, navigator: { languages: ['de'] }, document: { documentElement: {} } };
vm.createContext(ctx);
for (const f of ['i18n.js', 'lang/de.js', 'lang/en.js', 'lang/es.js', 'lang/tr.js', 'data.js', 'voice.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext('this.__V = VOICE; this.__EX = EX; this.__I = I18N;', ctx);
const { __V: VOICE, __EX: EX, __I: I18N } = ctx;

const langs = opt('lang') && opt('lang') !== true ? String(opt('lang')).split(',') : I18N.order;
const ids = opt('ids') && opt('ids') !== true ? String(opt('ids')).split(',') : EX.map(x => x.id);
const manifestPath = path.join(ROOT, 'audio', 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { version: 1, files: {} };
manifest.files = manifest.files || {};

function wavTone(seconds) {
  const rate = 22050, n = Math.floor(rate * seconds), buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 220 * i / rate) * 2500 * Math.min(1, i / 800, (n - i) / 800)), 44 + i * 2);
  return buf;
}

async function synthesize(text, lang) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text }, voice: VOICES[lang], audioConfig: AUDIO_CONFIG }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from((await res.json()).audioContent, 'base64');
}

(async () => {
  if (opt('export')) {
    const dir = path.join(ROOT, 'audio', 'scripts');
    fs.mkdirSync(dir, { recursive: true });
    for (const lang of langs) {
      const out = ids.map(id => { const sc = VOICE._.script(id, lang); return `## ${id}\n${sc.sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`; });
      fs.writeFileSync(path.join(dir, `${lang}.txt`), out.join('\n'));
      console.log(`Sprechtexte → audio/scripts/${lang}.txt (${ids.length} Übungen)`);
    }
    return;
  }
  const mock = !!opt('mock');
  if (!mock && !process.env.GOOGLE_TTS_API_KEY) {
    console.error('Fehlt: GOOGLE_TTS_API_KEY (Google Cloud → APIs → Text-to-Speech aktivieren → API-Schlüssel). Siehe VOICEOVER.md.');
    process.exit(1);
  }
  let made = 0, skipped = 0;
  for (const lang of langs) {
    manifest.files[lang] = manifest.files[lang] || {};
    for (const id of ids) {
      const sc = VOICE._.script(id, lang);
      if (!sc) { console.warn(`! ${lang}/${id}: kein vollständiger Text – übersprungen`); continue; }
      const ext = mock ? 'wav' : 'mp3';
      const cur = manifest.files[lang][id];
      if (!opt('force') && cur && cur.hash === sc.hash && cur.ext === ext) { skipped++; continue; }
      const dir = path.join(ROOT, 'audio', lang, id);
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      for (let i = 0; i < sc.sentences.length; i++) {
        const data = mock ? wavTone(0.4 + sc.sentences[i].length * 0.055) : await synthesize(sc.sentences[i], lang);
        fs.writeFileSync(path.join(dir, `${i + 1}.${ext}`), data);
      }
      manifest.files[lang][id] = { hash: sc.hash, n: sc.sentences.length, ext, voice: mock ? 'mock' : VOICES[lang].name, generated: new Date().toISOString().slice(0, 10) };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
      made++;
      console.log(`✓ ${lang}/${id} (${sc.sentences.length} Sätze)`);
    }
  }
  console.log(`Fertig: ${made} erzeugt, ${skipped} unverändert. Danach CACHE-Version in sw.js erhöhen und veröffentlichen.`);
})().catch(e => { console.error(e.message); process.exit(1); });
