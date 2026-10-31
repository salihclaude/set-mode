'use strict';

/* =========================================================
   SET Mode – Oberfläche und Trainingslogik
   Übungsdatenbank und Plan-Generator: data.js
   Texte: i18n.js + lang/*.js · Animationen: anim.js
   Alle Daten liegen lokal im Browser (localStorage).
   ========================================================= */

// Schlüssel bleibt aus Kompatibilität mit bestehenden Daten unverändert
const STORE_KEY = 'fitplan.v1';
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const GOAL_ICON = { fett: 'flame', muskel: 'dumbbell', kraft: 'bolt', fitness: 'heart' };
const EXP_ICON = { beginner: 'sprout', inter: 'trend', adv: 'trophy' };
const EQUIP_ICON = { gym: 'building', machines: 'sliders', home: 'house' };
const LIMIT_ICON = { ruecken: 'spine', schulter: 'user', knie: 'knee' };

/* ---------- Icons ---------- */

const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const P = d => `<path d="${d}"/>`;
const I = {
  dumbbell: svg(P('M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11')),
  hist: svg(P('M3 3v18h18') + P('m7 15 4-4 3 3 5-6')),
  plan: svg('<rect x="4" y="3" width="16" height="18" rx="3"/>' + P('M8 8h8M8 12h8M8 16h5')),
  check: svg(P('m5 12.5 4.5 4.5L19 7.5')),
  chevL: svg(P('m15 18-6-6 6-6')),
  chevR: svg(P('m9 18 6-6-6-6')),
  x: svg(P('M6 6l12 12M18 6 6 18')),
  plus: svg(P('M12 5v14M5 12h14')),
  flame: svg(P('M12 21c-3.9 0-7-2.7-7-6.6 0-3 2-5 3.4-6.4.3 2 1.4 3 2.6 3 0-3 1-6 4-8 0 3 4 5.6 4 10.4 0 4.3-3.1 7.6-7 7.6z')),
  bolt: svg(P('M13 2 4 14h7l-1 8 9-12h-7z')),
  heart: svg(P('M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z')),
  sprout: svg(P('M12 21v-9M12 12C12 8 9 6 5 6c0 4 3 6 7 6zM12 14c0-4 3-6 7-6 0 4-3 6-7 6z')),
  trend: svg(P('M3 17l6-6 4 4 8-8M15 7h6v6')),
  trophy: svg(P('M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4')),
  clock: svg('<circle cx="12" cy="12" r="9"/>' + P('M12 7v5l3 2')),
  building: svg(P('M4 21V6l8-3 8 3v15M9 21v-5h6v5M8 9h1M15 9h1M8 13h1M15 13h1')),
  house: svg(P('M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6')),
  sliders: svg(P('M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1') + '<circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  pulse: svg(P('M3 12h4l2-5 4 10 2-5h6')),
  spine: svg(P('M12 2v20M9 5h6M8 9h8M9 13h6M8 17h8')),
  user: svg('<circle cx="12" cy="8" r="4"/>' + P('M4 21c0-4 4-6 8-6s8 2 8 6')),
  knee: svg(P('M9 2v7c0 2 1 3 3 4s3 3 2 6l-1 3M15 2v6')),
  spark: svg(P('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z')),
  timer: svg('<circle cx="12" cy="13" r="8"/>' + P('M12 9v4l2 2M9 2h6')),
  grid: svg('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/>' + P('M12 11v5M12 8h.01')),
  up: svg(P('m6 15 6-6 6 6')),
  down: svg(P('m6 9 6 6 6-6')),
  arrowUp: svg(P('M12 19V5M5 12l7-7 7 7')),
  arrowDown: svg(P('M12 5v14M19 12l-7 7-7-7')),
  equal: svg(P('M5 9h14M5 15h14')),
  minus: svg(P('M5 12h14')),
  repeat: svg(P('M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3')),
  edit: svg(P('M4 20h4L19 9l-4-4L4 16v4z')),
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
  film: svg('<rect x="3" y="5" width="18" height="14" rx="3"/>' + P('M10 9.5v5l4-2.5z')),
  lungs: svg(P('M12 4v7M12 11c-2 0-3 1-3 3M12 11c2 0 3 1 3 3M8.5 7C5 7 3 12 3 16c0 2 1 3 3 3 2.5 0 3-2 3-5V9.5M15.5 7C19 7 21 12 21 16c0 2-1 3-3 3-2.5 0-3-2-3-5V9.5')),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  alert: svg(P('M12 3 2 20h20zM12 10v4M12 17h.01')),
  globe: svg('<circle cx="12" cy="12" r="9"/>' + P('M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18')),
};
/* Markenzeichen: Schalter „an“ – SET Mode */
const LOGO = '<svg viewBox="0 0 48 28" aria-hidden="true"><rect x="1" y="1" width="46" height="26" rx="13" fill="currentColor"/><circle cx="33" cy="14" r="9" fill="#0b0d05"/></svg>';
const WORDMARK = `<span class="wordmark">${LOGO}<span><b>SET</b> Mode</span></span>`;

/* ---------- Zustand ---------- */

function defaultSettings() { return { barWeight: 20, deloadWeeks: 6, sessionsPerWeek: 3, restTimer: true, lang: null }; }
function defaultState() {
  return {
    version: 3, setupDone: false, profile: null, plan: [], nextDay: 0,
    settings: defaultSettings(), deload: { remaining: 0, sessionsSince: 0 },
    history: [], bodyweight: [], active: null,
  };
}

/* Alte, deutsch gespeicherte Namen → Übungs-ID (für Übersetzung bestehender Pläne) */
const LEGACY_REF = {
  'Seitheben|dumbbell': 'lat_raise', 'Schrägbankdrücken|dumbbell': 'incl_db', 'Schulterdrücken sitzend|dumbbell': 'ohp_db',
  'Bizeps-Curls|dumbbell': 'curl_db', 'Kabelrudern eng|cable': 'row_c', 'Wadenheben|machine': 'calf_m',
  'Laufband – Steigung gehen|cardio': 'c_tread', 'Crosstrainer|cardio': 'c_cross', 'Fahrrad-Ergometer|cardio': 'c_bike',
  'Zügiges Gehen oder Radfahren|cardio': 'c_walk',
};
const LEGACY_DAY = { 'Ganzkörper': 'fb', 'Oberkörper': 'up', 'Unterkörper': 'lo', 'Push': 'push', 'Pull': 'pull', 'Beine': 'legs' };

function deName(ref) { return I18N.dicts.de?.ex?.[ref]?.name; }
function matchRef(e) {
  if (!e || !e.name) return null;
  const legacy = LEGACY_REF[`${e.name}|${e.kind}`];
  if (legacy) return legacy;
  const x = EX.find(x => x.kind === e.kind && deName(x.id) === e.name);
  return x ? x.id : null;
}
function parseDay(name) {
  const m = /^(Ganzkörper|Oberkörper|Unterkörper|Push|Pull|Beine)(?: ([A-F]))?$/.exec(name || '');
  return m ? { tpl: LEGACY_DAY[m[1]], suffix: m[2] || '' } : null;
}

/* v1/v2 → v3: Übungs-IDs und Tagesvorlagen ergänzen, eigene Namen markieren */
function upgradeToV3(st) {
  for (const d of st.plan || []) {
    if (!d.tpl) { const pd = parseDay(d.name); if (pd) Object.assign(d, pd); }
    for (const e of d.exercises || []) {
      const had = !!e.ref;
      const ref = e.ref || matchRef(e);
      if (!ref) { e.customName = true; continue; }
      e.ref = ref;
      const de = I18N.dicts.de.ex[ref];
      const isDefaultName = e.name === de.name || LEGACY_REF[`${e.name}|${e.kind}`] === ref;
      e.customName = !isDefaultName;
      e.customNote = had ? !!e.note && e.note !== de.cue : false;
      delete e.muscles;
    }
  }
}

function migrate(s) {
  const st = Object.assign(defaultState(), s);
  st.settings = Object.assign(defaultSettings(), s.settings);
  if (!s.version || s.version < 2) st.settings.restTimer = false; // in v1 bewusst ohne Timer gewählt
  if (!s.version || s.version < 3) upgradeToV3(st);
  st.version = 3;
  if (!st.settings.lang || !I18N.has(st.settings.lang)) st.settings.lang = I18N.detect();
  return st;
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* leer oder blockiert */ }
  const st = defaultState();
  st.settings.lang = I18N.detect();
  return st;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast(t('toast.saveFail')); }
}

let state = load();
I18N.set(state.settings.lang);
const ui = {
  tab: 'home', wiz: null, wizDir: 'f', draft: null, planDay: 0, open: null, modal: null,
  summary: null, histEx: null, fatigue: null, rest: null, anim: {}, lastTab: null, lastModal: null,
};

