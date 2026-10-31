'use strict';

/* =========================================================
   Übungsdatenbank + Plan-Generator
   ratio = grobes Arbeitsgewicht (~8 Wdh.) als Anteil vom
   Körpergewicht für einen geübten Mann; KH-Werte je Hand.
   ========================================================= */

function uid() { return Math.random().toString(36).slice(2, 10); }
function roundTo(x, inc) {
  const step = inc > 0 ? inc : 0.5;
  return +(Math.round(x / step) * step).toFixed(2);
}

const INC = { barbell: 2.5, dumbbell: 2, machine: 5, cable: 2.5, bodyweight: 0 };
const LOWER = ['squat', 'hinge', 'hingeHeavy', 'glute', 'lunge', 'quadIso', 'hamCurl', 'calf'];

function X(id, name, kind, pat, ratio, muscles, note = '', opt = {}) {
  return {
    id, name, kind, pat, ratio, muscles, note,
    flags: opt.flags || [],
    single: !!opt.single,
    inc: opt.inc ?? (kind === 'dumbbell' && ratio < 0.13 ? 1 : INC[kind]),
  };
}

const EX = [
  // Beine – Kniebeuge-Muster
  X('sq_bb', 'Kniebeuge', 'barbell', 'squat', 0.9, 'Beine · Po', 'Mindestens bis parallel, Rumpf fest', { flags: ['spine', 'knee'] }),
  X('legpress', 'Beinpresse', 'machine', 'squat', 1.6, 'Beine · Po', 'Füße schulterbreit, unten nicht abrunden'),
  X('hack', 'Hackenschmidt-Kniebeuge', 'machine', 'squat', 1.0, 'Beine · Po', 'Kontrolliert ablassen, Fersen bleiben unten', { flags: ['knee'] }),
  X('goblet', 'Goblet Squat', 'dumbbell', 'squat', 0.3, 'Beine · Po', 'Kurzhantel vor der Brust, aufrecht bleiben', { flags: ['knee'], single: true }),
  // Hüftbeuge
  X('dl', 'Kreuzheben', 'barbell', 'hingeHeavy', 1.2, 'Rücken · Beinbeuger · Po', 'Stange nah am Körper, Rücken neutral', { flags: ['spine'] }),
  X('rdl_bb', 'Rumänisches Kreuzheben', 'barbell', 'hinge', 0.8, 'Beinbeuger · Po', 'Knie leicht gebeugt, Hüfte nach hinten schieben', { flags: ['spine'] }),
  X('rdl_db', 'Rumänisches Kreuzheben (KH)', 'dumbbell', 'hinge', 0.3, 'Beinbeuger · Po', 'Hanteln nah an den Beinen, Rücken gerade', { flags: ['spine'] }),
  X('hyper', 'Hyperextensions', 'bodyweight', 'hinge', 0, 'Unterer Rücken · Po', 'Langsam, oben nicht überstrecken', { flags: ['spine'] }),
  X('hipthrust_bb', 'Hip Thrust', 'barbell', 'glute', 1.0, 'Po · Beinbeuger', 'Oben 1 Sek. halten, Kinn zur Brust'),
  X('hipthrust_db', 'Hip Thrust (KH)', 'dumbbell', 'glute', 0.4, 'Po · Beinbeuger', 'Hantel auf der Hüfte, oben fest anspannen', { single: true }),
  X('kickback', 'Kabel-Kickbacks', 'cable', 'glute', 0.1, 'Po', 'Wdh. je Bein, Hüfte stabil'),
  // Einbeinig / Isolation Beine
  X('lunge_db', 'Ausfallschritte', 'dumbbell', 'lunge', 0.15, 'Beine · Po', 'Wdh. je Bein, Oberkörper aufrecht', { flags: ['knee'] }),
  X('bss', 'Bulgarian Split Squats', 'dumbbell', 'lunge', 0.12, 'Beine · Po', 'Hinterer Fuß auf der Bank, Wdh. je Bein', { flags: ['knee'], inc: 2 }),
  X('legext', 'Beinstrecker', 'machine', 'quadIso', 0.5, 'Oberschenkel vorne', 'Oben 1 Sek. halten', { flags: ['knee'] }),
  X('legcurl_l', 'Beinbeuger liegend', 'machine', 'hamCurl', 0.35, 'Beinbeuger', 'Hüfte bleibt auf dem Polster'),
  X('legcurl_s', 'Beinbeuger sitzend', 'machine', 'hamCurl', 0.4, 'Beinbeuger', 'Langsam zurückführen'),
  X('sl_rdl', 'Einbeiniges Kreuzheben (KH)', 'dumbbell', 'hamCurl', 0.15, 'Beinbeuger · Po', 'Wdh. je Bein, langsam und kontrolliert', { inc: 2 }),
  X('calf_m', 'Wadenheben Maschine', 'machine', 'calf', 1.0, 'Waden', 'Oben 1 Sek. halten, unten voll dehnen'),
  X('calf_db', 'Wadenheben stehend (KH)', 'dumbbell', 'calf', 0.25, 'Waden', 'Auf einer Stufe, volle Bewegung'),
  // Brust
  X('bench_bb', 'Bankdrücken', 'barbell', 'hpush', 0.75, 'Brust · Trizeps', 'Schulterblätter zusammen, Füße fest am Boden'),
  X('chestpress', 'Brustpresse', 'machine', 'hpush', 0.6, 'Brust · Trizeps', 'Griffe auf Brusthöhe, Schultern unten'),
  X('bench_db', 'Bankdrücken (KH)', 'dumbbell', 'hpush', 0.3, 'Brust · Trizeps', 'Hanteln kontrolliert bis Brusthöhe'),
  X('pushup', 'Liegestütze', 'bodyweight', 'hpush', 0, 'Brust · Trizeps', 'Körper bleibt ein Brett'),
  X('incl_db', 'Schrägbankdrücken (KH)', 'dumbbell', 'incline', 0.25, 'Obere Brust · Schultern', 'Bank auf ca. 30°'),
  X('incl_bb', 'Schrägbankdrücken', 'barbell', 'incline', 0.6, 'Obere Brust · Schultern', 'Bank auf ca. 30°, Stange zur oberen Brust'),
  X('incl_m', 'Schrägbank-Presse', 'machine', 'incline', 0.5, 'Obere Brust · Schultern', 'Sitz so einstellen, dass Griffe auf Brusthöhe sind'),
  X('fly_m', 'Butterfly', 'machine', 'chestIso', 0.45, 'Brust', 'Ellbogen leicht gebeugt, vorne kurz drücken'),
  X('fly_c', 'Kabel-Flys', 'cable', 'chestIso', 0.12, 'Brust', 'Bogen nach vorne-unten, Brust raus'),
  X('fly_db', 'Fliegende (KH)', 'dumbbell', 'chestIso', 0.1, 'Brust', 'Nur bis Schulterhöhe ablassen'),
  // Schultern
  X('ohp_bb', 'Schulterdrücken stehend', 'barbell', 'vpush', 0.45, 'Schultern · Trizeps', 'Po und Bauch fest, Kopf durch die Arme', { flags: ['spine', 'shoulder'] }),
  X('ohp_db', 'Schulterdrücken sitzend (KH)', 'dumbbell', 'vpush', 0.18, 'Schultern · Trizeps', 'Lehne fast senkrecht', { flags: ['shoulder'], inc: 2 }),
  X('ohp_m', 'Schulterpresse', 'machine', 'vpush', 0.4, 'Schultern · Trizeps', 'Rücken an die Lehne', { flags: ['shoulder'] }),
  X('lat_raise', 'Seitheben (KH)', 'dumbbell', 'sideDelt', 0.07, 'Seitliche Schulter', 'Kontrolliert, nicht schwingen'),
  X('lat_raise_c', 'Seitheben am Kabel', 'cable', 'sideDelt', 0.05, 'Seitliche Schulter', 'Wdh. je Seite, Zug konstant halten'),
  X('lat_raise_m', 'Seitheben Maschine', 'machine', 'sideDelt', 0.3, 'Seitliche Schulter', 'Ellbogen führen die Bewegung'),
  X('facepull', 'Face Pulls', 'cable', 'rearDelt', 0.2, 'Hintere Schulter', 'Zum Gesicht ziehen, Daumen nach hinten'),
  X('revfly_m', 'Reverse Butterfly', 'machine', 'rearDelt', 0.3, 'Hintere Schulter', 'Arme fast gestreckt, Schulterblätter zusammen'),
  X('revfly_db', 'Vorgebeugtes Seitheben (KH)', 'dumbbell', 'rearDelt', 0.06, 'Hintere Schulter', 'Oberkörper fast waagrecht'),
  // Rücken
  X('row_bb', 'Langhantelrudern', 'barbell', 'hpull', 0.6, 'Rücken · Bizeps', 'Oberkörper ca. 45°, zum Bauchnabel ziehen', { flags: ['spine'] }),
  X('row_c', 'Kabelrudern', 'cable', 'hpull', 0.6, 'Rücken · Bizeps', 'Schulterblätter zuerst zusammenziehen'),
  X('row_db', 'Einarmiges Rudern (KH)', 'dumbbell', 'hpull', 0.3, 'Rücken · Bizeps', 'Wdh. je Seite, Ellbogen nah am Körper'),
  X('row_m', 'Rudermaschine brustgestützt', 'machine', 'hpull', 0.55, 'Rücken · Bizeps', 'Brust bleibt am Polster'),
  X('latpd', 'Latzug breit', 'cable', 'vpull', 0.6, 'Latissimus · Bizeps', 'Zur oberen Brust ziehen, Brust raus'),
  X('pullup', 'Klimmzüge', 'bodyweight', 'vpull', 0, 'Latissimus · Bizeps', 'Volle Streckung unten, Kinn über die Stange', { flags: ['bar', 'adv'] }),
  X('latpd_n', 'Latzug eng', 'cable', 'vpull', 0.6, 'Latissimus · Bizeps', 'Ellbogen nach unten-hinten ziehen'),
  X('pullover_db', 'Pullover (KH)', 'dumbbell', 'vpull', 0.2, 'Latissimus · Brust', 'Arme leicht gebeugt, hinter den Kopf absenken', { single: true }),
  // Arme
  X('curl_db', 'Bizeps-Curls (KH)', 'dumbbell', 'biceps', 0.12, 'Bizeps', 'Ellbogen bleiben am Körper'),
  X('curl_c', 'Kabel-Curls', 'cable', 'biceps', 0.2, 'Bizeps', 'Oben kurz anspannen'),
  X('hammer', 'Hammer-Curls', 'dumbbell', 'biceps', 0.13, 'Bizeps · Unterarme', 'Daumen zeigen nach oben', { inc: 1 }),
  X('pushdown', 'Trizepsdrücken am Seil', 'cable', 'triceps', 0.25, 'Trizeps', 'Unten Seil auseinanderziehen'),
  X('oh_tri_c', 'Überkopf-Trizeps am Kabel', 'cable', 'triceps', 0.2, 'Trizeps', 'Ellbogen zeigen nach vorne', { flags: ['shoulder'] }),
  X('oh_tri_db', 'Trizeps-Überkopf (KH)', 'dumbbell', 'triceps', 0.15, 'Trizeps', 'Eine Hantel mit beiden Händen', { flags: ['shoulder'], single: true, inc: 2 }),
  X('kick_tri', 'Trizeps-Kickbacks (KH)', 'dumbbell', 'triceps', 0.05, 'Trizeps', 'Oberarm bleibt parallel zum Boden'),
  // Bauch
  X('cable_crunch', 'Kabel-Crunch', 'cable', 'core', 0.4, 'Bauch', 'Kniend, Rücken einrollen'),
  X('leg_raise', 'Beinheben hängend', 'bodyweight', 'core', 0, 'Bauch', 'Ohne Schwung, Becken einrollen', { flags: ['bar'] }),
  X('db_crunch', 'Crunches mit Gewicht', 'dumbbell', 'core', 0.08, 'Bauch', 'Hantel auf der Brust halten', { single: true }),
  X('deadbug', 'Dead Bugs', 'bodyweight', 'core', 0, 'Bauch', 'Wdh. je Seite, unterer Rücken bleibt am Boden'),
];

