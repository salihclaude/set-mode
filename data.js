'use strict';

/* =========================================================
   SET Mode – Übungsdatenbank + Plan-Generator
   Texte (Name, Hinweis, Ausführung, Fehler) stehen in den
   Sprachdateien unter ex.<id>. Hier nur Struktur und Zahlen.
   ratio = grobes Arbeitsgewicht (~8 Wdh.) als Anteil vom
   Körpergewicht für einen geübten Mann; KH-Werte je Hand.
   br = Atemmuster (brace | lift | core | cardio)
   ========================================================= */

function uid() { return Math.random().toString(36).slice(2, 10); }
function roundTo(x, inc) {
  const step = inc > 0 ? inc : 0.5;
  return +(Math.round(x / step) * step).toFixed(2);
}

const INC = { barbell: 2.5, dumbbell: 2, machine: 5, cable: 2.5, bodyweight: 0, cardio: 0 };
const LOWER = ['squat', 'hinge', 'hingeHeavy', 'glute', 'lunge', 'quadIso', 'hamCurl', 'calf'];

function X(id, kind, pat, ratio, muscles, br, opt = {}) {
  return {
    id, kind, pat, ratio, muscles, br,
    flags: opt.flags || [],
    single: !!opt.single,
    inc: opt.inc ?? (kind === 'dumbbell' && ratio < 0.13 ? 1 : INC[kind]),
  };
}