/* ---------- Helfer ---------- */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmt(n) {
  if (n == null || isNaN(n)) return '–';
  return Number(n).toLocaleString(I18N.locale(), { maximumFractionDigits: 2 });
}
function fmtVol(v) { return v >= 1000 ? `${fmt(Math.round(v / 100) / 10)} t` : `${fmt(Math.round(v))} kg`; }
function num(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmtDate(iso, opts = { weekday: 'short', day: '2-digit', month: '2-digit' }) {
  return new Date(iso).toLocaleDateString(I18N.locale(), opts);
}
function daysAgo(iso) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(iso); b.setHours(0, 0, 0, 0);
  const d = Math.round((a - b) / 864e5);
  return d === 0 ? t('common.today') : d === 1 ? t('common.yesterday') : t('common.daysAgo', { n: d });
}
function mmss(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function unitFor(e) {
  if (e.kind === 'bodyweight') return t('common.kgExtra');
  return e.kind === 'dumbbell' && !e.single ? t('common.kgPerHand') : t('common.kg');
}

/* Anzeige-Texte: über die Übungs-ID immer in der aktuellen Sprache,
   außer der Nutzer hat selbst einen Namen bzw. Hinweis vergeben. */
function exName(e) {
  if (!e) return '';
  if (!e.customName && e.ref) { const n = tOpt(`ex.${e.ref}.name`); if (n) return n; }
  return e.name || '';
}
function exNote(e) {
  if (!e) return '';
  if (!e.customNote && e.ref) { const n = tOpt(`ex.${e.ref}.cue`); if (n) return n; }
  return e.note || '';
}
function exMuscleKeys(ref) { return EX_BY_ID[ref]?.muscles || []; }
function musclesText(ref) { return exMuscleKeys(ref).map(m => t(`muscle.${m}`)).join(' · '); }
function dayLabel(d) {
  if (!d) return '';
  if (d.tpl) return t(`day.${d.tpl}`) + (d.suffix ? ' ' + d.suffix : '');
  return d.name || '';
}
/* Verlaufseinträge: Tagesname und Übungsnamen auch für alte Einträge übersetzen */
function entryDayLabel(h) {
  if (h.dayTpl) return t(`day.${h.dayTpl}`) + (h.daySuffix ? ' ' + h.daySuffix : '');
  const pd = parseDay(h.dayName);
  return pd ? dayLabel(pd) : h.dayName;
}
function itemName(it) {
  const e = findEx(it.exId);
  if (e) return exName(e);
  const ref = it.ref || matchRef(it);
  return (ref && tOpt(`ex.${ref}.name`)) || it.name;
}

function findEx(id) {
  for (const d of state.plan) for (const e of d.exercises) if (e.id === id) return e;
  return null;
}
function allExercises() {
  const out = [];
  for (const d of state.plan) for (const e of d.exercises) if (e.kind !== 'cardio') out.push({ ...e, dayId: d.id });
  return out;
}
function platesFor(w) {
  const bar = state.settings.barWeight;
  if (w == null) return '';
  let per = (w - bar) / 2;
  if (per < 0) return esc(t('plates.lighter', { bar: fmt(bar) }));
  if (per === 0) return esc(t('plates.empty'));
  const out = [];
  for (const p of PLATES) while (per >= p - 1e-9) { out.push(p); per = +(per - p).toFixed(3); }
  return `${esc(t('plates.perSide'))} <b>${out.map(fmt).join(' + ')}</b>${per > 0.01 ? esc(t('plates.missing', { x: fmt(per) })) : ''}`;
}
function vibrate(p = 15) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }
function dayMinutes(day) {
  return Math.round((day.exercises.reduce((s, e) => s + exSeconds(e), 0) + 300) / 60 / 5) * 5;
}
function dayMuscles(day) {
  const keys = [];
  for (const e of day.exercises) {
    if (e.kind === 'cardio' || !e.ref) continue;
    for (const m of exMuscleKeys(e.ref)) if (!keys.includes(m)) keys.push(m);
  }
  return keys.slice(0, 5).map(m => t(`muscle.${m}`));
}
function entryVolume(h) {
  return h.items.reduce((s, it) => s + (it.reps?.length ? (it.weight || 0) * it.reps.reduce((a, b) => a + b, 0) : 0), 0);
}
function weekStart(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function sessionsBetween(start, days = 7) {
  const end = new Date(start); end.setDate(end.getDate() + days);
  return state.history.filter(h => { const tm = new Date(h.date); return tm >= start && tm < end; });
}
function weekStats() {
  const mon = weekStart(new Date());
  const days = [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const trained = new Set(state.history.map(h => new Date(h.date).toDateString()));
  const thisWeek = sessionsBetween(mon);
  const target = state.settings.sessionsPerWeek;
  let streak = thisWeek.length >= target ? 1 : 0;
  const ws = new Date(mon); ws.setDate(ws.getDate() - 7);
  while (streak < 520 && sessionsBetween(ws).length >= target) { streak++; ws.setDate(ws.getDate() - 7); }
  return { days, trained, count: thisWeek.length, volume: thisWeek.reduce((s, h) => s + entryVolume(h), 0), streak, target };
}
function lastTime(exId) {
  for (let i = state.history.length - 1; i >= 0; i--) {
    const it = state.history[i].items.find(x => x.exId === exId && x.reps?.length);
    if (it) return { ...it, date: state.history[i].date };
  }
  return null;
}
function isDeload() { return state.deload.remaining > 0; }

/* ---------- Fragebogen ---------- */

const WIZ_STEPS = ['welcome', 'goal', 'exp', 'days', 'split', 'minutes', 'equip', 'cardio', 'limits', 'focus', 'about', 'timer'];
function wizSteps(p) { return WIZ_STEPS.filter(s => s !== 'split' || (p.days && splitOptions(p.days).length > 1)); }
function newWizard(prev) {
  const p = prev ? JSON.parse(JSON.stringify(prev)) : {
    goal: null, exp: null, days: null, split: null, minutes: null, equip: null, cardio: null,
    limits: [], focus: [], name: '', sex: null, bw: null, restTimer: null,
  };
  return { i: prev ? 1 : 0, p, editing: !!prev };
}
function parseVal(v) { return v === 'true' ? true : v === 'false' ? false : v !== '' && isFinite(+v) ? +v : v; }

let wizTimer;
function wizNext() {
  const w = ui.wiz;
  if (w.i >= wizSteps(w.p).length - 1) return generatePlan();
  w.i++; ui.wizDir = 'f';
  render(); window.scrollTo(0, 0);
}
function generatePlan() {
  ui.tab = 'generating';
  render(); window.scrollTo(0, 0);
  setTimeout(() => {
    ui.draft = buildPlan(ui.wiz.p);
    ui.tab = 'preview';
    render(); window.scrollTo(0, 0);
  }, 1700);
}

/* Flaggen als SVG (Emoji-Flaggen fehlen z. B. unter Windows); neue Sprachen fallen auf das Emoji zurück */
const FLAGS = {
  de: '<rect width="30" height="20" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#dd0000"/><rect y="13.33" width="30" height="6.67" fill="#ffce00"/>',
  en: '<rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/>',
  es: '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>',
  tr: '<rect width="30" height="20" fill="#e30a17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.3" cy="10" r="4" fill="#e30a17"/><path d="M16.2 10l3.8-1.3-2.3 3.2V8.1l2.3 3.2z" fill="#fff"/>',
};
function flag(code) {
  return FLAGS[code] ? `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">${FLAGS[code]}</svg>` : `<span class="flag">${I18N.meta[code].flag}</span>`;
}
function langPicker(compact) {
  return `<div class="langs ${compact ? 'compact' : ''}" role="group" aria-label="${esc(t('plan.language'))}">${I18N.order.map(c =>
    `<button class="${c === I18N.lang ? 'on' : ''}" data-a="setLang" data-v="${c}" lang="${c}" aria-label="${esc(I18N.meta[c].name)}">${flag(c)}<span>${compact ? c.toUpperCase() : esc(I18N.meta[c].name)}</span></button>`).join('')}</div>`;
}

function viewWelcome() {
  const f = (icon, tt, s) => `<li><span>${I[icon]}</span><span><b>${esc(tt)}</b><small>${esc(s)}</small></span></li>`;
  return `<div class="welcome">
    <div class="welcome-top">${WORDMARK}${langPicker(true)}</div>
    <div class="welcome-logo">${LOGO}</div>
    <h1>${esc(t('welcome.title1'))}<br><span class="ac">${esc(t('welcome.title2'))}</span></h1>
    <p class="lead">${esc(t('welcome.lead'))}</p>
    <ul class="feat">
      ${f('grid', t('welcome.f1t'), t('welcome.f1s'))}
      ${f('trend', t('welcome.f2t'), t('welcome.f2s'))}
      ${f('film', t('welcome.f3t'), t('welcome.f3s'))}
    </ul>
    <button class="btn primary" data-a="wizStart">${esc(t('welcome.start'))} ${I.chevR}</button>
  </div>`;
}

function viewWizard() {
  const w = ui.wiz, p = w.p, steps = wizSteps(p), id = steps[w.i];
  if (id === 'welcome') return viewWelcome();
  const total = steps.length - 1;
  const head = (tt, s) => `<h1>${esc(tt)}</h1><p class="lead">${esc(s)}</p>`;
  const opt = (k, v, o, on, multi) => `<button class="opt ${on ? 'on' : ''}" data-a="${multi ? 'wizToggle' : 'wizPick'}" data-k="${k}" data-v="${v}">
    <span class="opt-ic">${I[o.icon] || ''}</span>
    <span class="opt-t"><b>${esc(o.label)}${o.badge ? `<em>${esc(o.badge)}</em>` : ''}</b><span>${esc(o.desc)}</span></span>
    <span class="opt-dot">${I.check}</span></button>`;
  const opts = (k, keys, icons, prefix) => `<div class="opts">${keys.map(v => opt(k, v, { icon: icons[v], label: t(`${prefix}.${v}.label`), desc: t(`${prefix}.${v}.desc`) }, p[k] === v)).join('')}</div>`;
  const next = (label = t('common.next'), a = 'wizNext') => `<button class="btn primary" id="wizNextBtn" data-a="${a}">${esc(label)}</button>`;
  let body = '', foot = '';

  switch (id) {
    case 'goal':
      body = head(t('wiz.goal.title'), t('wiz.goal.sub')) + opts('goal', Object.keys(GOAL_ICON), GOAL_ICON, 'goal');
      break;
    case 'exp':
      body = head(t('wiz.exp.title'), t('wiz.exp.sub')) + opts('exp', Object.keys(EXP_ICON), EXP_ICON, 'exp');
      break;
    case 'days':
      body = head(t('wiz.days.title'), t('wiz.days.sub')) +
        `<div class="tiles">${[2, 3, 4, 5, 6].map(d => `<button class="tile ${p.days === d ? 'on' : ''}" data-a="wizPick" data-k="days" data-v="${d}"><b>${d}×</b><span>${esc(t(`dayHint.${d}`))}</span></button>`).join('')}</div>`;
      break;
    case 'split':
      body = head(t('wiz.split.title'), t('wiz.split.sub', { days: p.days })) +
        `<div class="opts">${splitOptions(p.days).map((k, i) => opt('split', k, { icon: 'grid', label: t(`split.${k}.label`), desc: t(`split.${k}.desc`), badge: i === 0 ? t('wiz.recommended') : '' }, p.split === k)).join('')}</div>`;
      break;
    case 'minutes':
      body = head(t('wiz.minutes.title'), t('wiz.minutes.sub')) +
        `<div class="tiles">${[45, 60, 75, 90].map(m => `<button class="tile ${p.minutes === m ? 'on' : ''}" data-a="wizPick" data-k="minutes" data-v="${m}"><b>${m}<small>${esc(t('common.min'))}</small></b><span>${esc(t(`minHint.${m}`))}</span></button>`).join('')}</div>`;
      break;
    case 'equip':
      body = head(t('wiz.equip.title'), t('wiz.equip.sub')) + opts('equip', Object.keys(EQUIP_ICON), EQUIP_ICON, 'equip');
      break;
    case 'cardio':
      body = head(t('wiz.cardio.title'), t('wiz.cardio.sub')) +
        `<div class="opts">${opt('cardio', true, { icon: 'pulse', label: t('wiz.cardio.yes'), desc: t('wiz.cardio.yesDesc', { min: CARDIO_MIN[p.goal || 'fett'] }) }, p.cardio === true)}
        ${opt('cardio', false, { icon: 'x', label: t('wiz.cardio.no'), desc: t('wiz.cardio.noDesc') }, p.cardio === false)}</div>`;
      break;
    case 'limits':
      body = head(t('wiz.limits.title'), t('wiz.limits.sub')) +
        `<div class="opts multi">${opt('limits', 'none', { icon: 'check', label: t('limit.none.label'), desc: t('limit.none.desc') }, !p.limits.length, true)}
        ${Object.keys(LIMIT_ICON).map(v => opt('limits', v, { icon: LIMIT_ICON[v], label: t(`limit.${v}.label`), desc: t(`limit.${v}.desc`) }, p.limits.includes(v), true)).join('')}</div>`;
      foot = next();
      break;
    case 'focus':
      body = head(t('wiz.focus.title'), t('wiz.focus.sub')) +
        `<div class="chipgrid opts">${Object.keys(FOCUS).map(v => `<button class="opt-chip ${p.focus.includes(v) ? 'on' : ''}" data-a="wizToggle" data-k="focus" data-v="${v}">${esc(t(`focus.${v}`))}</button>`).join('')}</div>`;
      foot = next(p.focus.length ? t('common.next') : t('common.skip'));
      break;
    case 'about':
      body = head(t('wiz.about.title'), t('wiz.about.sub')) + `
        <label class="f"><span>${esc(t('wiz.about.name'))}</span><input class="in" id="w-name" value="${esc(p.name)}" autocomplete="given-name" placeholder="${esc(t('wiz.about.namePh'))}"></label>
        <label class="f"><span>${esc(t('wiz.about.sex'))}</span></label>
        <div class="seg" style="margin:-6px 0 14px">${['m', 'f', 'd'].map(v => `<button class="${p.sex === v ? 'on' : ''}" data-a="wizSex" data-v="${v}">${esc(t(`wiz.about.${v}`))}</button>`).join('')}</div>
        <label class="f"><span>${esc(t('wiz.about.bw'))}</span><div class="inwrap"><input class="in big" id="w-bw" inputmode="decimal" value="${p.bw ? fmt(p.bw) : ''}" placeholder="80"><span class="u">kg</span></div></label>
        <p class="dim small">${esc(t('wiz.about.bwHint'))}</p>`;
      foot = next(t('common.next'), 'wizAbout');
      break;
    case 'timer':
      body = head(t('wiz.timer.title'), t('wiz.timer.sub')) +
        `<div class="opts">${opt('restTimer', true, { icon: 'timer', label: t('wiz.timer.yes'), desc: t('wiz.timer.yesDesc') }, p.restTimer === true)}
        ${opt('restTimer', false, { icon: 'x', label: t('wiz.timer.no'), desc: t('wiz.timer.noDesc') }, p.restTimer === false)}</div>`;
      break;
  }
  const key = { goal: 'goal', exp: 'exp', days: 'days', split: 'split', minutes: 'minutes', equip: 'equip', cardio: 'cardio', timer: 'restTimer' }[id];
  if (key && p[key] != null) foot = next(w.i === steps.length - 1 ? t('wiz.create') : t('common.next'));
  const from = Math.max(0, ui.wizDir === 'b' ? w.i + 1 : w.i - 1) / total * 100;
  return `<div class="wiz">
    <div class="wiz-top"><button class="icon-btn" data-a="wizBack" aria-label="${esc(t('common.back'))}">${I.chevL}</button>
    <div class="wiz-prog"><i style="width:${from}%" data-to="${w.i / total * 100}%"></i></div><span class="wiz-count">${w.i}/${total}</span></div>
    <div class="wiz-body ${ui.wizDir === 'b' ? 'back' : ''}">${body}</div>
    <div class="wiz-foot">${foot}</div></div>`;
}

function viewGenerating() {
  const li = (tt, d) => `<li style="--d:${d}s">${I.check}${esc(tt)}</li>`;
  return `<div class="gen"><div class="gen-orb">${I.spark}</div><h1>${esc(t('gen.title'))}</h1>
    <ul class="gen-list">${li(t('gen.s1'), 0.2)}${li(t('gen.s2'), 0.6)}${li(t('gen.s3'), 1)}</ul></div>`;
}

function exRow(e, opts = {}) {
  const val = e.kind === 'cardio' ? `<b>${e.duration} ${esc(t('common.min'))}</b>` : opts.val || `<b>${e.sets}</b> × ${e.repMin}–${e.repMax}`;
  const sub = opts.sub === false ? '' : `<small>${esc(e.kind === 'cardio' ? t('kind.cardio') : musclesText(e.ref))}</small>`;
  return `<li><button class="ex-link" data-a="info" data-id="${e.id}" aria-label="${esc(t('wo.explain'))}: ${esc(exName(e))}"><span class="name">${esc(exName(e))}${sub}</span><span class="val">${val}</span><span class="i-dot">${I.info}</span></button></li>`;
}

function viewPreview() {
  const p = ui.wiz.p, plan = ui.draft;
  const tags = [t(`goal.${p.goal}.label`), t('preview.perWeek', { n: p.days }), t('preview.approxMin', { n: p.minutes }), t(`equip.${p.equip}.label`),
    ...p.limits.map(l => t('preview.spares', { x: t(`limit.${l}.label`) })), ...p.focus.map(f => t('preview.focusTag', { x: t(`focus.${f}`) }))];
  let h = `<div class="eyebrow ac">${esc(p.name ? t('preview.eyebrowName', { name: p.name }) : t('preview.eyebrow'))}</div><h1>${esc(t('preview.title'))}</h1>
    <p class="lead">${esc(planReason(p))}</p>
    <div class="tags" style="margin:-4px 0 18px">${tags.map((tg, i) => `<span class="tag ${i === 0 ? 'ac' : ''}">${esc(tg)}</span>`).join('')}</div>`;
  for (const d of plan) {
    const n = d.exercises.filter(e => e.kind !== 'cardio').length;
    h += `<div class="card"><div class="hero-top"><div class="badge sm">${d.id}</div>
      <div style="flex:1;min-width:0"><b style="font-size:17px">${esc(dayLabel(d))}</b>
      <div class="meta"><span>${I.dumbbell}${esc(t('preview.exercises', { n }))}</span><span>${I.clock}${esc(t('preview.approxMin', { n: dayMinutes(d) }))}</span></div></div></div>
      <ul class="ex-list">${d.exercises.map(e => exRow(e)).join('')}</ul></div>`;
  }
  if (p.goal === 'fett') h += `<div class="card notice"><span class="ic">${I.info}</span><div><b>${esc(t('preview.nutritionTitle'))}</b><p>${esc(t('preview.nutrition'))}</p></div></div>`;
  if (state.history.length) h += `<p class="dim small" style="text-align:center">${esc(t('preview.historyKept'))}</p>`;
  h += `<div class="stack" style="margin-top:16px"><button class="btn primary" data-a="acceptPlan">${esc(t('preview.accept'))} ${I.check}</button>
    <button class="btn ghost" data-a="wizRestart">${esc(t('preview.change'))}</button></div>`;
  return h;
}

function viewSetup() {
  const est = !!state.profile?.bw;
  let h = `<div class="eyebrow">${esc(t('setup.eyebrow'))}</div><h1>${esc(t('setup.title'))}</h1>
    <p class="lead">${est ? t('setup.leadEst') : ''}${t('setup.lead')}</p>`;
  for (const d of state.plan) {
    h += `<h2>${esc(d.id)} · ${esc(dayLabel(d))}</h2><div class="card tight">`;
    for (const e of d.exercises) {
      if (e.kind === 'cardio') continue;
      h += `<div class="setup-row"><div class="t"><b>${esc(exName(e))}</b><span>${e.sets} × ${e.repMin}–${e.repMax} · ${esc(unitFor(e))}</span></div>
        <div class="inwrap"><input class="in" inputmode="decimal" placeholder="?" value="${e.weight == null ? '' : fmt(e.weight)}" data-c="setupW" data-id="${e.id}"><span class="u">kg</span></div></div>`;
    }
    h += `</div>`;
  }
  h += `<div style="height:10px"></div><button class="btn primary" data-a="setupDone">${esc(t('setup.save'))} ${I.chevR}</button>
    <p class="dim small" style="text-align:center">${esc(t('setup.hint'))}</p>`;
  return h;
}

/* ---------- Training ---------- */

function startWorkout(dayIdx) {
  const day = state.plan[dayIdx];
  const deload = isDeload();
  state.active = {
    dayIdx, dayId: day.id, dayName: day.name, dayTpl: day.tpl || null, daySuffix: day.suffix || '', deload,
    startedAt: new Date().toISOString(),
    items: day.exercises.map(e => {
      if (e.kind === 'cardio') return { exId: e.id, ref: e.ref, kind: 'cardio', name: e.name, duration: e.duration, note: e.note, done: [false] };
      const sets = deload ? Math.max(2, e.sets - 1) : e.sets;
      const weight = e.weight == null ? null : deload ? roundTo(e.weight * 0.85, e.inc) : e.weight;
      return {
        exId: e.id, ref: e.ref, kind: e.kind, single: e.single, name: e.name, note: e.note, rest: e.rest, inc: e.inc,
        repMin: e.repMin, repMax: e.repMax, targetReps: e.targetReps,
        sets, weight, reps: Array(sets).fill(e.targetReps), done: Array(sets).fill(false), rating: null,
      };
    }),
  };
  ui.open = null; ui.rest = null;
  ui.tab = 'workout';
  save(); keepAwake(true);
  render(); window.scrollTo(0, 0);
}

function itemComplete(it) {
  if (it.kind === 'cardio') return it.done[0];
  return it.done.every(Boolean) && !!it.rating;
}
/* Aktive Einträge: Name/Hinweis über die Planübung, damit eigene Namen und Sprache stimmen */
function itemLabel(it) { const e = findEx(it.exId); return e ? exName(e) : (it.ref && tOpt(`ex.${it.ref}.name`)) || it.name; }
function itemNote(it) { const e = findEx(it.exId); return e ? exNote(e) : (it.ref && tOpt(`ex.${it.ref}.cue`)) || it.note; }

/*  Progressionslogik (doppelte Progression + Gefühl + Erschöpfung)
    - Alle Sätze im Ziel → erst Wiederholungen steigern, am oberen Ende Gewicht +inc
    - "Leicht" + wenig erschöpft → größere Sprünge
    - "Sehr schwer" oder komplett platt → halten
    - Unter dem Wdh.-Bereich → nochmal; beim 2. Mal in Folge −10 %
    Ergebnis enthält einen Textschlüssel (key/params), damit es in jeder Sprache lesbar ist. */
function progress(e, it, fatigue, deload) {
  const before = { weight: e.weight, reps: e.targetReps };
  const doneReps = it.reps.filter((_, i) => it.done[i]);
  let type, key, params;

  if (doneReps.length === 0) {
    return { type: 'skip', key: 'prog.skip', before, after: before };
  }
  // Gewicht, das tatsächlich bewegt wurde, gilt als Basis (außer im Deload)
  if (!deload && it.weight != null) e.weight = it.weight;
  if (deload) {
    if (e.weight == null && it.weight != null) e.weight = roundTo(it.weight / 0.85, e.inc);
    return { type: 'same', key: 'prog.deload', before, after: { weight: e.weight, reps: e.targetReps } };
  }

  // Ohne eingetragenes Gewicht nur Wiederholungen steigern
  const hasW = e.weight != null;
  const inc = hasW ? e.inc : 0;
  const w = e.weight ?? 0;
  const tr = it.targetReps;
  const missedSets = doneReps.length < it.sets;
  const minR = Math.min(...doneReps);
  const allHit = !missedSets && doneReps.every(r => r >= tr);
  let newW = w, newT = tr;

  if (missedSets || minR < e.repMin) {
    e.fails = (e.fails || 0) + 1;
    if (e.fails >= 2 && w > 0) {
      newW = roundTo(w * 0.9, e.inc); newT = e.repMin; e.fails = 0;
      type = 'down'; key = 'prog.down';
    } else {
      type = 'same'; key = 'prog.again';
    }
  } else {
    e.fails = 0;
    if (!allHit) {
      type = 'same'; key = 'prog.missed';
    } else if (it.rating === 'hard') {
      type = 'same'; key = 'prog.hard';
    } else if (fatigue >= 5) {
      type = 'same'; key = 'prog.tired';
    } else {
      const easy = it.rating === 'easy';
      const atTop = tr >= e.repMax || (easy && fatigue <= 3 && minR >= e.repMax);
      if (atTop && inc > 0) {
        const steps = easy && fatigue <= 2 ? 2 : 1;
        newW = roundTo(w + e.inc * steps, e.inc); newT = e.repMin;
        type = 'up'; key = 'prog.up'; params = { kg: e.inc * steps };
      } else if (atTop) {
        newT = e.repMax;
        type = 'same'; key = hasW ? 'prog.max' : 'prog.needW';
      } else {
        const add = easy && fatigue <= 3 ? 2 : 1;
        newT = Math.min(e.repMax, tr + add);
        type = 'up'; key = 'prog.reps'; params = { n: newT - tr };
      }
    }
  }
  e.weight = hasW ? newW : null; e.targetReps = newT;
  return { type, key, params, before: { weight: hasW ? w : null, reps: tr }, after: { weight: e.weight, reps: newT } };
}

function finishWorkout(fatigue) {
  const a = state.active;
  const changes = [];
  const entry = {
    id: uid(), date: new Date().toISOString(), dayId: a.dayId, dayName: a.dayName, dayTpl: a.dayTpl || null, daySuffix: a.daySuffix || '',
    deload: a.deload, fatigue,
    minutes: Math.max(1, Math.round((Date.now() - new Date(a.startedAt).getTime()) / 60000)),
    items: [],
  };
  let sets = 0;

  for (const it of a.items) {
    const e = findEx(it.exId);
    const name = itemLabel(it);
    if (it.kind === 'cardio') {
      entry.items.push({ exId: it.exId, ref: it.ref, kind: 'cardio', name, duration: it.duration, done: it.done[0] });
      continue;
    }
    const reps = it.reps.filter((_, i) => it.done[i]);
    sets += reps.length;
    // Neuer Rekord: schwerer als jemals zuvor (ohne Deload)
    const prev = state.history.filter(h => !h.deload).flatMap(h => h.items.filter(x => x.exId === it.exId && x.reps?.length).map(x => x.weight || 0));
    const pr = !a.deload && reps.length > 0 && prev.length > 0 && (it.weight || 0) > Math.max(...prev);
    entry.items.push({ exId: it.exId, ref: it.ref, kind: it.kind, name, weight: it.weight, targetReps: it.targetReps, reps, rating: it.rating });
    if (e) changes.push({ exId: it.exId, name, kind: it.kind, single: it.single, pr, ...progress(e, it, fatigue, a.deload) });
  }
  state.history.push(entry);

  // Deload-Steuerung
  let deloadMsg = null;
  if (a.deload) {
    state.deload.remaining = Math.max(0, state.deload.remaining - 1);
    if (state.deload.remaining === 0) deloadMsg = { key: 'deloadMsg.done' };
  } else {
    state.deload.sessionsSince++;
    const recent = state.history.filter(h => !h.deload).slice(-3);
    const avg = recent.reduce((s, h) => s + h.fatigue, 0) / recent.length;
    const limit = state.settings.deloadWeeks * state.settings.sessionsPerWeek;
    const n = Math.min(3, state.settings.sessionsPerWeek);
    if (recent.length === 3 && avg >= 4.3) {
      state.deload = { remaining: n, sessionsSince: 0 };
      deloadMsg = { key: 'deloadMsg.tired', params: { n } };
    } else if (state.deload.sessionsSince >= limit) {
      state.deload = { remaining: n, sessionsSince: 0 };
      deloadMsg = { key: 'deloadMsg.weeks', params: { w: state.settings.deloadWeeks, n } };
    }
  }

  state.nextDay = (a.dayIdx + 1) % state.plan.length;
  state.active = null;
  save(); keepAwake(false);
  ui.rest = null;
  ui.summary = { entry, changes, deloadMsg, sets, volume: entryVolume(entry) };
  ui.modal = null;
  ui.tab = 'summary';
  render(); window.scrollTo(0, 0);
}

/* ---------- Bildschirm anlassen ---------- */

let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release(); wakeLock = null;
    }
  } catch (e) { /* nicht unterstützt */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.active) keepAwake(true);
});