const FALLBACK = {
  vpush: ['sideDelt'], hingeHeavy: ['hinge', 'glute'], hinge: ['glute', 'hamCurl'],
  squat: ['glute'], lunge: ['glute', 'hamCurl'], quadIso: ['hamCurl'],
};
const LIMIT_FLAG = { ruecken: 'spine', schulter: 'shoulder', knie: 'knee' };

/* ---------- Tagesvorlagen ---------- */

const T = {
  fbA: { name: 'Ganzkörper', slots: [['squat', 'M'], ['hpush', 'M'], ['hpull', 'S'], ['hinge', 'S'], ['sideDelt', 'A'], ['biceps', 'A'], ['core', 'A']] },
  fbB: { name: 'Ganzkörper', slots: [['hingeHeavy', 'M'], ['incline', 'S'], ['vpull', 'S'], ['lunge', 'S'], ['vpush', 'A'], ['triceps', 'A'], ['calf', 'A']] },
  fbC: { name: 'Ganzkörper', slots: [['squat', 'M'], ['vpush', 'M'], ['hpull', 'S'], ['hpush', 'S'], ['hamCurl', 'A'], ['rearDelt', 'A'], ['core', 'A']] },
  upA: { name: 'Oberkörper', slots: [['hpush', 'M'], ['hpull', 'M'], ['vpush', 'S'], ['vpull', 'S'], ['sideDelt', 'A'], ['biceps', 'A'], ['triceps', 'A']] },
  loA: { name: 'Unterkörper', slots: [['squat', 'M'], ['hinge', 'S'], ['lunge', 'S'], ['hamCurl', 'A'], ['calf', 'A'], ['core', 'A']] },
  upB: { name: 'Oberkörper', slots: [['incline', 'M'], ['vpull', 'M'], ['hpull', 'S'], ['chestIso', 'A'], ['rearDelt', 'A'], ['biceps', 'A'], ['triceps', 'A']] },
  loB: { name: 'Unterkörper', slots: [['hingeHeavy', 'M'], ['squat', 'S'], ['glute', 'S'], ['quadIso', 'A'], ['hamCurl', 'A'], ['calf', 'A'], ['core', 'A']] },
  push: { name: 'Push', slots: [['hpush', 'M'], ['vpush', 'S'], ['incline', 'S'], ['chestIso', 'A'], ['sideDelt', 'A'], ['triceps', 'A']] },
  pull: { name: 'Pull', slots: [['vpull', 'M'], ['hpull', 'S'], ['hpull', 'S'], ['rearDelt', 'A'], ['biceps', 'A'], ['biceps', 'A']] },
  legs: { name: 'Beine', slots: [['squat', 'M'], ['hinge', 'S'], ['lunge', 'S'], ['hamCurl', 'A'], ['quadIso', 'A'], ['calf', 'A'], ['core', 'A']] },
};