const EX = [
  // Beine – Kniebeuge-Muster
  X('sq_bb', 'barbell', 'squat', 0.9, ['quads', 'glutes', 'core'], 'brace', { flags: ['spine', 'knee'] }),
  X('legpress', 'machine', 'squat', 1.6, ['quads', 'glutes'], 'brace'),
  X('hack', 'machine', 'squat', 1.0, ['quads', 'glutes'], 'brace', { flags: ['knee'] }),
  X('goblet', 'dumbbell', 'squat', 0.3, ['quads', 'glutes', 'core'], 'brace', { flags: ['knee'], single: true }),
  // Hüftbeuge
  X('dl', 'barbell', 'hingeHeavy', 1.2, ['lowerBack', 'hamstrings', 'glutes'], 'brace', { flags: ['spine'] }),
  X('rdl_bb', 'barbell', 'hinge', 0.8, ['hamstrings', 'glutes', 'lowerBack'], 'brace', { flags: ['spine'] }),
  X('rdl_db', 'dumbbell', 'hinge', 0.3, ['hamstrings', 'glutes', 'lowerBack'], 'brace', { flags: ['spine'] }),
  X('hyper', 'bodyweight', 'hinge', 0, ['lowerBack', 'glutes'], 'lift', { flags: ['spine'] }),
  X('hipthrust_bb', 'barbell', 'glute', 1.0, ['glutes', 'hamstrings'], 'brace'),
  X('hipthrust_db', 'dumbbell', 'glute', 0.4, ['glutes', 'hamstrings'], 'brace', { single: true }),
  X('kickback', 'cable', 'glute', 0.1, ['glutes'], 'lift'),
  // Einbeinig / Isolation Beine
  X('lunge_db', 'dumbbell', 'lunge', 0.15, ['quads', 'glutes'], 'brace', { flags: ['knee'] }),
  X('bss', 'dumbbell', 'lunge', 0.12, ['quads', 'glutes'], 'brace', { flags: ['knee'], inc: 2 }),
  X('legext', 'machine', 'quadIso', 0.5, ['quads'], 'lift', { flags: ['knee'] }),
  X('legcurl_l', 'machine', 'hamCurl', 0.35, ['hamstrings'], 'lift'),
  X('legcurl_s', 'machine', 'hamCurl', 0.4, ['hamstrings'], 'lift'),
  X('sl_rdl', 'dumbbell', 'hamCurl', 0.15, ['hamstrings', 'glutes'], 'brace', { inc: 2 }),
  X('calf_m', 'machine', 'calf', 1.0, ['calves'], 'lift'),
  X('calf_db', 'dumbbell', 'calf', 0.25, ['calves'], 'lift'),
  // Brust
  X('bench_bb', 'barbell', 'hpush', 0.75, ['chest', 'triceps', 'shoulders'], 'lift'),
  X('chestpress', 'machine', 'hpush', 0.6, ['chest', 'triceps'], 'lift'),
  X('bench_db', 'dumbbell', 'hpush', 0.3, ['chest', 'triceps', 'shoulders'], 'lift'),
  X('pushup', 'bodyweight', 'hpush', 0, ['chest', 'triceps', 'core'], 'lift'),
  X('incl_db', 'dumbbell', 'incline', 0.25, ['upperChest', 'shoulders', 'triceps'], 'lift'),
  X('incl_bb', 'barbell', 'incline', 0.6, ['upperChest', 'shoulders', 'triceps'], 'lift'),
  X('incl_m', 'machine', 'incline', 0.5, ['upperChest', 'shoulders', 'triceps'], 'lift'),
  X('fly_m', 'machine', 'chestIso', 0.45, ['chest'], 'lift'),
  X('fly_c', 'cable', 'chestIso', 0.12, ['chest'], 'lift'),
  X('fly_db', 'dumbbell', 'chestIso', 0.1, ['chest'], 'lift'),
  // Schultern
  X('ohp_bb', 'barbell', 'vpush', 0.45, ['shoulders', 'triceps', 'core'], 'brace', { flags: ['spine', 'shoulder'] }),
  X('ohp_db', 'dumbbell', 'vpush', 0.18, ['shoulders', 'triceps'], 'lift', { flags: ['shoulder'], inc: 2 }),
  X('ohp_m', 'machine', 'vpush', 0.4, ['shoulders', 'triceps'], 'lift', { flags: ['shoulder'] }),
  X('lat_raise', 'dumbbell', 'sideDelt', 0.07, ['sideDelts'], 'lift'),
  X('lat_raise_c', 'cable', 'sideDelt', 0.05, ['sideDelts'], 'lift'),
  X('lat_raise_m', 'machine', 'sideDelt', 0.3, ['sideDelts'], 'lift'),
  X('facepull', 'cable', 'rearDelt', 0.2, ['rearDelts', 'back'], 'lift'),
  X('revfly_m', 'machine', 'rearDelt', 0.3, ['rearDelts', 'back'], 'lift'),
  X('revfly_db', 'dumbbell', 'rearDelt', 0.06, ['rearDelts', 'back'], 'lift'),
  // Rücken
  X('row_bb', 'barbell', 'hpull', 0.6, ['back', 'lats', 'biceps'], 'brace', { flags: ['spine'] }),
  X('row_c', 'cable', 'hpull', 0.6, ['back', 'lats', 'biceps'], 'lift'),
  X('row_db', 'dumbbell', 'hpull', 0.3, ['lats', 'back', 'biceps'], 'lift'),
  X('row_m', 'machine', 'hpull', 0.55, ['back', 'biceps'], 'lift'),
  X('latpd', 'cable', 'vpull', 0.6, ['lats', 'biceps'], 'lift'),
  X('pullup', 'bodyweight', 'vpull', 0, ['lats', 'biceps'], 'lift', { flags: ['bar', 'adv'] }),
  X('latpd_n', 'cable', 'vpull', 0.6, ['lats', 'biceps'], 'lift'),
  X('pullover_db', 'dumbbell', 'vpull', 0.2, ['lats', 'chest'], 'lift', { single: true }),
  // Arme
  X('curl_db', 'dumbbell', 'biceps', 0.12, ['biceps'], 'lift'),
  X('curl_c', 'cable', 'biceps', 0.2, ['biceps'], 'lift'),
  X('hammer', 'dumbbell', 'biceps', 0.13, ['biceps', 'forearms'], 'lift', { inc: 1 }),
  X('pushdown', 'cable', 'triceps', 0.25, ['triceps'], 'lift'),
  X('oh_tri_c', 'cable', 'triceps', 0.2, ['triceps'], 'lift', { flags: ['shoulder'] }),
  X('oh_tri_db', 'dumbbell', 'triceps', 0.15, ['triceps'], 'lift', { flags: ['shoulder'], single: true, inc: 2 }),
  X('kick_tri', 'dumbbell', 'triceps', 0.05, ['triceps'], 'lift'),
  // Bauch
  X('cable_crunch', 'cable', 'core', 0.4, ['abs'], 'core'),
  X('leg_raise', 'bodyweight', 'core', 0, ['abs'], 'core', { flags: ['bar'] }),
  X('db_crunch', 'dumbbell', 'core', 0.08, ['abs'], 'core', { single: true }),
  X('deadbug', 'bodyweight', 'core', 0, ['abs', 'core'], 'core'),
  // Cardio
  X('c_tread', 'cardio', 'cardio', 0, ['legs', 'heart'], 'cardio'),
  X('c_cross', 'cardio', 'cardio', 0, ['legs', 'heart'], 'cardio'),
  X('c_bike', 'cardio', 'cardio', 0, ['legs', 'heart'], 'cardio'),
  X('c_walk', 'cardio', 'cardio', 0, ['legs', 'heart'], 'cardio'),
];
const EX_BY_ID = Object.fromEntries(EX.map(x => [x.id, x]));