/* ---------- Pausen-Timer ---------- */

const $overlay = document.getElementById('overlay');
const RING = 2 * Math.PI * 20;
function startRest(sec) {
  if (!state.settings.restTimer || !sec) return;
  ui.rest = { end: Date.now() + sec * 1000, total: sec, fired: false };
  buildRest();
}
function buildRest() {
  if (!ui.rest || ui.tab !== 'workout') { $overlay.innerHTML = ''; return; }
  $overlay.innerHTML = `<div class="rest" id="rest">
    <svg class="ring" viewBox="0 0 48 48"><circle class="trk" cx="24" cy="24" r="20"/><circle class="arc" cx="24" cy="24" r="20" stroke-dasharray="${RING}" stroke-dashoffset="0"/></svg>
    <div class="rest-t"><span>${esc(t('rest.pause'))}</span><b class="num">0:00</b></div>
    <button data-a="restAdd" data-d="-15">−15</button><button data-a="restAdd" data-d="15">+15</button>
    <button data-a="restSkip" aria-label="${esc(t('rest.end'))}">${I.x}</button></div>`;
  tickRest();
}
function tickRest() {
  const r = ui.rest, el = document.getElementById('rest');
  if (!r || !el) return;
  const left = Math.max(0, Math.ceil((r.end - Date.now()) / 1000));
  el.querySelector('b').textContent = left ? mmss(left) : t('rest.go');
  el.querySelector('.rest-t span').textContent = left ? t('rest.pause') : t('rest.done');
  el.querySelector('.arc').style.strokeDashoffset = RING * (1 - left / r.total);
  el.classList.toggle('go', left === 0);
  if (left === 0 && !r.fired) {
    r.fired = true;
    vibrate([300, 120, 300, 120, 500]);
    setTimeout(() => { if (ui.rest === r) { ui.rest = null; buildRest(); } }, 4000);
  }
}
setInterval(tickRest, 250);