const SPLITS = {
  fb: { label: 'Ganzkörper', desc: 'Jeder Muskel bei jedem Training, ideal bei 2–3 Tagen', days: { 2: ['fbA', 'fbB'], 3: ['fbA', 'fbB', 'fbC'] } },
  ppl: { label: 'Push / Pull / Beine', desc: 'Drücken, Ziehen, Beine getrennt, mehr Übungen pro Muskel', days: { 3: ['push', 'pull', 'legs'], 6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] } },
  ul: { label: 'Oberkörper / Unterkörper', desc: 'Jeder Muskel 2× pro Woche', days: { 4: ['upA', 'loA', 'upB', 'loB'] } },
  ulppl: { label: 'OK/UK + Push/Pull/Beine', desc: 'Mischung für 5 Tage, jeder Muskel ca. 2×', days: { 5: ['upA', 'loA', 'push', 'pull', 'legs'] } },
};
function splitOptions(days) {
  return ['fb', 'ul', 'ulppl', 'ppl'].filter(k => SPLITS[k].days[days]);
}

/* Sätze, Wdh.-min, Wdh.-max, Pause (s) je Ziel und Rolle (Haupt-, Neben-, Zusatzübung) */
const SCHEME = {
  fett: { M: [4, 6, 8, 120], S: [3, 8, 10, 90], A: [3, 12, 15, 60] },
  muskel: { M: [4, 6, 10, 150], S: [3, 8, 12, 105], A: [3, 10, 15, 75] },
  kraft: { M: [5, 3, 5, 180], S: [3, 6, 8, 150], A: [3, 8, 12, 90] },
  fitness: { M: [3, 8, 12, 90], S: [3, 10, 12, 75], A: [2, 12, 15, 60] },
};
const CARDIO_MIN = { fett: 20, fitness: 15, muskel: 10, kraft: 10 };
const CARDIO = {
  gym: [
    ['Laufband – Steigung gehen', 'Steigung 10–12 %, 5–5,5 km/h, nicht festhalten'],
    ['Crosstrainer', 'Mittlere Intensität, du solltest noch sprechen können'],
    ['Fahrrad-Ergometer', 'Locker bis mittel, 80–90 Umdrehungen pro Minute'],
  ],
  home: [['Zügiges Gehen oder Radfahren', 'Leicht außer Atem, aber noch gesprächsfähig']],
};

