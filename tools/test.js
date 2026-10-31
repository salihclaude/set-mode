// SET Mode – Tests ohne Abhängigkeiten: node tools/test.js
// Lädt die App-Module in einer Node-VM und prüft Sprachen, Plan-Generator,
// Animationen, Voiceover-Zuordnung und das Theme (CSS).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const ctx = { console, Math, navigator: { languages: ['de'] }, document: { documentElement: {} } };
vm.createContext(ctx);
for (const f of ['i18n.js', 'lang/de.js', 'lang/en.js', 'lang/es.js', 'lang/tr.js', 'data.js', 'anim.js', 'voice.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
vm.runInContext('Object.assign(this, { __I: I18N, __EX: EX, __A: ANIM, __V: VOICE, __B: buildPlan, __S: splitOptions });', ctx);
const { __I: I18N, __EX: EX, __A: ANIM, __V: VOICE, __B: buildPlan, __S: splitOptions } = ctx;
const V = VOICE._;

console.log('\nSprachen (bestehende Prüfung)');
test('check-i18n: alle Sprachen vollständig', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'check-i18n.js')], { stdio: 'pipe' });
});

console.log('\nPlan-Generator');
test('alle Antwort-Kombinationen ergeben gültige Pläne', () => {
  let n = 0;
  for (const goal of ['fett', 'muskel', 'kraft', 'fitness']) for (const days of [2, 3, 4, 5, 6]) for (const split of splitOptions(days))
    for (const equip of ['gym', 'machines', 'home']) for (const limits of [[], ['ruecken', 'schulter', 'knie']]) for (const exp of ['beginner', 'adv']) {
      const plan = buildPlan({ goal, days, split, equip, limits, exp, minutes: 60, cardio: true, focus: ['arme'], sex: 'f', bw: 60 });
      for (const d of plan) {
        const s = d.exercises.filter(e => e.kind !== 'cardio');
        assert(s.length >= 3, `${goal}/${days}/${split}/${equip}: zu wenige Übungen`);
        assert(new Set(s.map(e => e.ref)).size === s.length, 'doppelte Übung an einem Tag');
        assert(d.exercises.every(e => e.ref), 'Übung ohne ID');
      }
      n++;
    }
  assert(n > 100, 'zu wenige Kombinationen geprüft');
});

console.log('\nAnimationen');
test('jede Übung hat eine Animation', () => {
  const missing = EX.filter(x => !ANIM.has(x.id)).map(x => x.id);
  assert(!missing.length, 'fehlt: ' + missing.join(', '));
});
test('alle Frames rendern ohne NaN (p = 0 … 1)', () => {
  for (const x of EX) for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const svg = ANIM.frame(x.id, p);
    assert(svg.startsWith('<svg') && !/NaN|undefined/.test(svg), `${x.id} @ ${p}`);
  }
});
test('Animationsfarben folgen dem Theme (CSS-Variablen statt fester Farbe)', () => {
  const svg = ANIM.frame('sq_bb', 0.5);
  assert(svg.includes('var(--ac)') && !svg.includes('#c8f542'), 'feste Akzentfarbe gefunden');
});