/* ---------- Rendering ---------- */

const $app = document.getElementById('app');

function render() {
  let html = '';
  const tb = ui.tab;
  if (tb === 'wizard' && ui.wiz) html = viewWizard();
  else if (tb === 'generating') html = viewGenerating();
  else if (tb === 'preview' && ui.draft) html = viewPreview();
  else if (tb === 'setup') html = viewSetup();
  else if (tb === 'workout' && state.active) html = viewWorkout();
  else if (tb === 'summary' && ui.summary) html = viewSummary();
  else if (tb === 'history') html = viewHistory();
  else if (tb === 'plan') html = viewPlan();
  else { ui.tab = 'home'; html = viewHome(); }

  const animView = ui.tab !== ui.lastTab && ui.tab !== 'wizard';
  ui.lastTab = ui.tab;
  const showNav = ['home', 'history', 'plan'].includes(ui.tab);
  $app.innerHTML = `<div class="${animView ? 'view' : ''}">${html}</div>` + (showNav ? viewNav() : '') + viewModal();
  ui.anim = {};

  // Fortschrittsbalken im Fragebogen weich animieren
  const bar = document.querySelector('.wiz-prog i');
  if (bar) requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = bar.dataset.to; }));

  // Erklär-Animation im geöffneten Fenster vorbereiten (startet erst auf Tippen)
  if (ui.modal?.type === 'info') {
    const host = document.getElementById('animHost');
    if (host && ANIM.has(ui.modal.ref)) ANIM.mount(host, ui.modal.ref);
  } else ANIM.stop();

  if (ui.tab !== 'workout' || !ui.rest) $overlay.innerHTML = '';
  else if (!document.getElementById('rest')) buildRest();
}

function viewNav() {
  const b = (tb, icon, label) => `<button data-a="tab" data-v="${tb}" class="${ui.tab === tb ? 'on' : ''}">${icon}<span>${esc(label)}</span></button>`;
  return `<nav class="nav">${b('home', I.dumbbell, t('nav.training'))}${b('history', I.hist, t('nav.history'))}${b('plan', I.plan, t('nav.plan'))}</nav>`;
}

function setLine(e, deload) {
  if (e.kind === 'cardio') return `<b>${e.duration} ${esc(t('common.min'))}</b>`;
  const sets = deload ? Math.max(2, e.sets - 1) : e.sets;
  const w = e.weight == null ? null : deload ? roundTo(e.weight * 0.85, e.inc) : e.weight;
  const wt = e.kind === 'bodyweight' && !w ? esc(t('common.bwShort')) : `${w == null ? '?' : fmt(w)} kg`;
  return `${sets} × ${e.targetReps} · <b>${wt}</b>`;
}

function viewHome() {
  if (!state.plan.length) { ui.wiz = newWizard(); ui.tab = 'wizard'; return viewWizard(); }
  const day = state.plan[state.nextDay] || state.plan[0];
  const deload = isDeload();
  const wk = weekStats();
  const now = new Date();
  const hr = now.getHours();
  const greet = hr < 11 ? t('home.morning') : hr < 18 ? t('home.day') : t('home.evening');
  const name = state.profile?.name;
  const last = state.history[state.history.length - 1];
  const missing = allExercises().filter(e => e.weight == null).length;
  const wd = t('weekdays');

  let h = `<div class="topbar">${WORDMARK}</div>
    <div class="eyebrow">${esc(now.toLocaleDateString(I18N.locale(), { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
    <h1>${esc(greet)}${name ? ', ' + esc(name) : ''}</h1>
    <div class="week">${wk.days.map((d, i) => {
      const done = wk.trained.has(d.toDateString());
      return `<div class="wd ${done ? 'done' : ''} ${d.toDateString() === now.toDateString() ? 'today' : ''}">${esc(wd[i])}<i>${done ? I.check : d.getDate()}</i></div>`;
    }).join('')}</div>`;

  if (state.active) {
    const a = state.active;
    const done = a.items.filter(itemComplete).length;
    h += `<div class="card hero"><div class="hero-top"><div class="badge">${esc(a.dayId)}</div>
      <div style="flex:1;min-width:0"><span class="tag ac">${esc(t('home.running'))}</span><div class="hero-title" style="margin-top:6px">${esc(entryDayLabel(a))}</div>
      <div class="meta"><span>${esc(t('home.doneOf', { d: done, n: a.items.length }))}</span></div></div></div>
      <div class="bar" style="margin:16px 0"><i style="width:${done / a.items.length * 100}%"></i></div>
      <button class="btn primary" data-a="resume">${esc(t('home.resume'))} ${I.chevR}</button></div>`;
  } else {
    const strength = day.exercises.filter(e => e.kind !== 'cardio').length;
    h += `<div class="card hero">
      <div class="hero-top"><div class="badge">${esc(day.id)}</div>
        <div style="flex:1;min-width:0">
          <div class="eyebrow" style="margin:0">${deload ? `<span class="ac">${esc(t('home.deloadWeek'))}</span>` : esc(t('home.next'))}</div>
          <div class="hero-title">${esc(dayLabel(day))}</div>
          <div class="meta"><span>${I.dumbbell}${esc(t('preview.exercises', { n: strength }))}</span><span>${I.clock}${esc(t('preview.approxMin', { n: dayMinutes(day) }))}</span></div>
        </div></div>
      <div class="tags">${dayMuscles(day).map(m => `<span class="tag">${esc(m)}</span>`).join('')}</div>
      <ul class="ex-list">${day.exercises.map(e => exRow(e, { sub: false, val: setLine(e, deload) })).join('')}</ul>
      <div style="height:16px"></div>
      <button class="btn primary" data-a="start">${esc(t('home.start'))} ${I.chevR}</button>
      <div class="chips">${state.plan.map((d, i) => `<button class="chip ${i === state.nextDay ? 'on' : ''}" data-a="pickDay" data-v="${i}">${esc(d.id)}</button>`).join('')}</div>
    </div>`;
    if (deload) h += `<div class="card notice warn"><span class="ic">${I.info}</span><div><b>${esc(t('home.deloadTitle', { n: state.deload.remaining }))}</b><p>${esc(t('home.deloadText'))}</p></div></div>`;
  }

  if (missing) h += `<div class="card notice"><span class="ic">${I.edit}</span><div><b>${esc(t('home.missingTitle', { n: missing }))}</b><p>${esc(t('home.missingText'))}</p>
    <button class="btn sm" style="margin-top:10px" data-a="openSetup">${esc(t('home.missingBtn'))}</button></div></div>`;

  h += `<h2>${esc(t('home.thisWeek'))}</h2>
    <div class="card" style="padding:15px 16px"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
      <b>${esc(t('home.weekGoal'))}</b><span class="muted small num">${esc(t('home.sessionsOf', { c: wk.count, n: wk.target }))}</span></div>
      <div class="bar"><i style="width:${Math.min(100, wk.count / wk.target * 100)}%"></i></div></div>
    <div class="stat-row">
      <div class="stat"><b>${I.flame}${wk.streak}</b><span>${esc(t('home.streak'))}</span></div>
      <div class="stat"><b>${state.history.length}</b><span>${esc(t('home.sessions'))}</span></div>
      <div class="stat"><b>${wk.volume ? fmtVol(wk.volume).replace(' ', '&nbsp;') : '–'}</b><span>${esc(t('home.moved'))}</span></div>
    </div>`;

  if (last) {
    h += `<h2>${esc(t('home.last'))}</h2><div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
      <div><b>${esc(entryDayLabel(last))}</b><div class="muted small">${esc(fmtDate(last.date))} · ${last.minutes} ${esc(t('common.min'))}${last.deload ? ' · ' + esc(t('history.deload')) : ''}</div></div>
      <span class="tag">${esc(daysAgo(last.date))}</span></div></div>`;
  }
  return h;
}

