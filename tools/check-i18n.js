// Prüft alle Sprachdateien auf Vollständigkeit: node tools/check-i18n.js
// - gleiche Schlüssel wie Deutsch (Referenz), gleiche Typen (Text/Funktion/Liste)
// - jede Übung aus data.js hat Name, Hinweis, Ausführung und Fehler in jeder Sprache
// - jeder im Code verwendete t('…')-Schlüssel existiert
// - jede Funktion liefert bei Testwerten einen Text
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { console, navigator: { languages: ['de'] }, document: { documentElement: {} } };
vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
run('i18n.js');
const langs = fs.readdirSync(path.join(ROOT, 'lang')).filter(f => f.endsWith('.js'));
langs.forEach(f => run(`lang/${f}`));
run('data.js');
vm.runInContext('this.__I = I18N; this.__EX = EX;', ctx);
const I = ctx.__I, EX = ctx.__EX;

let errors = 0;
const err = msg => { errors++; console.log('✗ ' + msg); };

function flat(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = Array.isArray(v) ? 'array' : typeof v;
  }
  return out;
}

const ref = flat(I.dicts.de);
const sample = { n: 2, d: 1, c: 1, days: 3, min: 20, name: 'Test', day: 'A', x: 'X', w: 6, kg: '2,5', bar: 20, i: 1, t: '90 s', a: 6, b: 8, when: 'heute', split: 'S', freq: 2, r: 8 };

for (const code of I.order) {
  const cur = flat(I.dicts[code]);
  for (const [k, type] of Object.entries(ref)) {
    if (!(k in cur)) err(`[${code}] fehlt: ${k}`);
    else if (cur[k] !== type) err(`[${code}] Typ ${cur[k]} statt ${type}: ${k}`);
  }
  for (const k of Object.keys(cur)) if (!(k in ref)) err(`[${code}] überzählig: ${k}`);
  for (const k of Object.keys(cur)) {
    const v = k.split('.').reduce((o, p) => o[p], I.dicts[code]);
    if (typeof v === 'function') {
      for (const n of [0, 1, 2, 5]) {
        const out = v({ ...sample, n, d: n });
        if (typeof out !== 'string' || !out.trim() || /undefined|NaN/.test(out)) err(`[${code}] ${k}(${n}) → ${out}`);
      }
    } else if (typeof v === 'string' && !v.trim()) err(`[${code}] leer: ${k}`);
  }
  for (const x of EX) {
    for (const f of ['name', 'cue', 'exec', 'mistake']) {
      const v = I.dicts[code].ex?.[x.id]?.[f];
      if (!v || !String(v).trim()) err(`[${code}] Übung ${x.id}.${f} fehlt`);
    }
    for (const m of x.muscles) if (!I.dicts[code].muscle?.[m]) err(`[${code}] Muskel ${m} fehlt`);
    if (!I.dicts[code].breath?.[x.br]) err(`[${code}] Atmung ${x.br} fehlt`);
  }
  if (I.dicts[code].weekdays?.length !== 7) err(`[${code}] weekdays braucht 7 Einträge`);
}

// Schlüssel aus dem Code (nur feste Strings)
for (const f of ['app.js', 'data.js']) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of src.matchAll(/\bt(?:Opt)?\('([a-zA-Z0-9_.]+)'/g)) {
    if (!(m[1] in ref) && !Object.keys(ref).some(k => k.startsWith(m[1] + '.'))) err(`${f}: unbekannter Schlüssel ${m[1]}`);
  }
}

console.log(errors ? `\n${errors} Problem(e) gefunden.` : `✓ ${I.order.length} Sprachen vollständig (${Object.keys(ref).length} Schlüssel, ${EX.length} Übungen).`);
process.exit(errors ? 1 : 0);