console.log('\nVoiceover');
test('jede Übung hat in jeder Sprache einen Sprechtext', () => {
  for (const lang of I18N.order) for (const x of EX) {
    const sc = V.script(x.id, lang);
    assert(sc && sc.sentences.length >= 4 && sc.execCount >= 1, `${lang}/${x.id}`);
  }
});
test('Sprechtext ist in der gewählten Sprache (kein Rückfall auf Deutsch)', () => {
  for (const lang of ['en', 'es', 'tr']) for (const x of EX) {
    const sc = V.script(x.id, lang), de = V.script(x.id, 'de');
    assert(sc.sentences[0] !== de.sentences[0] || I18N.dicts[lang].ex[x.id].name === I18N.dicts.de.ex[x.id].name, `${lang}/${x.id} Name deutsch`);
    assert(sc.sentences.slice(1).join(' ') !== de.sentences.slice(1).join(' '), `${lang}/${x.id} Text deutsch`);
    assert(sc.sentences.at(-2).startsWith(I18N.dicts[lang].voice.tip), `${lang}/${x.id} Einleitung`);
  }
});
test('fehlender Text in einer Sprache → kein Sprechtext (statt fremder Sprache)', () => {
  const saved = I18N.dicts.en.ex.sq_bb;
  delete I18N.dicts.en.ex.sq_bb;
  try { assert(V.script('sq_bb', 'en') === null, 'sollte null sein'); } finally { I18N.dicts.en.ex.sq_bb = saved; }
});
test('Abkürzungen werden aussprechbar gemacht', () => {
  assert(V.speakable('8–10 Wdh. ca. 30 Sek.', 'de') === '8 bis 10 Wiederholungen circa 30 Sekunden', V.speakable('8–10 Wdh. ca. 30 Sek.', 'de'));
  assert(V.speakable('Hold 1 s at the top', 'en') === 'Hold 1 seconds at the top', 'en');
  assert(V.speakable('Eğim %10–12', 'tr') === 'Eğim yüzde 10 ila 12', V.speakable('Eğim %10–12', 'tr'));
  assert(V.speakable('10–12 rep.', 'es') === '10 a 12 repeticiones', 'es');
});
test('Sätze werden korrekt getrennt', () => {
  const s = V.splitSentences('Erster Satz. Zweiter Satz! Dritter?');
  assert(s.length === 3 && s[1] === 'Zweiter Satz!', JSON.stringify(s));
});
test('Stimmenwahl nimmt nie eine fremde Sprache', () => {
  const voices = [{ name: 'Microsoft Katja', lang: 'de-DE' }, { name: 'Google UK English Male', lang: 'en-GB' }, { name: 'Google español', lang: 'es-ES' }];
  assert(V.pickVoice(voices, 'tr', 'tr-TR') === null, 'Türkisch darf keine fremde Stimme bekommen');
  assert(V.pickVoice(voices, 'en', 'en-GB').lang === 'en-GB', 'en');
  assert(V.pickVoice([{ name: 'English US', lang: 'en-US' }, { name: 'Google UK English Female', lang: 'en_GB' }], 'en', 'en-GB').name.includes('UK'), 'Locale/Qualität bevorzugen');
});
test('Quelle: Datei nur bei passendem Hash, sonst Gerätestimme', () => {
  V.setVoices([{ name: 'Google Deutsch', lang: 'de-DE' }]);
  const sc = V.script('dl', 'de');
  V.setManifest({ files: { de: { dl: { hash: sc.hash, n: sc.sentences.length, ext: 'mp3' } } } });
  assert(VOICE.source('dl', 'de').type === 'file', 'Datei erwartet');
  V.setManifest({ files: { de: { dl: { hash: 'veraltet', n: sc.sentences.length, ext: 'mp3' } } } });
  assert(VOICE.source('dl', 'de').type === 'none' || VOICE.source('dl', 'de').type === 'tts', 'veraltete Datei darf nicht genutzt werden');
  V.setManifest(null);
});
test('audio/manifest.json ist gültig und verweist nur auf vorhandene Dateien', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio', 'manifest.json'), 'utf8'));
  for (const [lang, ids] of Object.entries(m.files || {})) for (const [id, f] of Object.entries(ids)) {
    assert(f.ext !== 'wav' || f.voice !== 'mock', `${lang}/${id}: Test-Töne (mock) dürfen nicht veröffentlicht werden`);
    for (let i = 1; i <= f.n; i++) assert(fs.existsSync(path.join(ROOT, 'audio', lang, id, `${i}.${f.ext}`)), `${lang}/${id}/${i}.${f.ext} fehlt`);
  }
});

console.log('\nSET Mode (Theme)');
const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
test('keine festen Akzentfarben außerhalb der Theme-Tokens', () => {
  const body = css.replace(/@property[^}]+}/g, '').replace(/:root \{[\s\S]*?\n\}/, '').replace(/html\[data-setmode="off"\] \{[\s\S]*?\n\}/, '');
  const hits = body.match(/#c8f542|#a6e022|#d4fb5c|#e6ff9a|rgba\(200, ?245, ?66/g);
  assert(!hits, 'gefunden: ' + (hits || []).join(', '));
});
test('OFF-Palette überschreibt alle Akzent-Tokens', () => {
  const off = css.match(/html\[data-setmode="off"\] \{([\s\S]*?)\n\}/)[1];
  for (const k of ['--ac', '--ac2', '--ac-hi', '--ac-glow', '--ac-ink', '--hero-a', '--hero-b', '--up', '--down', '--same']) assert(new RegExp(`${k}:`).test(off), `${k} fehlt`);
});
test('OFF-Palette ist monochrom (nur Grautöne)', () => {
  const off = css.match(/html\[data-setmode="off"\] \{([\s\S]*?)\n\}/)[1];
  for (const [, hex] of off.matchAll(/#([0-9a-f]{6})/gi)) {
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
    assert(Math.max(r, g, b) - Math.min(r, g, b) <= 12, `#${hex} ist nicht grau`);
  }
});
test('Kontrast OFF: Akzent auf Hintergrund ≥ 7:1, Schrift auf Akzent ≥ 7:1', () => {
  const lum = hex => { const c = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const off = css.match(/html\[data-setmode="off"\] \{([\s\S]*?)\n\}/)[1];
  const val = k => off.match(new RegExp(`${k}: #([0-9a-f]{6})`, 'i'))[1];
  assert(ratio(val('--ac'), '000000') >= 7, 'Akzent/Schwarz');
  assert(ratio(val('--ac'), val('--ac-ink')) >= 7, 'Akzent/Schrift');
});
test('gespeicherter Modus wird vor dem ersten Zeichnen angewendet', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(/setMode === false\) document\.documentElement\.dataset\.setmode = 'off'/.test(html), 'Inline-Skript fehlt');
});

console.log(`\n${failed ? '✗' : '✓'} ${passed} bestanden, ${failed} fehlgeschlagen`);
process.exit(failed ? 1 : 0);