function viewWorkout() {
  const a = state.active;
  const total = a.items.length;
  const done = a.items.filter(itemComplete).length;
  const openIdx = ui.open ?? a.items.findIndex(it => !itemComplete(it));
  const mins = Math.round((Date.now() - new Date(a.startedAt).getTime()) / 60000);

  let h = `<div class="wo-head"><div class="wo-head-row">
    <div><div class="wo-title">${esc(entryDayLabel(a))}${a.deload ? ` <span class="tag warn">${esc(t('history.deload'))}</span>` : ''}</div>
    <div class="muted small"><span id="elapsed">${mins}</span> ${esc(t('common.min'))} · ${esc(t('wo.doneOf', { d: done, n: total }))}</div></div>
    <button class="btn sm ghost" data-a="cancelWorkout">${esc(t('wo.cancel'))}</button></div>
    <div class="bar"><i style="width:${(done / total) * 100}%"></i></div></div>`;

  a.items.forEach((it, i) => {
    const complete = itemComplete(it);
    const open = i === openIdx;
    const summary = it.kind === 'cardio' ? `${it.duration} ${t('common.min')}` : `${it.sets} × ${it.targetReps} · ${it.weight == null ? '?' : fmt(it.weight)} ${unitFor(it)}`;
    h += `<div class="card ex-card ${complete ? 'done' : ''} ${open ? 'open' : ''}" id="item-${i}">
      <button class="ex-head" data-a="openItem" data-i="${i}">
        <span class="idx">${complete ? I.check : i + 1}</span>
        <span class="t"><b>${esc(itemLabel(it))}</b><span>${esc(summary)}</span></span>
        <span class="chev">${I.chevR}</span>
      </button>`;
    if (open) h += it.kind === 'cardio' ? cardioBody(it, i) : exBody(it, i);
    h += `</div>`;
  });

  h += `<div style="height:8px"></div><button class="btn ${done === total ? 'primary' : ''}" data-a="finish">${esc(t('wo.finish'))}</button>`;
  return h;
}

function explainBtn(it) {
  return `<button class="explain" data-a="info" data-id="${it.exId}">${I.film}<span>${esc(t('wo.explain'))}</span></button>`;
}

function exBody(it, i) {
  const allDone = it.done.every(Boolean);
  const nextSet = it.done.findIndex(d => !d);
  const lt = lastTime(it.exId);
  const note = itemNote(it);
  let h = `<div class="ex-body ${ui.anim.open === i ? 'anim' : ''}">
    <div class="ex-info"><span class="tag">${esc(t(`kind.${it.kind}`))}</span><span class="tag">${esc(t('wo.range', { a: it.repMin, b: it.repMax }))}</span><span class="tag">${esc(t('wo.rest', { t: restText(it.rest) }))}</span>${it.ref ? `<span class="tag">${esc(musclesText(it.ref))}</span>` : ''}</div>
    ${explainBtn(it)}
    ${note ? `<p class="ex-note">${esc(note)}</p>` : ''}
    ${lt ? `<div class="last">${I.clock}<span>${esc(t('wo.lastTime', { when: daysAgo(lt.date) }))} <b>${fmt(lt.weight)} kg × ${lt.reps.join(' · ')}</b></span></div>` : ''}
    <div class="weight-box">
      <button class="step" data-a="wStep" data-i="${i}" data-d="-1" aria-label="${esc(t('wo.lessW'))}">−</button>
      <div class="wv"><input inputmode="decimal" value="${it.weight == null ? '' : fmt(it.weight)}" placeholder="?" data-c="wInput" data-i="${i}" aria-label="${esc(t('wo.weight'))}"><span class="unit">${esc(unitFor(it))}</span></div>
      <button class="step" data-a="wStep" data-i="${i}" data-d="1" aria-label="${esc(t('wo.moreW'))}">+</button>
    </div>
    <div class="plates">${it.kind === 'barbell' ? platesFor(it.weight) : '&nbsp;'}</div>`;
  it.reps.forEach((r, s) => {
    h += `<div class="set-row ${it.done[s] ? 'is-done' : ''} ${s === nextSet ? 'next' : ''}">
      <span class="sn"><b>${s + 1}</b><small>${esc(t('common.set'))}</small></span>
      <span class="reps">
        <button class="step" data-a="rStep" data-i="${i}" data-s="${s}" data-d="-1" aria-label="${esc(t('wo.lessR'))}">−</button>
        <span class="v">${r}<small>${esc(t('common.reps'))}</small></span>
        <button class="step" data-a="rStep" data-i="${i}" data-s="${s}" data-d="1" aria-label="${esc(t('wo.moreR'))}">+</button>
      </span>
      <button class="check ${it.done[s] ? 'on' : ''} ${ui.anim.pop === `${i}-${s}` ? 'pop' : ''}" data-a="toggleSet" data-i="${i}" data-s="${s}" aria-label="${esc(t('wo.setDone', { n: s + 1 }))}">${I.check}</button>
    </div>`;
  });
  if (allDone) {
    const b = v => `<button class="${it.rating === v ? 'on' : ''}" data-a="rate" data-i="${i}" data-v="${v}">${esc(t(`wo.${v}`))}<small>${esc(t(`wo.${v}Sub`))}</small></button>`;
    h += `<div class="rate ${ui.anim.rate === i ? 'anim' : ''}"><p>${esc(t('wo.how'))}</p><div class="rate-btns">${b('easy')}${b('ok')}${b('hard')}</div></div>`;
  }
  return h + `</div>`;
}

function cardioBody(it, i) {
  const note = itemNote(it);
  return `<div class="ex-body ${ui.anim.open === i ? 'anim' : ''}">
    ${explainBtn(it)}
    ${note ? `<p class="ex-note">${esc(note)}</p>` : ''}
    <div class="cardio-box"><div style="flex:1"><div class="big">${it.duration} ${esc(t('common.min'))}</div><div class="muted small">${esc(itemLabel(it))}</div></div>
    <button class="check ${it.done[0] ? 'on' : ''}" data-a="toggleSet" data-i="${i}" data-s="0" aria-label="${esc(t('wo.cardioDone'))}">${I.check}</button></div>
  </div>`;
}

function restText(sec) {
  if (!sec) return '–';
  return sec < 60 ? `${sec} ${t('common.sec')}` : `${fmt(sec / 60)} ${t('common.min')}`;
}

function viewSummary() {
  const { entry, changes, deloadMsg, sets, volume } = ui.summary;
  const name = state.profile?.name;
  const prs = changes.filter(c => c.pr).length;
  let h = `<div class="trophy">${I.trophy}</div>
    <h1>${esc(name ? t('summary.titleName', { name }) : t('summary.title'))}</h1>
    <p class="lead">${esc(t('summary.done', { day: entryDayLabel(entry) }))}${prs ? esc(t('summary.withPR', { n: prs })) : ''}.</p>
    <div class="stat-row">
      <div class="stat"><b>${entry.minutes}</b><span>${esc(t('summary.minutes'))}</span></div>
      <div class="stat"><b>${sets}</b><span>${esc(t('summary.sets'))}</span></div>
      <div class="stat"><b>${volume ? fmtVol(volume).replace(' ', '&nbsp;') : '–'}</b><span>${esc(t('summary.moved'))}</span></div>
    </div>`;
  if (deloadMsg) h += `<div class="card notice warn"><span class="ic">${I.info}</span><div><b>${esc(t('summary.note'))}</b><p>${esc(t(deloadMsg.key, deloadMsg.params))}</p></div></div>`;
  h += `<h2>${esc(t('summary.next'))}</h2><div class="card">`;
  const icon = { up: I.arrowUp, down: I.arrowDown, same: I.equal, skip: I.minus };
  for (const c of changes) {
    const u = unitFor(c);
    const nx = c.after.weight == null ? `${c.after.reps} ${t('common.reps')}` : `${fmt(c.after.weight)} ${u} × ${c.after.reps}`;
    const was = c.before.weight == null || c.type === 'skip' || c.type === 'same' ? '' : `<span class="dim">${esc(t('summary.before', { w: fmt(c.before.weight), r: c.before.reps }))}</span>`;
    const label = findEx(c.exId) ? exName(findEx(c.exId)) : c.name;
    h += `<div class="chg"><span class="dot ${c.type}">${icon[c.type]}</span><div><b>${esc(label)}${c.pr ? `<span class="pr">${I.trophy}${esc(t('summary.record'))}</span>` : ''}</b><span>${esc(t(c.key, c.params ? { ...c.params, kg: fmt(c.params.kg) } : undefined))}</span><div class="nx num">→ ${esc(nx)}${was}</div></div></div>`;
  }
  h += `</div><div style="height:8px"></div><button class="btn primary" data-a="closeSummary">${esc(t('summary.done2'))}</button>`;
  return h;
}

/* ---------- Verlauf ---------- */