const FOCUS = {
  brust: { label: 'Brust', pats: ['chestIso'], region: 'upper' },
  ruecken: { label: 'Rücken', pats: ['hpull'], region: 'upper' },
  schultern: { label: 'Schultern', pats: ['sideDelt'], region: 'upper' },
  arme: { label: 'Arme', pats: ['biceps', 'triceps'], region: 'upper' },
  beine: { label: 'Beine', pats: ['quadIso'], region: 'lower' },
  po: { label: 'Po', pats: ['glute'], region: 'lower' },
  bauch: { label: 'Bauch', pats: ['core'], region: 'any' },
};

function equipOK(x, equip) {
  if (x.flags.includes('bar') && equip === 'home') return false;
  if (equip === 'machines') return x.kind !== 'barbell';
  if (equip === 'home') return x.kind === 'dumbbell' || x.kind === 'bodyweight';
  return true;
}

function candidates(pat, ctx, used = new Set()) {
  return EX.filter(x => x.pat === pat && equipOK(x, ctx.equip)
    && !x.flags.some(f => ctx.limitFlags.includes(f))
    && !(x.flags.includes('adv') && ctx.exp !== 'adv')
    && !used.has(x.id));
}

function pick(pattern, role, ctx, used) {
  for (const pat of [pattern, ...(FALLBACK[pattern] || [])]) {
    let c = candidates(pat, ctx, used);
    if (!c.length) continue;
    // Zusatzübungen und Anfänger: geführte Varianten zuerst
    if (role === 'A' || role === 'F' || ctx.exp === 'beginner') c = [...c.filter(x => x.kind !== 'barbell'), ...c.filter(x => x.kind === 'barbell')];
    // Hauptübungen nur mit Körpergewicht, wenn es nichts anderes gibt
    if (role === 'M' && c.some(x => x.kind !== 'bodyweight')) c = c.filter(x => x.kind !== 'bodyweight');
    const n = ctx.count[pat] || 0;
    ctx.count[pat] = n + 1;
    return c[n % c.length];
  }
  return null;
}