const FALLBACK = {
  vpush: ['sideDelt'], hingeHeavy: ['hinge', 'glute'], hinge: ['glute', 'hamCurl'],
  squat: ['glute'], lunge: ['glute', 'hamCurl'], quadIso: ['hamCurl'],
};
const LIMIT_FLAG = { ruecken: 'spine', schulter: 'shoulder', knie: 'knee' };

/* ---------- Tagesvorlagen ---------- */

const T = {
  fbA: { tpl: 'fb', slots: [['squat', 'M'], ['hpush', 'M'], ['hpull', 'S'], ['hinge', 'S'], ['sideDelt', 'A'], ['biceps', 'A'], ['core', 'A']] },
  fbB: { tpl: 'fb', slots: [['hingeHeavy', 'M'], ['incline', 'S'], ['vpull', 'S'], ['lunge', 'S'], ['vpush', 'A'], ['triceps', 'A'], ['calf', 'A']] },
  fbC: { tpl: 'fb', slots: [['squat', 'M'], ['vpush', 'M'], ['hpull', 'S'], ['hpush', 'S'], ['hamCurl', 'A'], ['rearDelt', 'A'], ['core', 'A']] },
  upA: { tpl: 'up', slots: [['hpush', 'M'], ['hpull', 'M'], ['vpush', 'S'], ['vpull', 'S'], ['sideDelt', 'A'], ['biceps', 'A'], ['triceps', 'A']] },
  loA: { tpl: 'lo', slots: [['squat', 'M'], ['hinge', 'S'], ['lunge', 'S'], ['hamCurl', 'A'], ['calf', 'A'], ['core', 'A']] },
  upB: { tpl: 'up', slots: [['incline', 'M'], ['vpull', 'M'], ['hpull', 'S'], ['chestIso', 'A'], ['rearDelt', 'A'], ['biceps', 'A'], ['triceps', 'A']] },
  loB: { tpl: 'lo', slots: [['hingeHeavy', 'M'], ['squat', 'S'], ['glute', 'S'], ['quadIso', 'A'], ['hamCurl', 'A'], ['calf', 'A'], ['core', 'A']] },
  push: { tpl: 'push', slots: [['hpush', 'M'], ['vpush', 'S'], ['incline', 'S'], ['chestIso', 'A'], ['sideDelt', 'A'], ['triceps', 'A']] },
  pull: { tpl: 'pull', slots: [['vpull', 'M'], ['hpull', 'S'], ['hpull', 'S'], ['rearDelt', 'A'], ['biceps', 'A'], ['biceps', 'A']] },
  legs: { tpl: 'legs', slots: [['squat', 'M'], ['hinge', 'S'], ['lunge', 'S'], ['hamCurl', 'A'], ['quadIso', 'A'], ['calf', 'A'], ['core', 'A']] },
};