function lineChart(points, { h = 150, unit = 'kg' } = {}) {
  if (points.length < 2) return `<p class="empty">${esc(t('history.chartMin'))}</p>`;
  const W = 340, H = h, pl = 8, pr = 8, pt = 22, pb = 22;
  const ys = points.map(p => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const x = i => pl + (i / (points.length - 1)) * (W - pl - pr);
  const y = v => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1).toFixed(1)},${H - pb} L${x(0).toFixed(1)},${H - pb} Z`;
  const last = points[points.length - 1];
  const gid = 'g' + uid();
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('history.title'))}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8f542" stop-opacity=".3"/><stop offset="1" stop-color="#c8f542" stop-opacity="0"/></linearGradient></defs>
    <line x1="${pl}" x2="${W - pr}" y1="${y(max)}" y2="${y(max)}" stroke="rgba(255,255,255,.08)" stroke-dasharray="3 4"/>
    <line x1="${pl}" x2="${W - pr}" y1="${y(min)}" y2="${y(min)}" stroke="rgba(255,255,255,.08)" stroke-dasharray="3 4"/>
    <text x="${pl}" y="${y(max) - 7}" fill="#6c717a" font-size="11" font-weight="600">${fmt(max)} ${unit}</text>
    <text x="${pl}" y="${y(min) - 7}" fill="#6c717a" font-size="11" font-weight="600">${fmt(min)} ${unit}</text>
    <path d="${area}" fill="url(#${gid})"/>
    <path d="${d}" fill="none" stroke="#c8f542" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="${i === points.length - 1 ? 5 : 2.5}" fill="#c8f542" ${i === points.length - 1 ? 'stroke="#000" stroke-width="2"' : ''}/>`).join('')}
    <text x="${W - pr}" y="${H - 5}" fill="#6c717a" font-size="11" text-anchor="end">${fmtDate(last.x, { day: '2-digit', month: '2-digit' })}</text>
    <text x="${pl}" y="${H - 5}" fill="#6c717a" font-size="11">${fmtDate(points[0].x, { day: '2-digit', month: '2-digit' })}</text>
  </svg>`;
}

function barChart(vals, labels) {
  const W = 340, H = 150, pb = 20, pt = 22, n = vals.length;
  const max = Math.max(...vals, 1), slot = W / n, bw = slot * 0.58;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('history.volume'))}">${vals.map((v, i) => {
    const x = i * slot + (slot - bw) / 2;
    const bh = v ? Math.max(4, (v / max) * (H - pb - pt)) : 3;
    const y = H - pb - bh, last = i === n - 1, cx = (x + bw / 2).toFixed(1);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${last ? '#c8f542' : v ? 'rgba(200,245,66,.3)' : 'rgba(255,255,255,.07)'}"/>
      ${v && (last || v === max) ? `<text x="${cx}" y="${(y - 6).toFixed(1)}" fill="${last ? '#c8f542' : '#a4a9b1'}" font-size="10.5" font-weight="700" text-anchor="middle">${fmtVol(v)}</text>` : ''}
      <text x="${cx}" y="${H - 5}" fill="${last ? '#a4a9b1' : '#6c717a'}" font-size="10" text-anchor="middle">${esc(labels[i])}</text>`;
  }).join('')}</svg>`;
}

function viewHistory() {
  const sessions = state.history.slice().sort((a, b) => a.date.localeCompare(b.date));
  const wk = weekStats();
  let h = `<div class="eyebrow">${esc(t('history.eyebrow'))}</div><h1>${esc(t('history.title'))}</h1><div style="height:12px"></div>
    <div class="stat-row">
      <div class="stat"><b>${sessions.length}</b><span>${esc(t('history.sessions'))}</span></div>
      <div class="stat"><b>${wk.count}/${wk.target}</b><span>${esc(t('history.week'))}</span></div>
      <div class="stat"><b>${I.flame}${wk.streak}</b><span>${esc(t('history.streak'))}</span></div>
    </div>`;

  // Volumen pro Woche
  const mon = weekStart(new Date());
  const vals = [], labels = [];
  for (let i = 7; i >= 0; i--) {
    const s = new Date(mon); s.setDate(s.getDate() - i * 7);
    vals.push(sessionsBetween(s).reduce((a, e) => a + entryVolume(e), 0));
    labels.push(i === 0 ? t('history.now') : fmtDate(s, { day: '2-digit', month: '2-digit' }));
  }
  h += `<h2>${esc(t('history.volume'))} <small>${esc(t('history.perWeek'))}</small></h2><div class="card">${vals.some(Boolean) ? barChart(vals, labels) : `<p class="empty">${esc(t('history.volumeEmpty'))}</p>`}</div>`;

  // Körpergewicht
  const bw = state.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
  const lastBw = bw[bw.length - 1];
  const monthAgo = bw.filter(b => new Date(b.date).getTime() <= Date.now() - 28 * 864e5).pop();
  const diff = lastBw && monthAgo ? lastBw.kg - monthAgo.kg : null;
  h += `<h2>${esc(t('history.bw'))}</h2><div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
      <b style="font-size:28px;letter-spacing:-.02em" class="num">${lastBw ? fmt(lastBw.kg) + '<span class="dim" style="font-size:16px"> kg</span>' : '–'}</b>
      ${diff == null ? `<span class="muted small">${lastBw ? esc(fmtDate(lastBw.date)) : ''}</span>` : `<span class="tag ${(diff < 0) === (state.profile?.goal !== 'muskel') ? 'ac' : ''}">${esc(t('history.in4w', { d: (diff > 0 ? '+' : '') + fmt(Math.round(diff * 10) / 10) }))}</span>`}</div>
    ${lineChart(bw.slice(-30).map(b => ({ x: b.date, y: b.kg })), { h: 130 })}
    <div class="btn-row" style="margin-top:12px"><div class="inwrap" style="flex:1"><input class="in" id="bwIn" inputmode="decimal" placeholder="${esc(t('history.bwPh'))}"><span class="u">kg</span></div>
    <button class="btn sm" data-a="bwAdd" style="flex:0 0 auto">${esc(t('history.add'))}</button></div>
    <p class="dim small" style="margin:8px 0 0">${esc(t('history.bwTip'))}</p></div>`;

  // Übungsfortschritt
  const exs = allExercises();
  if (!ui.histEx || !exs.find(e => e.id === ui.histEx)) ui.histEx = exs[0]?.id;
  const pts = [];
  for (const s of sessions) for (const it of s.items) {
    if (it.exId === ui.histEx && it.weight != null && it.reps?.length && !s.deload) pts.push({ x: s.date, y: it.weight, reps: it.reps });
  }
  const best = pts.length ? Math.max(...pts.map(p => p.y)) : null;
  h += `<h2>${esc(t('history.progress'))}</h2><div class="card">
    <select class="in" data-c="histEx" style="margin-bottom:12px">${exs.map(e => `<option value="${e.id}" ${e.id === ui.histEx ? 'selected' : ''}>${esc(e.dayId)} · ${esc(exName(e))}</option>`).join('')}</select>
    ${pts.length ? `<div class="stat-row two"><div class="stat"><b>${fmt(best)} kg</b><span>${esc(t('history.best'))}</span></div><div class="stat"><b>${pts.length}</b><span>${esc(t('history.units'))}</span></div></div>` : ''}
    ${pts.length ? lineChart(pts.slice(-20)) : `<p class="empty">${esc(t('history.noData'))}</p>`}
    ${pts.length ? `<div class="sess"><div class="det" style="padding-top:10px">${pts.slice(-6).reverse().map(p => `<div><span>${esc(fmtDate(p.x))}</span><span>${fmt(p.y)} kg × ${p.reps.join(' · ')}</span></div>`).join('')}</div></div>` : ''}
  </div>`;

  // Trainingsliste
  h += `<h2>${esc(t('history.list'))}</h2><div class="card tight">`;
  if (!sessions.length) h += `<p class="empty" style="padding:14px 0">${esc(t('history.none'))}</p>`;
  for (const s of sessions.slice().reverse().slice(0, 40)) {
    h += `<details class="sess"><summary><span class="badge sm" style="width:36px;height:36px;font-size:15px">${esc(s.dayId)}</span>
      <span class="t"><b>${esc(entryDayLabel(s))}</b><span class="muted small">${esc(fmtDate(s.date))} · ${s.minutes} ${esc(t('common.min'))}${s.deload ? ' · ' + esc(t('history.deload')) : ''}</span></span>
      <span class="r">${esc(t('history.fatigue'))}<br><span class="fat">${[1, 2, 3, 4, 5].map(v => `<i class="${v <= s.fatigue ? 'on' : ''}"></i>`).join('')}</span></span></summary>
      <div class="det">${s.items.map(it => it.kind === 'cardio'
        ? `<div><span>${esc(itemName(it))}</span><span>${it.done ? `${it.duration} ${esc(t('common.min'))} ✓` : '–'}</span></div>`
        : `<div><span>${esc(itemName(it))}</span><span>${it.reps.length ? `${fmt(it.weight)} kg × ${it.reps.join(' · ')}` : esc(t('history.skipped'))}</span></div>`).join('')}
      <button class="link" data-a="delSession" data-id="${s.id}">${esc(t('history.delete'))}</button></div></details>`;
  }
  h += `</div>`;
  return h;
}

/* ---------- Plan & Einstellungen ---------- */

function viewPlan() {
  if (ui.planDay >= state.plan.length) ui.planDay = 0;
  const day = state.plan[ui.planDay];
  const p = state.profile;
  let h = `<div class="eyebrow">${esc(t('plan.eyebrow'))}</div><h1>${esc(t('plan.title'))}</h1><div style="height:12px"></div>`;

  if (p) {
    h += `<div class="card"><div class="notice"><span class="ic">${I[GOAL_ICON[p.goal]]}</span><div><b>${esc(t(`goal.${p.goal}.label`))}</b><p>${esc(t(`split.${p.split}.label`))} · ${esc(t('preview.perWeek', { n: p.days }))}</p></div></div>
      <div class="profile">
        <div><span>${esc(t('plan.exp'))}</span><b>${esc(t(`exp.${p.exp}.label`))}</b></div>
        <div><span>${esc(t('plan.place'))}</span><b>${esc(t(`equip.${p.equip}.label`))}</b></div>
        <div><span>${esc(t('plan.duration'))}</span><b>${esc(t('preview.approxMin', { n: p.minutes }))}</b></div>
        <div><span>${esc(t('plan.cardio'))}</span><b>${p.cardio ? `${CARDIO_MIN[p.goal]} ${esc(t('common.min'))}` : esc(t('plan.no'))}</b></div>
      </div>
      <button class="btn sm" style="width:100%" data-a="newPlan">${I.repeat} ${esc(t('plan.rebuild'))}</button></div>`;
  } else {
    h += `<div class="card notice"><span class="ic">${I.spark}</span><div><b>${esc(t('plan.wizardTitle'))}</b><p>${esc(t('plan.wizardText'))}</p>
      <button class="btn sm" style="margin-top:10px" data-a="newPlan">${esc(t('plan.wizardBtn'))}</button></div></div>`;
  }

  h += `<h2>${esc(t('plan.days'))}</h2>
    <div class="chips" style="margin:0 0 12px">${state.plan.map((d, i) => `<button class="chip ${i === ui.planDay ? 'on' : ''}" data-a="planDay" data-v="${i}">${esc(d.id)}</button>`).join('')}</div>
    <div class="card"><label class="f" style="margin:0"><span>${esc(t('plan.dayName'))}</span><input class="in" value="${esc(dayLabel(day))}" data-c="dayName"></label></div>
    <div class="card tight">`;
  day.exercises.forEach((e, i) => {
    const sub = e.kind === 'cardio' ? `${e.duration} ${t('common.min')} · ${t('kind.cardio')}` : `${e.sets} × ${e.repMin}–${e.repMax} · ${t('plan.now', { n: e.targetReps })} · ${e.weight == null ? '?' : fmt(e.weight)} kg`;
    h += `<div class="plan-row"><button class="plan-main" data-a="exEdit" data-i="${i}"><span class="n">${i + 1}</span><span class="t"><b>${esc(exName(e))}</b><span>${esc(sub)}</span></span></button>
      <button class="icon-btn info-btn" data-a="info" data-id="${e.id}" aria-label="${esc(t('wo.explain'))}">${I.info}</button></div>`;
  });
  h += `</div><button class="btn ghost" data-a="exAdd">${I.plus} ${esc(t('plan.add'))}</button>`;

  const s = state.settings;
  h += `<h2>${esc(t('plan.settings'))}</h2><div class="card">
    <label class="f" style="margin-bottom:8px"><span>${I.globe} ${esc(t('plan.language'))}</span></label>
    ${langPicker(false)}
    <div style="height:16px"></div>
    <button class="toggle" data-a="toggleTimer"><span class="t"><b>${esc(t('plan.timer'))}</b><span>${esc(t('plan.timerSub'))}</span></span><span class="sw ${s.restTimer ? 'on' : ''}"></span></button>
    <div style="height:12px"></div>
    <div class="grid2">
      <label class="f"><span>${esc(t('plan.bar'))}</span><div class="inwrap"><input class="in" inputmode="decimal" value="${fmt(s.barWeight)}" data-c="setBar"><span class="u">kg</span></div></label>
      <label class="f"><span>${esc(t('plan.deloadEvery'))}</span><div class="inwrap"><input class="in" inputmode="numeric" value="${s.deloadWeeks}" data-c="setDeload"><span class="u">${esc(t('common.weeksShort'))}</span></div></label>
    </div>
    <div class="btn-row"><button class="btn sm" data-a="openSetup">${esc(t('plan.weights'))}</button>
    <button class="btn sm" data-a="deloadNow">${esc(isDeload() ? t('plan.deloadEnd') : t('plan.deloadStart'))}</button></div>
  </div>
  <h2>${esc(t('plan.backup'))}</h2><div class="card">
    <p class="muted small" style="margin:0 0 12px">${esc(t('plan.backupText'))}</p>
    <div class="btn-row"><button class="btn sm" data-a="export">${esc(t('plan.export'))}</button>
    <label class="btn sm" style="margin:0">${esc(t('plan.import'))}<input type="file" accept="application/json,.json" data-c="import" hidden></label></div>
    <div style="height:10px"></div>
    <button class="btn sm danger" style="width:100%" data-a="reset">${esc(t('plan.reset'))}</button>
  </div>
  <p class="dim small footer">${LOGO}${esc(t('plan.footer'))}</p>`;
  return h;
}

/* ---------- Übung erklären ---------- */

/* Übung zur ID finden: Plan, laufendes Training oder Planvorschau */
function resolveEx(id) {
  return findEx(id) || state.active?.items.find(x => x.exId === id) || (ui.draft || []).flatMap(d => d.exercises).find(x => x.id === id) || null;
}

function viewInfo(m) {
  const e = resolveEx(m.id) || {};
  const ref = e.ref || null;
  const known = ref && tOpt(`ex.${ref}.exec`);
  const x = EX_BY_ID[ref];
  const name = e.exId ? itemLabel(e) : exName(e);
  const note = e.exId ? itemNote(e) : exNote(e);
  const hasAnim = ref && ANIM.has(ref);
  const cyclic = hasAnim && ANIM.cyclic(ref);
  const view = hasAnim ? ANIM.view(ref) : 'side';
  let h = `<div class="info-head"><div class="info-ic">${I.film}</div><div style="min-width:0"><div class="eyebrow" style="margin:0">${esc(t('info.title'))}</div><h3>${esc(name)}</h3></div></div>`;

  // A) Animation (startet nur auf Tippen) oder ehrlicher Platzhalter
  if (hasAnim) {
    h += `<div class="anim" id="animHost">
      <div class="anim-stage"></div>
      <button class="anim-play" data-a="animToggle" aria-label="${esc(t('info.play'))}"><span class="pl">${I.play}</span><span class="st">${I.stop}</span></button>
      <span class="anim-view">${esc(t(`info.view.${view}`))}</span>
      ${cyclic ? '' : `<div class="phases">${['start', 'exec', 'end'].map(ph => `<button data-a="animPhase" data-phase="${ph}">${esc(t(`info.phase.${ph}`))}</button>`).join('')}</div>`}
    </div>`;
  } else {
    h += `<div class="anim placeholder"><div class="ph-ic">${I.film}</div><b>${esc(t('info.noAnim'))}</b><p>${esc(ref ? t('info.noAnimText') : t('info.custom'))}</p></div>`;
  }

  // B) Tipps und Hinweise
  const sec = (icon, title, body) => `<section class="info-sec"><h4>${I[icon]}${esc(title)}</h4>${body}</section>`;
  if (known) {
    const cardio = x?.kind === 'cardio';
    const cue = note || t(`ex.${ref}.cue`);
    h += sec('target', t('info.exec'), `<p>${esc(t(`ex.${ref}.exec`))}</p>`);
    h += sec('check', t('info.tips'), `<ul>${[cue, cardio ? t('info.tempoCardio') : t('info.tempo')].filter(Boolean).map(s => `<li>${esc(s)}</li>`).join('')}</ul>`);
    h += sec('alert', t('info.mistakes'), `<p>${esc(t(`ex.${ref}.mistake`))}</p>`);
    h += sec('dumbbell', t('info.muscles'), `<div class="tags" style="margin:0">${exMuscleKeys(ref).map(k => `<span class="tag ac">${esc(t(`muscle.${k}`))}</span>`).join('')}</div>`);
    h += sec('lungs', t('info.breathing'), `<p>${esc(t(`breath.${x?.br || 'lift'}`))}</p>`);
  } else if (note) {
    h += sec('check', t('info.yourNote'), `<p>${esc(note)}</p>`);
  }
  h += `<div style="height:10px"></div><button class="btn ghost" data-a="modalClose">${esc(t('common.close'))}</button>`;
  return h;
}

function openInfo(id) {
  const e = resolveEx(id);
  if (!e) return;
  ui.modal = { type: 'info', id, ref: e.ref || null };
  render();
}

function viewModal() {
  const m = ui.modal;
  if (!m) { ui.lastModal = null; return ''; }
  const fresh = ui.lastModal !== m;
  ui.lastModal = m;
  let inner = '';
  if (m.type === 'info') {
    inner = viewInfo(m);
  } else if (m.type === 'fatigue') {
    const a = state.active;
    const open = a.items.filter(it => !itemComplete(it)).length;
    inner = `<h3>${esc(t('fatigue.title'))}</h3>
      <p class="muted small" style="margin:0">${esc(t('fatigue.sub'))}</p>
      ${open ? `<p class="small" style="color:var(--same)">${esc(t('fatigue.open', { n: open }))}</p>` : ''}
      <div class="fatigue">${[1, 2, 3, 4, 5].map(v => `<button class="${ui.fatigue === v ? 'on' : ''}" data-a="fatigue" data-v="${v}">${v}<small>${esc(t(`fatigue.l${v}`))}</small></button>`).join('')}</div>
      <button class="btn primary" data-a="saveWorkout" ${ui.fatigue ? '' : 'disabled'}>${esc(t('fatigue.save'))}</button>
      <div style="height:8px"></div><button class="btn ghost" data-a="modalClose">${esc(t('fatigue.continue'))}</button>`;
  } else if (m.type === 'edit') {
    const day = state.plan[ui.planDay];
    const e = m.isNew ? m.draft : day.exercises[m.i];
    const isC = e.kind === 'cardio';
    const last = day.exercises.length - 1;
    const ref = EX_BY_ID[e.ref];
    const alts = ref ? EX.filter(x => x.pat === ref.pat && x.id !== ref.id && equipOK(x, state.profile?.equip || 'gym')) : [];
    inner = `<div style="display:flex;align-items:center;gap:8px"><h3 style="flex:1">${esc(m.isNew ? t('edit.titleNew') : t('edit.title'))}</h3>
      ${m.isNew ? '' : `<button class="icon-btn" data-a="exMove" data-d="-1" ${m.i === 0 ? 'disabled' : ''} aria-label="${esc(t('edit.up'))}">${I.up}</button>
      <button class="icon-btn" data-a="exMove" data-d="1" ${m.i === last ? 'disabled' : ''} aria-label="${esc(t('edit.down'))}">${I.down}</button>`}</div>
      ${m.isNew ? '' : `<p class="dim small" style="margin:0">${esc(t('edit.pos', { i: m.i + 1, n: last + 1 }))}</p>`}<div style="height:12px"></div>
      ${alts.length ? `<label class="f"><span>${esc(t('edit.alt'))}</span><select class="in" data-c="altPick"><option value="">${esc(t('edit.altPh'))}</option>${alts.map(x => `<option value="${x.id}">${esc(t(`ex.${x.id}.name`))} (${esc(t(`kind.${x.kind}`))})</option>`).join('')}</select></label>` : ''}
      <label class="f"><span>${esc(t('edit.name'))}</span><input class="in" id="f-name" value="${esc(exName(e))}"></label>
      <label class="f"><span>${esc(t('edit.kind'))}</span><select class="in" id="f-kind" data-c="kindChange">${Object.keys(INC).map(k => `<option value="${k}" ${k === e.kind ? 'selected' : ''}>${esc(t(`kind.${k}`))}</option>`).join('')}</select></label>
      <div id="f-cardio" ${isC ? '' : 'hidden'}><label class="f"><span>${esc(t('edit.duration'))}</span><input class="in" id="f-duration" inputmode="numeric" value="${e.duration ?? 20}"></label></div>
      <div id="f-strength" ${isC ? 'hidden' : ''}>
      <div class="grid3">
        <label class="f"><span>${esc(t('edit.sets'))}</span><input class="in" id="f-sets" inputmode="numeric" value="${e.sets ?? 3}"></label>
        <label class="f"><span>${esc(t('edit.repMin'))}</span><input class="in" id="f-repMin" inputmode="numeric" value="${e.repMin ?? 8}"></label>
        <label class="f"><span>${esc(t('edit.repMax'))}</span><input class="in" id="f-repMax" inputmode="numeric" value="${e.repMax ?? 12}"></label>
      </div>
      <div class="grid3">
        <label class="f"><span>${esc(t('edit.weight'))}</span><input class="in" id="f-weight" inputmode="decimal" value="${e.weight == null ? '' : fmt(e.weight)}"></label>
        <label class="f"><span>${esc(t('edit.target'))}</span><input class="in" id="f-target" inputmode="numeric" value="${e.targetReps ?? e.repMin ?? 8}"></label>
        <label class="f"><span>${esc(t('edit.inc'))}</span><input class="in" id="f-inc" inputmode="decimal" value="${fmt(e.inc ?? 2.5)}"></label>
      </div>
      <label class="f"><span>${esc(t('edit.rest'))}</span><input class="in" id="f-rest" inputmode="numeric" value="${e.rest ?? 90}"></label>
      </div>
      <label class="f"><span>${esc(t('edit.note'))}</span><textarea class="in" id="f-note">${esc(exNote(e))}</textarea></label>
      <button class="btn primary" data-a="exSave">${esc(t('common.save'))}</button>
      <div style="height:8px"></div>
      <div class="btn-row">${m.isNew ? '' : `<button class="btn danger" data-a="exDelete">${esc(t('common.delete'))}</button>`}<button class="btn ghost" data-a="modalClose">${esc(t('common.cancel'))}</button></div>`;
  }
  return `<div class="modal-bg ${fresh ? '' : 'noanim'}" data-a="bgClose"><div class="sheet ${m.type === 'info' ? 'info-sheet' : ''}" role="dialog" aria-modal="true"><div class="grab"></div>${inner}</div></div>`;
}

/* ---------- Toast ---------- */

let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2600);
}

/* ---------- Aktionen ---------- */

const actions = {
  tab: el => { ui.tab = el.dataset.v; render(); window.scrollTo(0, 0); },
  pickDay: el => { state.nextDay = +el.dataset.v; save(); render(); },
  start: () => startWorkout(state.nextDay),
  resume: () => { ui.tab = 'workout'; render(); keepAwake(true); },
  openSetup: () => { ui.tab = 'setup'; render(); window.scrollTo(0, 0); },
  setupDone: () => { state.setupDone = true; save(); ui.tab = 'home'; render(); window.scrollTo(0, 0); },

  // Sprache: sofort umschalten, dauerhaft speichern
  setLang: el => {
    const code = el.dataset.v;
    if (!I18N.has(code) || code === I18N.lang) return;
    state.settings.lang = code;
    I18N.set(code);
    save();
    render();
    toast(t('toast.langChanged'));
  },

  // Fragebogen
  wizStart: () => { ui.wiz.i = 1; ui.wizDir = 'f'; render(); window.scrollTo(0, 0); },
  wizPick: el => {
    const p = ui.wiz.p, k = el.dataset.k, v = parseVal(el.dataset.v);
    p[k] = v;
    if (k === 'days') p.split = splitOptions(v)[0];
    el.closest('.opts, .tiles').querySelectorAll('.on').forEach(b => b.classList.remove('on'));
    el.classList.add('on');
    vibrate(10);
    clearTimeout(wizTimer);
    wizTimer = setTimeout(wizNext, 260);
  },
  wizToggle: el => {
    const p = ui.wiz.p, k = el.dataset.k, v = el.dataset.v;
    let arr = p[k];
    if (v === 'none') arr = [];
    else if (arr.includes(v)) arr = arr.filter(x => x !== v);
    else { arr = [...arr, v]; if (k === 'focus' && arr.length > 2) arr.shift(); }
    p[k] = arr;
    el.closest('.opts').querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === 'none' ? !arr.length : arr.includes(b.dataset.v)));
    if (k === 'focus') document.getElementById('wizNextBtn').textContent = arr.length ? t('common.next') : t('common.skip');
    vibrate(10);
  },
  wizSex: el => {
    ui.wiz.p.sex = el.dataset.v;
    el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el));
  },
  wizAbout: () => {
    const p = ui.wiz.p;
    p.name = document.getElementById('w-name').value.trim().slice(0, 30);
    const bw = num(document.getElementById('w-bw').value);
    p.bw = bw && bw >= 30 && bw <= 250 ? bw : null;
    wizNext();
  },
  wizNext: () => { clearTimeout(wizTimer); wizNext(); },
  wizBack: () => {
    clearTimeout(wizTimer);
    const w = ui.wiz;
    if (w.i <= 1 && w.editing) { ui.wiz = null; ui.tab = state.plan.length ? 'plan' : 'home'; render(); return; }
    w.i = Math.max(0, w.i - 1); ui.wizDir = 'b';
    render(); window.scrollTo(0, 0);
  },
  wizRestart: () => { ui.wiz.i = 1; ui.wizDir = 'b'; ui.tab = 'wizard'; render(); window.scrollTo(0, 0); },
  newPlan: () => {
    if (state.active && !confirm(t('confirm.discardWorkout'))) return;
    ui.wiz = newWizard(state.profile);
    ui.wiz.editing = true;
    if (!state.profile) ui.wiz.i = 1;
    ui.wizDir = 'f'; ui.tab = 'wizard';
    render(); window.scrollTo(0, 0);
  },
  acceptPlan: () => {
    const p = ui.wiz.p;
    state.profile = p;
    state.plan = ui.draft;
    state.nextDay = 0;
    state.deload = { remaining: 0, sessionsSince: 0 };
    state.active = null;
    state.settings.sessionsPerWeek = p.days;
    state.settings.restTimer = !!p.restTimer;
    state.setupDone = true;
    if (p.bw && !state.bodyweight.some(b => new Date(b.date).toDateString() === new Date().toDateString())) {
      state.bodyweight.push({ date: new Date().toISOString(), kg: p.bw });
    }
    ui.wiz = null; ui.draft = null; ui.planDay = 0;
    save(); ui.tab = 'setup'; render(); window.scrollTo(0, 0);
  },

  // Übung erklären
  info: (el, ev) => { ev.stopPropagation(); openInfo(el.dataset.id); },
  animToggle: () => ANIM.toggle(),
  animPhase: el => ANIM.showPhase(el.dataset.phase),

  // Training
  openItem: el => {
    const i = +el.dataset.i;
    const cur = ui.open ?? state.active.items.findIndex(it => !itemComplete(it));
    ui.open = cur === i ? -1 : i;
    ui.anim.open = i;
    render();
    document.getElementById('item-' + i)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },
  wStep: el => {
    const it = state.active.items[+el.dataset.i];
    const inc = it.inc > 0 ? it.inc : 1;
    it.weight = Math.max(0, roundTo((it.weight ?? 0) + inc * +el.dataset.d, inc));
    vibrate(8); save(); render();
  },
  rStep: el => {
    const it = state.active.items[+el.dataset.i];
    const s = +el.dataset.s;
    it.reps[s] = clamp(it.reps[s] + +el.dataset.d, 0, 99);
    vibrate(8); save(); render();
  },
  toggleSet: el => {
    const i = +el.dataset.i, s = +el.dataset.s;
    const it = state.active.items[i];
    it.done[s] = !it.done[s];
    vibrate(it.done[s] ? 25 : 8);
    if (it.done[s]) ui.anim.pop = `${i}-${s}`;
    if (it.kind === 'cardio') { if (it.done[0]) { ui.open = null; ui.rest = null; } }
    else if (it.done[s]) {
      startRest(it.rest);
      if (it.done.every(Boolean)) ui.anim.rate = i;
    }
    save(); render();
    if (it.kind !== 'cardio' && it.done.every(Boolean)) {
      document.querySelector(`#item-${i} .rate`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  },
  rate: el => {
    const i = +el.dataset.i;
    state.active.items[i].rating = el.dataset.v;
    vibrate(20);
    ui.open = null;
    const next = state.active.items.findIndex(it => !itemComplete(it));
    if (next >= 0) ui.anim.open = next;
    save(); render();
    if (next >= 0) document.getElementById('item-' + next)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },
  restAdd: el => {
    const r = ui.rest; if (!r) return;
    r.end = Math.max(Date.now(), r.end) + +el.dataset.d * 1000;
    r.total = Math.max(r.total, Math.ceil((r.end - Date.now()) / 1000));
    if (r.end > Date.now()) r.fired = false;
    tickRest();
  },
  restSkip: () => { ui.rest = null; buildRest(); },
  finish: () => { ui.fatigue = null; ui.modal = { type: 'fatigue' }; render(); },
  fatigue: el => {
    // ohne Neu-Rendern, damit das Fenster nicht neu einfährt
    ui.fatigue = +el.dataset.v; vibrate(15);
    document.querySelectorAll('[data-a=fatigue]').forEach(b => b.classList.toggle('on', b === el));
    document.querySelector('[data-a=saveWorkout]').disabled = false;
  },
  saveWorkout: () => { if (ui.fatigue) finishWorkout(ui.fatigue); },
  cancelWorkout: () => {
    if (!confirm(t('confirm.cancelWorkout'))) return;
    state.active = null; ui.rest = null; save(); keepAwake(false); ui.tab = 'home'; render();
  },
  closeSummary: () => { ui.summary = null; ui.tab = 'home'; render(); window.scrollTo(0, 0); },

  // Verlauf
  bwAdd: () => {
    const v = num(document.getElementById('bwIn').value);
    if (!v || v < 30 || v > 300) return toast(t('toast.bwInvalid'));
    state.bodyweight.push({ date: new Date().toISOString(), kg: v });
    save(); render(); toast(t('toast.bwSaved'));
  },
  delSession: el => {
    if (!confirm(t('confirm.deleteSession'))) return;
    state.history = state.history.filter(s => s.id !== el.dataset.id);
    save(); render();
  },

  // Plan
  planDay: el => { ui.planDay = +el.dataset.v; render(); },
  exMove: el => {
    const list = state.plan[ui.planDay].exercises;
    const i = ui.modal.i, j = i + +el.dataset.d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    ui.modal.i = j;
    save(); render();
  },
  exEdit: el => { ui.modal = { type: 'edit', i: +el.dataset.i }; render(); },
  exAdd: () => { ui.modal = { type: 'edit', isNew: true, draft: { id: uid(), name: '', kind: 'dumbbell', sets: 3, repMin: 10, repMax: 12, targetReps: 10, weight: null, inc: 2, rest: 90, note: '', fails: 0, customName: true, customNote: true } }; render(); },
  exSave: () => {
    const m = ui.modal;
    const list = state.plan[ui.planDay].exercises;
    const v = id => document.getElementById(id)?.value ?? '';
    const name = v('f-name').trim();
    if (!name) return toast(t('toast.nameMissing'));
    const kind = v('f-kind');
    const base = m.isNew ? m.draft : list[m.i];
    const alt = m.alt || {};
    const ref = alt.ref ?? base.ref;
    // Name/Hinweis nur dann als „eigen“ markieren, wenn sie vom Standardtext abweichen
    const stdName = ref ? tOpt(`ex.${ref}.name`) : null;
    const stdNote = ref ? tOpt(`ex.${ref}.cue`) : null;
    const note = v('f-note').trim();
    const named = { ref, name, customName: !stdName || name !== stdName, note, customNote: !stdNote ? !!note : note !== stdNote };
    let e;
    if (kind === 'cardio') {
      e = { id: base.id, kind, ...named, duration: Math.max(1, num(v('f-duration')) || 20) };
    } else {
      const repMin = Math.max(1, Math.round(num(v('f-repMin')) || 8));
      const repMax = Math.max(repMin, Math.round(num(v('f-repMax')) || repMin));
      e = {
        id: base.id, kind, ...named,
        single: alt.single ?? base.single ?? false, role: base.role,
        sets: clamp(Math.round(num(v('f-sets')) || 3), 1, 10),
        repMin, repMax,
        targetReps: clamp(Math.round(num(v('f-target')) || repMin), repMin, repMax),
        weight: num(v('f-weight')),
        inc: Math.max(0, num(v('f-inc')) ?? 2.5),
        rest: Math.max(0, Math.round(num(v('f-rest')) ?? 90)),
        fails: alt.ref ? 0 : base.fails || 0,
      };
    }
    if (!e.ref) delete e.ref;
    if (m.isNew) list.push(e); else list[m.i] = e;
    ui.modal = null; save(); render(); toast(t('toast.saved'));
  },
  exDelete: () => {
    const list = state.plan[ui.planDay].exercises;
    if (!confirm(t('confirm.deleteEx', { name: exName(list[ui.modal.i]) }))) return;
    list.splice(ui.modal.i, 1);
    ui.modal = null; save(); render();
  },
  modalClose: () => { ui.modal = null; render(); },
  bgClose: (el, ev) => { if (ev.target === el) { ui.modal = null; render(); } },

  toggleTimer: () => { state.settings.restTimer = !state.settings.restTimer; save(); render(); },
  deloadNow: () => {
    const n = Math.min(3, state.settings.sessionsPerWeek);
    state.deload = isDeload() ? { remaining: 0, sessionsSince: 0 } : { remaining: n, sessionsSince: 0 };
    save(); render(); toast(isDeload() ? t('toast.deloadOn', { n }) : t('toast.deloadOff'));
  },
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `setmode-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  reset: () => {
    if (!confirm(t('confirm.reset1'))) return;
    if (!confirm(t('confirm.reset2'))) return;
    const lang = state.settings.lang;
    state = defaultState(); state.settings.lang = lang; save();
    ui.wiz = newWizard(); ui.tab = 'wizard'; ui.planDay = 0; render();
  },
};

const changes = {
  setupW: el => {
    const e = findEx(el.dataset.id);
    if (e) { e.weight = num(el.value); save(); }
  },
  wInput: el => {
    const it = state.active.items[+el.dataset.i];
    const v = num(el.value);
    it.weight = v == null ? null : Math.max(0, v);
    save(); render();
  },
  histEx: el => { ui.histEx = el.value; render(); },
  dayName: el => {
    const d = state.plan[ui.planDay], n = el.value.trim();
    if (!n || n === dayLabel(d)) return;
    d.name = n; d.tpl = null; d.suffix = '';
    save();
  },
  setBar: el => { const v = num(el.value); if (v != null && v >= 0) { state.settings.barWeight = v; save(); } },
  setDeload: el => { const v = Math.round(num(el.value)); if (v >= 2 && v <= 20) { state.settings.deloadWeeks = v; save(); } },
  kindChange: el => {
    const isC = el.value === 'cardio';
    document.getElementById('f-cardio').hidden = !isC;
    document.getElementById('f-strength').hidden = isC;
  },
  altPick: el => {
    const x = EX_BY_ID[el.value];
    if (!x) return;
    const set = (id, v) => { const f = document.getElementById(id); if (f) f.value = v; };
    set('f-name', t(`ex.${x.id}.name`)); set('f-kind', x.kind); set('f-note', t(`ex.${x.id}.cue`)); set('f-inc', fmt(x.inc));
    const w = estimateWeight(x, state.profile, num(document.getElementById('f-repMin').value) || 8);
    set('f-weight', w == null ? '' : fmt(w));
    ui.modal.alt = { ref: x.id, single: x.single };
    changes.kindChange(document.getElementById('f-kind'));
    toast(t('toast.altApplied'));
  },
  import: el => {
    const file = el.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data.plan)) throw new Error('kein Plan');
        if (!confirm(t('confirm.importBackup'))) return;
        const lang = state.settings.lang;
        state = migrate(data);
        if (!data.settings?.lang) state.settings.lang = lang;
        I18N.set(state.settings.lang);
        save(); ui.tab = 'home'; render(); toast(t('toast.backupLoaded'));
      } catch (e) { toast(t('toast.backupInvalid')); }
    };
    r.readAsText(file);
  },
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.a];
  if (fn) fn(el, ev);
});
document.addEventListener('change', ev => {
  const el = ev.target.closest('[data-c]');
  if (!el) return;
  const fn = changes[el.dataset.c];
  if (fn) fn(el, ev);
});
document.addEventListener('keydown', ev => {
  // Enter im Eingabefeld schließt die Tastatur, Escape schließt Fenster
  if (ev.key === 'Enter' && ev.target.matches('input')) ev.target.blur();
  if (ev.key === 'Escape' && ui.modal) { ui.modal = null; render(); }
});

// Laufzeit im Training aktualisieren
setInterval(() => {
  const el = document.getElementById('elapsed');
  if (el && state.active) el.textContent = Math.round((Date.now() - new Date(state.active.startedAt).getTime()) / 60000);
}, 30000);

/* ---------- Start ---------- */

save(); // Migration (z. B. Sprache, v3-Felder) sofort sichern
if (!state.setupDone || !state.plan.length) {
  ui.wiz = newWizard();
  ui.tab = 'wizard';
} else if (state.active) ui.tab = 'workout';
render();

// Kein Offline-Cache beim lokalen Testen am PC, damit Änderungen sofort sichtbar sind
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
try { navigator.storage?.persist?.(); } catch (e) { }