function estimateWeight(x, p, repMin) {
  if (x.kind === 'bodyweight') return 0;
  if (!p || !p.bw) return null;
  const expF = { beginner: 0.55, inter: 0.8, adv: 1 }[p.exp] || 0.8;
  const lower = LOWER.includes(x.pat);
  const sexF = p.sex === 'f' ? (lower ? 0.75 : 0.55) : p.sex === 'm' ? 1 : (lower ? 0.87 : 0.77);
  const repF = repMin <= 5 ? 1.1 : repMin >= 12 ? 0.8 : repMin >= 10 ? 0.88 : 1;
  const min = x.kind === 'barbell' ? 20 : x.kind === 'machine' ? 5 : x.kind === 'cable' ? 2.5 : 1;
  return Math.max(min, roundTo(x.ratio * p.bw * expF * sexF * repF, x.inc || 1));
}

function makeEx(x, sets, repMin, repMax, rest, role, p) {
  return {
    id: uid(), ref: x.id, name: x.name, kind: x.kind, single: x.single, muscles: x.muscles, role,
    sets, repMin, repMax, targetReps: repMin, weight: estimateWeight(x, p, repMin),
    inc: x.inc, rest, note: x.note, fails: 0,
  };
}

function exSeconds(e) { return e.kind === 'cardio' ? e.duration * 60 : e.sets * (35 + (e.rest || 90)); }