/* Texte: split.<key>.label / .desc */
const SPLITS = {
  fb: { days: { 2: ['fbA', 'fbB'], 3: ['fbA', 'fbB', 'fbC'] } },
  ppl: { days: { 3: ['push', 'pull', 'legs'], 6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] } },
  ul: { days: { 4: ['upA', 'loA', 'upB', 'loB'] } },
  ulppl: { days: { 5: ['upA', 'loA', 'push', 'pull', 'legs'] } },
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
const CARDIO = { gym: ['c_tread', 'c_cross', 'c_bike'], home: ['c_walk'] };

/* Texte: focus.<key> */
const FOCUS = {
  brust: { pats: ['chestIso'], region: 'upper' },
  ruecken: { pats: ['hpull'], region: 'upper' },
  schultern: { pats: ['sideDelt'], region: 'upper' },
  arme: { pats: ['biceps', 'triceps'], region: 'upper' },
  beine: { pats: ['quadIso'], region: 'lower' },
  po: { pats: ['glute'], region: 'lower' },
  bauch: { pats: ['core'], region: 'any' },
};

function equipOK(x, equip) {
  if (x.flags.includes('bar') && equip === 'home') return false;
  if (x.kind === 'cardio') return equip === 'home' ? x.id === 'c_walk' : x.id !== 'c_walk';
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

/* name/note werden in der aktuellen Sprache als Rückfall gespeichert;
   angezeigt wird über ref immer die gewählte Sprache. */
function makeEx(x, sets, repMin, repMax, rest, role, p) {
  return {
    id: uid(), ref: x.id, name: t(`ex.${x.id}.name`), kind: x.kind, single: x.single, role,
    sets, repMin, repMax, targetReps: repMin, weight: estimateWeight(x, p, repMin),
    inc: x.inc, rest, note: t(`ex.${x.id}.cue`), fails: 0,
  };
}
function makeCardio(id, minutes) {
  return { id: uid(), ref: id, kind: 'cardio', name: t(`ex.${id}.name`), duration: minutes, note: t(`ex.${id}.cue`) };
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
  const dayDefs = keys.map(k => ({ tpl: T[k].tpl, slots: T[k].slots.map(([pat, role]) => ({ pat, role, extra: 0 })) }));
  applyFocus(dayDefs, p.focus);

  const scheme = SCHEME[p.goal];
  const cardioMin = p.cardio ? CARDIO_MIN[p.goal] : 0;
  const tplCount = {}, seen = {};
  dayDefs.forEach(d => { tplCount[d.tpl] = (tplCount[d.tpl] || 0) + 1; });
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
    if (cardioMin) exercises.push(makeCardio(cardioList[i % cardioList.length], cardioMin));
    seen[d.tpl] = (seen[d.tpl] || 0) + 1;
    const suffix = tplCount[d.tpl] > 1 ? String.fromCharCode(64 + seen[d.tpl]) : '';
    return {
      id: String.fromCharCode(65 + i), tpl: d.tpl, suffix,
      name: t(`day.${d.tpl}`) + (suffix ? ' ' + suffix : ''),
      exercises,
    };
  });
}

function planReason(p) {
  const freq = { fb: p.days, ul: 2, ulppl: 2, ppl: p.days >= 6 ? 2 : 1 }[p.split];
  return t('reason.base', { split: t(`split.${p.split}.label`), days: p.days, freq }) + ' ' + t(`reason.${p.goal}`);
}