function fitTime(exs, minutes, cardioMin, exp) {
  const budget = minutes * 60 - 300 - cardioMin * 60;
  const total = () => exs.reduce((s, e) => s + exSeconds(e), 0);
  const lastIdx = role => { for (let i = exs.length - 1; i >= 0; i--) if (exs[i].role === role) return i; return -1; };
  while (total() > budget && exs.length > 4) {
    let i = lastIdx('A');
    if (i < 0) i = lastIdx('F');
    if (i < 0) break;
    exs.splice(i, 1);
  }
  if (total() > budget) exs.forEach(e => { if (e.role !== 'M' && e.sets > 2) e.sets--; });
  if (exp !== 'beginner' && total() < budget - 15 * 60) {
    const extra = exs.filter(e => e.role === 'S').reduce((s, e) => s + 35 + e.rest, 0);
    if (total() + extra <= budget) exs.forEach(e => { if (e.role === 'S') e.sets++; });
  }
}

function regionOf(pat) { return pat === 'core' ? 'core' : LOWER.includes(pat) ? 'lower' : 'upper'; }

function applyFocus(dayDefs, focus) {
  for (const key of focus || []) {
    const f = FOCUS[key];
    if (!f) continue;
    const match = dayDefs.filter(d => f.region === 'any' || d.slots.some(s => regionOf(s.pat) === f.region));
    for (const d of match.slice(0, 2)) {
      for (const pat of f.pats) {
        const s = d.slots.find(s => s.pat === pat);
        if (s) s.extra++;
        else d.slots.push({ pat, role: 'F', extra: 0 });
      }
    }
  }
}

function buildPlan(p) {
  const keys = SPLITS[p.split].days[p.days];
  const ctx = { equip: p.equip, exp: p.exp, limitFlags: (p.limits || []).map(l => LIMIT_FLAG[l]), count: {} };
  const dayDefs = keys.map(k => ({ tpl: T[k], slots: T[k].slots.map(([pat, role]) => ({ pat, role, extra: 0 })) }));
  applyFocus(dayDefs, p.focus);

  const scheme = SCHEME[p.goal];
  const cardioMin = p.cardio ? CARDIO_MIN[p.goal] : 0;
  const nameCount = {}, seen = {};
  keys.forEach(k => { nameCount[T[k].name] = (nameCount[T[k].name] || 0) + 1; });
  const cardioList = CARDIO[p.equip === 'home' ? 'home' : 'gym'];

  return dayDefs.map((d, i) => {
    const used = new Set();
    const exercises = [];
    for (const s of d.slots) {
      const x = pick(s.pat, s.role, ctx, used);
      if (!x) continue;
      used.add(x.id);
      let [sets, repMin, repMax, rest] = scheme[s.role === 'F' ? 'A' : s.role];
      if (p.exp === 'beginner' && s.role === 'M') sets = Math.max(3, sets - 1);
      exercises.push(makeEx(x, sets + s.extra, repMin, repMax, rest, s.role, p));
    }
    fitTime(exercises, p.minutes, cardioMin, p.exp);
    if (cardioMin) {
      const [name, note] = cardioList[i % cardioList.length];
      exercises.push({ id: uid(), kind: 'cardio', name, duration: cardioMin, note });
    }
    const nm = d.tpl.name;
    seen[nm] = (seen[nm] || 0) + 1;
    return {
      id: String.fromCharCode(65 + i),
      name: nameCount[nm] > 1 ? `${nm} ${String.fromCharCode(64 + seen[nm])}` : nm,
      exercises,
    };
  });
}

function planReason(p) {
  const freq = { fb: p.days, ul: 2, ulppl: 2, ppl: p.days >= 6 ? 2 : 1 }[p.split];
  const goal = {
    fett: 'Schwere Grundübungen halten deine Muskeln im Kaloriendefizit, kürzere Pausen und Cardio erhöhen den Verbrauch.',
    muskel: 'Viel Training im Bereich von 6–15 Wdh. mit genug Sätzen pro Muskel, der klassische Weg zu mehr Masse.',
    kraft: 'Schwere Grundübungen mit 3–5 Wdh. und langen Pausen, ergänzt durch Übungen für Stabilität.',
    fitness: 'Ausgewogene Mischung aus Kraft und Ausdauer mit moderaten Pausen, gut für Alltag und Gesundheit.',
  }[p.goal];
  return `${SPLITS[p.split].label} mit ${p.days} Tagen: jeder Muskel ca. ${freq}× pro Woche. ${goal}`;
}
