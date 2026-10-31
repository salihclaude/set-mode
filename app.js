'use strict';

/* =========================================================
   Fitnessplaner – Oberfläche und Trainingslogik
   Übungsdatenbank und Plan-Generator: data.js
   Alle Daten liegen lokal im Browser (localStorage).
   ========================================================= */

const STORE_KEY = 'fitplan.v1';
const KIND = { barbell: 'Langhantel', dumbbell: 'Kurzhantel', machine: 'Maschine', cable: 'Kabelzug', bodyweight: 'Körpergewicht', cardio: 'Cardio' };
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const GOALS = {
  fett: { label: 'Fett verlieren', icon: 'flame', desc: 'Definiert aussehen, Muskeln behalten' },
  muskel: { label: 'Muskeln aufbauen', icon: 'dumbbell', desc: 'Mehr Masse, 6–15 Wiederholungen' },
  kraft: { label: 'Stärker werden', icon: 'bolt', desc: 'Schwere Grundübungen, 3–8 Wiederholungen' },
  fitness: { label: 'Fit & gesund', icon: 'heart', desc: 'Ausgewogen aus Kraft und Ausdauer' },
};
const EXP = {
  beginner: { label: 'Anfänger', icon: 'sprout', desc: 'Weniger als 6 Monate Training' },
  inter: { label: 'Etwas Erfahrung', icon: 'trend', desc: '6 Monate bis 2 Jahre' },
  adv: { label: 'Fortgeschritten', icon: 'trophy', desc: 'Über 2 Jahre, ich kenne meine Gewichte' },
};
const EQUIP = {
  gym: { label: 'Fitnessstudio', icon: 'building', desc: 'Langhanteln, Maschinen, Kabelzug' },
  machines: { label: 'Maschinen & Kabel', icon: 'sliders', desc: 'Ohne Langhantel, geführte Bewegungen' },
  home: { label: 'Zuhause', icon: 'house', desc: 'Kurzhanteln und Bank' },
};
const LIMITS = {
  ruecken: { label: 'Rücken', icon: 'spine', desc: 'Kein schweres Kreuzheben, keine LH-Kniebeugen' },
  schulter: { label: 'Schultern', icon: 'user', desc: 'Kein Drücken über Kopf' },
  knie: { label: 'Knie', icon: 'knee', desc: 'Keine tiefen Beugen und Ausfallschritte' },
};
const DAY_HINT = { 2: 'Ganzkörper', 3: 'Ganzkörper oder PPL', 4: 'Ober-/ Unterkörper', 5: 'OK/UK + PPL', 6: 'Push/Pull/ Beine ×2' };
const MIN_HINT = { 45: 'Kompakt', 60: 'Standard', 75: 'Ausführlich', 90: 'Viel Zeit' };

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
};

/* ---------- Zustand ---------- */

function defaultSettings() { return { barWeight: 20, deloadWeeks: 6, sessionsPerWeek: 3, restTimer: true }; }
function defaultState() {
  return {
    version: 2, setupDone: false, profile: null, plan: [], nextDay: 0,
    settings: defaultSettings(), deload: { remaining: 0, sessionsSince: 0 },
    history: [], bodyweight: [], active: null,
  };
}
function migrate(s) {
  const st = Object.assign(defaultState(), s);
  st.settings = Object.assign(defaultSettings(), s.settings);
  if (!s.version || s.version < 2) {
    st.version = 2;
    st.settings.restTimer = false; // in v1 bewusst ohne Timer gewählt
  }
  return st;
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* leer oder blockiert */ }
  return defaultState();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Speichern fehlgeschlagen – Backup exportieren!'); }
}

let state = load();
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
  return Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 });
}
function fmtVol(v) { return v >= 1000 ? `${fmt(Math.round(v / 100) / 10)} t` : `${fmt(Math.round(v))} kg`; }
function num(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmtDate(iso, opts = { weekday: 'short', day: '2-digit', month: '2-digit' }) {
  return new Date(iso).toLocaleDateString('de-DE', opts);
}
function daysAgo(iso) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(iso); b.setHours(0, 0, 0, 0);
  const d = Math.round((a - b) / 864e5);
  return d === 0 ? 'heute' : d === 1 ? 'gestern' : `vor ${d} Tagen`;
}
function mmss(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function unitFor(e) {
  if (e.kind === 'bodyweight') return 'kg extra';
  return e.kind === 'dumbbell' && !e.single ? 'kg je Hand' : 'kg';
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
  if (per < 0) return `Leichter als die Stange (${fmt(bar)} kg)`;
  if (per === 0) return 'Nur die leere Stange';
  const out = [];
  for (const p of PLATES) while (per >= p - 1e-9) { out.push(p); per = +(per - p).toFixed(3); }
  return `Pro Seite: <b>${out.map(fmt).join(' + ')}</b>${per > 0.01 ? ` (+${fmt(per)} fehlt)` : ''}`;
}
function vibrate(p = 15) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }
function dayMinutes(day) {
  return Math.round((day.exercises.reduce((s, e) => s + exSeconds(e), 0) + 300) / 60 / 5) * 5;
}
function dayMuscles(day) {
  const set = [];
  for (const e of day.exercises) {
    if (e.kind === 'cardio' || !e.muscles) continue;
    for (const m of e.muscles.split(' · ')) if (!set.includes(m)) set.push(m);
  }
  return set.slice(0, 5);
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
  return state.history.filter(h => { const t = new Date(h.date); return t >= start && t < end; });
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

function viewWelcome() {
  const f = (icon, t, s) => `<li><span>${I[icon]}</span><span><b>${t}</b><small>${s}</small></span></li>`;
  return `<div class="welcome">
    <div class="welcome-logo">${I.dumbbell}</div>
    <h1>Dein Plan.<br><span class="ac">Ohne Nachdenken.</span></h1>
    <p class="lead">Beantworte ein paar kurze Fragen. Die App baut daraus deinen Trainingsplan und passt ihn danach jede Woche selbst an.</p>
    <ul class="feat">
      ${f('grid', 'Plan nach Maß', 'Übungen passend zu Ziel, Zeit und Geräten')}
      ${f('trend', 'Automatische Steigerung', 'Gewichte passen sich deiner Leistung an')}
      ${f('timer', 'Im Gym einfach abhaken', 'Gewicht, Sätze und Pausen stehen schon da')}
    </ul>
    <button class="btn primary" data-a="wizStart">Los geht's ${I.chevR}</button>
  </div>`;
}

function viewWizard() {
  const w = ui.wiz, p = w.p, steps = wizSteps(p), id = steps[w.i];
  if (id === 'welcome') return viewWelcome();
  const total = steps.length - 1;
  const head = (t, s) => `<h1>${t}</h1><p class="lead">${s}</p>`;
  const opt = (k, v, o, on, multi) => `<button class="opt ${on ? 'on' : ''}" data-a="${multi ? 'wizToggle' : 'wizPick'}" data-k="${k}" data-v="${v}">
    <span class="opt-ic">${I[o.icon] || ''}</span>
    <span class="opt-t"><b>${esc(o.label)}${o.badge ? `<em>${o.badge}</em>` : ''}</b><span>${esc(o.desc)}</span></span>
    <span class="opt-dot">${I.check}</span></button>`;
  const opts = (k, map) => `<div class="opts">${Object.entries(map).map(([v, o]) => opt(k, v, o, p[k] === v)).join('')}</div>`;
  const next = (label = 'Weiter', a = 'wizNext') => `<button class="btn primary" id="wizNextBtn" data-a="${a}">${label}</button>`;
  let body = '', foot = '';

  switch (id) {
    case 'goal':
      body = head('Was ist dein Ziel?', 'Bestimmt Wiederholungen, Pausen und Cardio.') + opts('goal', GOALS);
      break;
    case 'exp':
      body = head('Wie viel Erfahrung hast du?', 'Damit Übungsauswahl, Volumen und Startgewichte passen.') + opts('exp', EXP);
      break;
    case 'days':
      body = head('Wie oft pro Woche?', 'Sei ehrlich – regelmäßig schlägt viel.') +
        `<div class="tiles">${[2, 3, 4, 5, 6].map(d => `<button class="tile ${p.days === d ? 'on' : ''}" data-a="wizPick" data-k="days" data-v="${d}"><b>${d}×</b><span>${DAY_HINT[d]}</span></button>`).join('')}</div>`;
      break;
    case 'split':
      body = head('Wie willst du aufteilen?', `Für ${p.days} Tage gibt es mehrere gute Varianten.`) +
        `<div class="opts">${splitOptions(p.days).map((k, i) => opt('split', k, { icon: 'grid', label: SPLITS[k].label, desc: SPLITS[k].desc, badge: i === 0 ? 'Empfohlen' : '' }, p.split === k)).join('')}</div>`;
      break;
    case 'minutes':
      body = head('Wie lange pro Training?', 'Inklusive Aufwärmen und Cardio. Die Anzahl der Übungen passt sich an.') +
        `<div class="tiles">${[45, 60, 75, 90].map(m => `<button class="tile ${p.minutes === m ? 'on' : ''}" data-a="wizPick" data-k="minutes" data-v="${m}"><b>${m}<small>min</small></b><span>${MIN_HINT[m]}</span></button>`).join('')}</div>`;
      break;
    case 'equip':
      body = head('Wo trainierst du?', 'Es werden nur Übungen gewählt, die du dort machen kannst.') + opts('equip', EQUIP);
      break;
    case 'cardio':
      body = head('Cardio nach dem Training?', 'Kurz und locker nach dem Krafttraining, gut für Herz und Kalorienverbrauch.') +
        `<div class="opts">${opt('cardio', true, { icon: 'pulse', label: 'Ja, gerne', desc: `${CARDIO_MIN[p.goal || 'fett']} min Laufband, Crosstrainer oder Rad` }, p.cardio === true)}
        ${opt('cardio', false, { icon: 'x', label: 'Nein', desc: 'Nur Krafttraining' }, p.cardio === false)}</div>`;
      break;
    case 'limits':
      body = head('Hast du Beschwerden?', 'Belastende Übungen werden durch schonende Alternativen ersetzt.') +
        `<div class="opts multi">${opt('limits', 'none', { icon: 'check', label: 'Keine Beschwerden', desc: 'Alle Übungen sind möglich' }, !p.limits.length, true)}
        ${Object.entries(LIMITS).map(([v, o]) => opt('limits', v, o, p.limits.includes(v), true)).join('')}</div>`;
      foot = next();
      break;
    case 'focus':
      body = head('Was willst du betonen?', 'Optional: bis zu 2 Bereiche bekommen zusätzliche Sätze.') +
        `<div class="chipgrid opts">${Object.entries(FOCUS).map(([v, o]) => `<button class="opt-chip ${p.focus.includes(v) ? 'on' : ''}" data-a="wizToggle" data-k="focus" data-v="${v}">${o.label}</button>`).join('')}</div>`;
      foot = next(p.focus.length ? 'Weiter' : 'Überspringen');
      break;
    case 'about':
      body = head('Ein paar Daten zu dir', 'Daraus schätzt die App deine Startgewichte. Du kannst sie danach anpassen.') + `
        <label class="f"><span>Vorname (optional)</span><input class="in" id="w-name" value="${esc(p.name)}" autocomplete="given-name" placeholder="Wie soll die App dich nennen?"></label>
        <label class="f"><span>Geschlecht</span></label>
        <div class="seg" style="margin:-6px 0 14px">${[['m', 'Männlich'], ['f', 'Weiblich'], ['d', 'Keine Angabe']].map(([v, l]) => `<button class="${p.sex === v ? 'on' : ''}" data-a="wizSex" data-v="${v}">${l}</button>`).join('')}</div>
        <label class="f"><span>Körpergewicht</span><div class="inwrap"><input class="in big" id="w-bw" inputmode="decimal" value="${p.bw ? fmt(p.bw) : ''}" placeholder="80"><span class="u">kg</span></div></label>
        <p class="dim small">Ohne Körpergewicht trägst du die Startgewichte selbst ein.</p>`;
      foot = next('Weiter', 'wizAbout');
      break;
    case 'timer':
      body = head('Pausen-Timer?', 'Startet automatisch nach jedem abgehakten Satz und vibriert, wenn es weitergeht.') +
        `<div class="opts">${opt('restTimer', true, { icon: 'timer', label: 'Ja, mit Vibration', desc: 'Pause läuft automatisch, ±15 s anpassbar' }, p.restTimer === true)}
        ${opt('restTimer', false, { icon: 'x', label: 'Nein danke', desc: 'Pausenzeit nur als Text anzeigen' }, p.restTimer === false)}</div>`;
      break;
  }
  const key = { goal: 'goal', exp: 'exp', days: 'days', split: 'split', minutes: 'minutes', equip: 'equip', cardio: 'cardio', timer: 'restTimer' }[id];
  if (key && p[key] != null) foot = next(w.i === steps.length - 1 ? 'Plan erstellen' : 'Weiter');
  const from = Math.max(0, ui.wizDir === 'b' ? w.i + 1 : w.i - 1) / total * 100;
  return `<div class="wiz">
    <div class="wiz-top"><button class="icon-btn" data-a="wizBack" aria-label="Zurück">${I.chevL}</button>
    <div class="wiz-prog"><i style="width:${from}%" data-to="${w.i / total * 100}%"></i></div><span class="wiz-count">${w.i}/${total}</span></div>
    <div class="wiz-body ${ui.wizDir === 'b' ? 'back' : ''}">${body}</div>
    <div class="wiz-foot">${foot}</div></div>`;
}

function viewGenerating() {
  const li = (t, d) => `<li style="--d:${d}s">${I.check}${t}</li>`;
  return `<div class="gen"><div class="gen-orb">${I.spark}</div><h1>Plan wird erstellt</h1>
    <ul class="gen-list">${li('Übungen passend zu deinen Geräten auswählen', 0.2)}${li('Sätze, Wiederholungen und Pausen festlegen', 0.6)}${li('Startgewichte berechnen', 1)}</ul></div>`;
}

function viewPreview() {
  const p = ui.wiz.p, plan = ui.draft;
  const tags = [GOALS[p.goal].label, `${p.days}× pro Woche`, `ca. ${p.minutes} min`, EQUIP[p.equip].label,
    ...p.limits.map(l => `Schont ${LIMITS[l].label}`), ...p.focus.map(f => `Fokus ${FOCUS[f].label}`)];
  let h = `<div class="eyebrow ac">Fertig${p.name ? ', ' + esc(p.name) : ''}</div><h1>Dein Plan steht</h1>
    <p class="lead">${esc(planReason(p))}</p>
    <div class="tags" style="margin:-4px 0 18px">${tags.map((t, i) => `<span class="tag ${i === 0 ? 'ac' : ''}">${esc(t)}</span>`).join('')}</div>`;
  for (const d of plan) {
    const n = d.exercises.filter(e => e.kind !== 'cardio').length;
    h += `<div class="card"><div class="hero-top"><div class="badge sm">${d.id}</div>
      <div style="flex:1;min-width:0"><b style="font-size:17px">${esc(d.name)}</b>
      <div class="meta"><span>${I.dumbbell}${n} Übungen</span><span>${I.clock}ca. ${dayMinutes(d)} min</span></div></div></div>
      <ul class="ex-list">${d.exercises.map(e => `<li><span class="name">${esc(e.name)}<small>${e.kind === 'cardio' ? 'Cardio' : esc(e.muscles || '')}</small></span>
      <span class="val">${e.kind === 'cardio' ? `<b>${e.duration} min</b>` : `<b>${e.sets}</b> × ${e.repMin}–${e.repMax}`}</span></li>`).join('')}</ul></div>`;
  }
  if (p.goal === 'fett') h += `<div class="card notice"><span class="ic">${I.info}</span><div><b>Ernährung entscheidet mit</b><p>Für Fettabbau zählt vor allem ein leichtes Kaloriendefizit (ca. 300–500 kcal am Tag) und viel Eiweiß (ca. 1,8–2 g pro kg Körpergewicht).</p></div></div>`;
  if (state.history.length) h += `<p class="dim small" style="text-align:center">Dein bisheriger Verlauf und dein Körpergewicht bleiben erhalten.</p>`;
  h += `<div class="stack" style="margin-top:16px"><button class="btn primary" data-a="acceptPlan">Plan übernehmen ${I.check}</button>
    <button class="btn ghost" data-a="wizRestart">Antworten ändern</button></div>`;
  return h;
}

function viewSetup() {
  const est = !!state.profile?.bw;
  let h = `<div class="eyebrow">Letzter Schritt</div><h1>Startgewichte</h1>
    <p class="lead">${est ? 'Die Werte sind <b>Vorschläge</b> aus deinen Angaben. ' : ''}Trag dein echtes <b>Arbeitsgewicht</b> ein: das Gewicht, mit dem du die Wiederholungen sauber schaffst und noch 1–2 Wdh. Reserve hast.</p>`;
  for (const d of state.plan) {
    h += `<h2>${esc(d.id)} · ${esc(d.name)}</h2><div class="card tight">`;
    for (const e of d.exercises) {
      if (e.kind === 'cardio') continue;
      h += `<div class="setup-row"><div class="t"><b>${esc(e.name)}</b><span>${e.sets} × ${e.repMin}–${e.repMax} · ${unitFor(e)}</span></div>
        <div class="inwrap"><input class="in" inputmode="decimal" placeholder="?" value="${e.weight == null ? '' : fmt(e.weight)}" data-c="setupW" data-id="${e.id}"><span class="u">kg</span></div></div>`;
    }
    h += `</div>`;
  }
  h += `<div style="height:10px"></div><button class="btn primary" data-a="setupDone">Speichern & los ${I.chevR}</button>
    <p class="dim small" style="text-align:center">Du kannst Gewichte jederzeit im Training oder im Plan ändern.</p>`;
  return h;
}

/* ---------- Training ---------- */

function startWorkout(dayIdx) {
  const day = state.plan[dayIdx];
  const deload = isDeload();
  state.active = {
    dayIdx, dayId: day.id, dayName: day.name, deload,
    startedAt: new Date().toISOString(),
    items: day.exercises.map(e => {
      if (e.kind === 'cardio') return { exId: e.id, kind: 'cardio', name: e.name, duration: e.duration, note: e.note, done: [false] };
      const sets = deload ? Math.max(2, e.sets - 1) : e.sets;
      const weight = e.weight == null ? null : deload ? roundTo(e.weight * 0.85, e.inc) : e.weight;
      return {
        exId: e.id, kind: e.kind, single: e.single, name: e.name, note: e.note, muscles: e.muscles, rest: e.rest, inc: e.inc,
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

/*  Progressionslogik (doppelte Progression + Gefühl + Erschöpfung)
    - Alle Sätze im Ziel → erst Wiederholungen steigern, am oberen Ende Gewicht +inc
    - "Leicht" + wenig erschöpft → größere Sprünge
    - "Sehr schwer" oder komplett platt → halten
    - Unter dem Wdh.-Bereich → nochmal; beim 2. Mal in Folge −10 %            */
function progress(e, it, fatigue, deload) {
  const before = { weight: e.weight, reps: e.targetReps };
  const doneReps = it.reps.filter((_, i) => it.done[i]);
  let type, text;

  if (doneReps.length === 0) {
    return { type: 'skip', text: 'Übersprungen – bleibt gleich', before, after: before };
  }
  // Gewicht, das tatsächlich bewegt wurde, gilt als Basis (außer im Deload)
  if (!deload && it.weight != null) e.weight = it.weight;
  if (deload) {
    if (e.weight == null && it.weight != null) e.weight = roundTo(it.weight / 0.85, e.inc);
    return { type: 'same', text: 'Deload – Werte bleiben', before, after: { weight: e.weight, reps: e.targetReps } };
  }

  // Ohne eingetragenes Gewicht nur Wiederholungen steigern
  const hasW = e.weight != null;
  const inc = hasW ? e.inc : 0;
  const w = e.weight ?? 0;
  const t = it.targetReps;
  const missedSets = doneReps.length < it.sets;
  const minR = Math.min(...doneReps);
  const allHit = !missedSets && doneReps.every(r => r >= t);
  let newW = w, newT = t;

  if (missedSets || minR < e.repMin) {
    e.fails = (e.fails || 0) + 1;
    if (e.fails >= 2 && w > 0) {
      newW = roundTo(w * 0.9, e.inc); newT = e.repMin; e.fails = 0;
      type = 'down'; text = '2× in Folge nicht geschafft → Gewicht runter';
    } else {
      type = 'same'; text = 'Nicht ganz geschafft → gleiches Ziel nochmal';
    }
  } else {
    e.fails = 0;
    if (!allHit) {
      type = 'same'; text = 'Ziel knapp verpasst → gleiches Ziel nochmal';
    } else if (it.rating === 'hard') {
      type = 'same'; text = 'Geschafft, aber sehr schwer → erst festigen';
    } else if (fatigue >= 5) {
      type = 'same'; text = 'Komplett erschöpft → diesmal halten';
    } else {
      const easy = it.rating === 'easy';
      const atTop = t >= e.repMax || (easy && fatigue <= 3 && minR >= e.repMax);
      if (atTop && inc > 0) {
        const steps = easy && fatigue <= 2 ? 2 : 1;
        newW = roundTo(w + e.inc * steps, e.inc); newT = e.repMin;
        type = 'up'; text = `Oberes Ende erreicht → +${fmt(e.inc * steps)} kg`;
      } else if (atTop) {
        newT = e.repMax;
        type = 'same'; text = hasW ? 'Maximum erreicht – im Plan Gewicht erhöhen' : 'Bitte ein Gewicht eintragen, dann steigert die App automatisch';
      } else {
        const add = easy && fatigue <= 3 ? 2 : 1;
        newT = Math.min(e.repMax, t + add);
        type = 'up'; text = `Geschafft → +${newT - t} Wdh.`;
      }
    }
  }
  e.weight = hasW ? newW : null; e.targetReps = newT;
  return { type, text, before: { weight: hasW ? w : null, reps: t }, after: { weight: e.weight, reps: newT } };
}

function finishWorkout(fatigue) {
  const a = state.active;
  const changes = [];
  const entry = {
    id: uid(), date: new Date().toISOString(), dayId: a.dayId, dayName: a.dayName,
    deload: a.deload, fatigue,
    minutes: Math.max(1, Math.round((Date.now() - new Date(a.startedAt).getTime()) / 60000)),
    items: [],
  };
  let sets = 0;

  for (const it of a.items) {
    const e = findEx(it.exId);
    if (it.kind === 'cardio') {
      entry.items.push({ exId: it.exId, kind: 'cardio', name: it.name, duration: it.duration, done: it.done[0] });
      continue;
    }
    const reps = it.reps.filter((_, i) => it.done[i]);
    sets += reps.length;
    // Neuer Rekord: schwerer als jemals zuvor (ohne Deload)
    const prev = state.history.filter(h => !h.deload).flatMap(h => h.items.filter(x => x.exId === it.exId && x.reps?.length).map(x => x.weight || 0));
    const pr = !a.deload && reps.length > 0 && prev.length > 0 && (it.weight || 0) > Math.max(...prev);
    entry.items.push({ exId: it.exId, kind: it.kind, name: it.name, weight: it.weight, targetReps: it.targetReps, reps, rating: it.rating });
    if (e) changes.push({ name: it.name, kind: it.kind, single: it.single, pr, ...progress(e, it, fatigue, a.deload) });
  }
  state.history.push(entry);

  // Deload-Steuerung
  let deloadMsg = null;
  if (a.deload) {
    state.deload.remaining = Math.max(0, state.deload.remaining - 1);
    if (state.deload.remaining === 0) deloadMsg = 'Deload beendet – ab jetzt wieder normale Gewichte.';
  } else {
    state.deload.sessionsSince++;
    const recent = state.history.filter(h => !h.deload).slice(-3);
    const avg = recent.reduce((s, h) => s + h.fatigue, 0) / recent.length;
    const limit = state.settings.deloadWeeks * state.settings.sessionsPerWeek;
    const n = Math.min(3, state.settings.sessionsPerWeek);
    if (recent.length === 3 && avg >= 4.3) {
      state.deload = { remaining: n, sessionsSince: 0 };
      deloadMsg = `Du warst 3× in Folge sehr erschöpft → die nächsten ${n} Trainings sind eine leichte Deload-Woche.`;
    } else if (state.deload.sessionsSince >= limit) {
      state.deload = { remaining: n, sessionsSince: 0 };
      deloadMsg = `${state.settings.deloadWeeks} Wochen hart trainiert → die nächsten ${n} Trainings sind eine leichte Deload-Woche.`;
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
    <div class="rest-t"><span>Pause</span><b class="num">0:00</b></div>
    <button data-a="restAdd" data-d="-15">−15</button><button data-a="restAdd" data-d="15">+15</button>
    <button data-a="restSkip" aria-label="Pause beenden">${I.x}</button></div>`;
  tickRest();
}
function tickRest() {
  const r = ui.rest, el = document.getElementById('rest');
  if (!r || !el) return;
  const left = Math.max(0, Math.ceil((r.end - Date.now()) / 1000));
  el.querySelector('b').textContent = left ? mmss(left) : 'Los!';
  el.querySelector('.rest-t span').textContent = left ? 'Pause' : 'Fertig';
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
  const t = ui.tab;
  if (t === 'wizard' && ui.wiz) html = viewWizard();
  else if (t === 'generating') html = viewGenerating();
  else if (t === 'preview' && ui.draft) html = viewPreview();
  else if (t === 'setup') html = viewSetup();
  else if (t === 'workout' && state.active) html = viewWorkout();
  else if (t === 'summary' && ui.summary) html = viewSummary();
  else if (t === 'history') html = viewHistory();
  else if (t === 'plan') html = viewPlan();
  else { ui.tab = 'home'; html = viewHome(); }

  const animView = ui.tab !== ui.lastTab && ui.tab !== 'wizard';
  ui.lastTab = ui.tab;
  const showNav = ['home', 'history', 'plan'].includes(ui.tab);
  $app.innerHTML = `<div class="${animView ? 'view' : ''}">${html}</div>` + (showNav ? viewNav() : '') + viewModal();
  ui.anim = {};

  // Fortschrittsbalken im Fragebogen weich animieren
  const bar = document.querySelector('.wiz-prog i');
  if (bar) requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = bar.dataset.to; }));

  if (ui.tab !== 'workout' || !ui.rest) $overlay.innerHTML = '';
  else if (!document.getElementById('rest')) buildRest();
}

function viewNav() {
  const b = (t, icon, label) => `<button data-a="tab" data-v="${t}" class="${ui.tab === t ? 'on' : ''}">${icon}<span>${label}</span></button>`;
  return `<nav class="nav">${b('home', I.dumbbell, 'Training')}${b('history', I.hist, 'Verlauf')}${b('plan', I.plan, 'Plan')}</nav>`;
}

function setLine(e, deload) {
  if (e.kind === 'cardio') return `<b>${e.duration} min</b>`;
  const sets = deload ? Math.max(2, e.sets - 1) : e.sets;
  const w = e.weight == null ? null : deload ? roundTo(e.weight * 0.85, e.inc) : e.weight;
  const wt = e.kind === 'bodyweight' && !w ? 'KG' : `${w == null ? '?' : fmt(w)} kg`;
  return `${sets} × ${e.targetReps} · <b>${wt}</b>`;
}

function viewHome() {
  if (!state.plan.length) { ui.wiz = newWizard(); ui.tab = 'wizard'; return viewWizard(); }
  const day = state.plan[state.nextDay] || state.plan[0];
  const deload = isDeload();
  const wk = weekStats();
  const now = new Date();
  const hr = now.getHours();
  const greet = hr < 11 ? 'Guten Morgen' : hr < 18 ? 'Hallo' : 'Guten Abend';
  const name = state.profile?.name;
  const last = state.history[state.history.length - 1];
  const missing = allExercises().filter(e => e.weight == null).length;

  let h = `<div class="eyebrow">${now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <h1>${greet}${name ? ', ' + esc(name) : ''}</h1>
    <div class="week">${wk.days.map((d, i) => {
      const done = wk.trained.has(d.toDateString());
      return `<div class="wd ${done ? 'done' : ''} ${d.toDateString() === now.toDateString() ? 'today' : ''}">${WEEKDAYS[i]}<i>${done ? I.check : d.getDate()}</i></div>`;
    }).join('')}</div>`;

  if (state.active) {
    const a = state.active;
    const done = a.items.filter(itemComplete).length;
    h += `<div class="card hero"><div class="hero-top"><div class="badge">${esc(a.dayId)}</div>
      <div style="flex:1;min-width:0"><span class="tag ac">Läuft gerade</span><div class="hero-title" style="margin-top:6px">${esc(a.dayName)}</div>
      <div class="meta"><span>${done}/${a.items.length} erledigt</span></div></div></div>
      <div class="bar" style="margin:16px 0"><i style="width:${done / a.items.length * 100}%"></i></div>
      <button class="btn primary" data-a="resume">Training fortsetzen ${I.chevR}</button></div>`;
  } else {
    const strength = day.exercises.filter(e => e.kind !== 'cardio').length;
    h += `<div class="card hero">
      <div class="hero-top"><div class="badge">${esc(day.id)}</div>
        <div style="flex:1;min-width:0">
          <div class="eyebrow" style="margin:0">${deload ? '<span class="ac">Deload-Woche</span>' : 'Nächstes Training'}</div>
          <div class="hero-title">${esc(day.name)}</div>
          <div class="meta"><span>${I.dumbbell}${strength} Übungen</span><span>${I.clock}ca. ${dayMinutes(day)} min</span></div>
        </div></div>
      <div class="tags">${dayMuscles(day).map(m => `<span class="tag">${esc(m)}</span>`).join('')}</div>
      <ul class="ex-list">${day.exercises.map(e => `<li><span class="name">${esc(e.name)}</span><span class="val">${setLine(e, deload)}</span></li>`).join('')}</ul>
      <div style="height:16px"></div>
      <button class="btn primary" data-a="start">Training starten ${I.chevR}</button>
      <div class="chips">${state.plan.map((d, i) => `<button class="chip ${i === state.nextDay ? 'on' : ''}" data-a="pickDay" data-v="${i}">${esc(d.id)}</button>`).join('')}</div>
    </div>`;
    if (deload) h += `<div class="card notice warn"><span class="ic">${I.info}</span><div><b>Deload: noch ${state.deload.remaining} Training${state.deload.remaining > 1 ? 's' : ''}</b><p>Ca. 85 % Gewicht und ein Satz weniger, damit dein Körper sich erholt. Danach geht es mit den normalen Werten weiter.</p></div></div>`;
  }

  if (missing) h += `<div class="card notice"><span class="ic">${I.edit}</span><div><b>Noch ${missing} Gewicht${missing > 1 ? 'e' : ''} offen</b><p>Trag deine Arbeitsgewichte ein, dann rechnet die App ab dann alles selbst.</p>
    <button class="btn sm" style="margin-top:10px" data-a="openSetup">Gewichte eintragen</button></div></div>`;

  h += `<h2>Diese Woche</h2>
    <div class="card" style="padding:15px 16px"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">
      <b>Wochenziel</b><span class="muted small num">${wk.count} / ${wk.target} Trainings</span></div>
      <div class="bar"><i style="width:${Math.min(100, wk.count / wk.target * 100)}%"></i></div></div>
    <div class="stat-row">
      <div class="stat"><b>${I.flame}${wk.streak}</b><span>Wo.-Serie</span></div>
      <div class="stat"><b>${state.history.length}</b><span>Trainings</span></div>
      <div class="stat"><b>${wk.volume ? fmtVol(wk.volume).replace(' ', '&nbsp;') : '–'}</b><span>Bewegt</span></div>
    </div>`;

  if (last) {
    h += `<h2>Zuletzt</h2><div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
      <div><b>${esc(last.dayName)}</b><div class="muted small">${fmtDate(last.date)} · ${last.minutes} min${last.deload ? ' · Deload' : ''}</div></div>
      <span class="tag">${daysAgo(last.date)}</span></div></div>`;
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
    <div><div class="wo-title">${esc(a.dayName)}${a.deload ? ' <span class="tag warn">Deload</span>' : ''}</div>
    <div class="muted small"><span id="elapsed">${mins}</span> min · ${done}/${total} erledigt</div></div>
    <button class="btn sm ghost" data-a="cancelWorkout">Abbrechen</button></div>
    <div class="bar"><i style="width:${(done / total) * 100}%"></i></div></div>`;

  a.items.forEach((it, i) => {
    const complete = itemComplete(it);
    const open = i === openIdx;
    const summary = it.kind === 'cardio' ? `${it.duration} min` : `${it.sets} × ${it.targetReps} · ${it.weight == null ? '?' : fmt(it.weight)} ${unitFor(it)}`;
    h += `<div class="card ex-card ${complete ? 'done' : ''} ${open ? 'open' : ''}" id="item-${i}">
      <button class="ex-head" data-a="openItem" data-i="${i}">
        <span class="idx">${complete ? I.check : i + 1}</span>
        <span class="t"><b>${esc(it.name)}</b><span>${summary}</span></span>
        <span class="chev">${I.chevR}</span>
      </button>`;
    if (open) h += it.kind === 'cardio' ? cardioBody(it, i) : exBody(it, i);
    h += `</div>`;
  });

  h += `<div style="height:8px"></div><button class="btn ${done === total ? 'primary' : ''}" data-a="finish">Training beenden</button>`;
  return h;
}

function exBody(it, i) {
  const allDone = it.done.every(Boolean);
  const nextSet = it.done.findIndex(d => !d);
  const lt = lastTime(it.exId);
  let h = `<div class="ex-body ${ui.anim.open === i ? 'anim' : ''}">
    <div class="ex-info"><span class="tag">${KIND[it.kind] || ''}</span><span class="tag">${it.repMin}–${it.repMax} Wdh.</span><span class="tag">Pause ${restText(it.rest)}</span>${it.muscles ? `<span class="tag">${esc(it.muscles)}</span>` : ''}</div>
    ${it.note ? `<p class="ex-note">${esc(it.note)}</p>` : ''}
    ${lt ? `<div class="last">${I.clock}<span>Letztes Mal (${daysAgo(lt.date)}): <b>${fmt(lt.weight)} kg × ${lt.reps.join(' · ')}</b></span></div>` : ''}
    <div class="weight-box">
      <button class="step" data-a="wStep" data-i="${i}" data-d="-1" aria-label="Weniger Gewicht">−</button>
      <div class="wv"><input inputmode="decimal" value="${it.weight == null ? '' : fmt(it.weight)}" placeholder="?" data-c="wInput" data-i="${i}" aria-label="Gewicht"><span class="unit">${unitFor(it)}</span></div>
      <button class="step" data-a="wStep" data-i="${i}" data-d="1" aria-label="Mehr Gewicht">+</button>
    </div>
    <div class="plates">${it.kind === 'barbell' ? platesFor(it.weight) : '&nbsp;'}</div>`;
  it.reps.forEach((r, s) => {
    h += `<div class="set-row ${it.done[s] ? 'is-done' : ''} ${s === nextSet ? 'next' : ''}">
      <span class="sn"><b>${s + 1}</b><small>Satz</small></span>
      <span class="reps">
        <button class="step" data-a="rStep" data-i="${i}" data-s="${s}" data-d="-1" aria-label="Weniger Wiederholungen">−</button>
        <span class="v">${r}<small>Wdh.</small></span>
        <button class="step" data-a="rStep" data-i="${i}" data-s="${s}" data-d="1" aria-label="Mehr Wiederholungen">+</button>
      </span>
      <button class="check ${it.done[s] ? 'on' : ''} ${ui.anim.pop === `${i}-${s}` ? 'pop' : ''}" data-a="toggleSet" data-i="${i}" data-s="${s}" aria-label="Satz ${s + 1} erledigt">${I.check}</button>
    </div>`;
  });
  if (allDone) {
    const b = (v, label, sub) => `<button class="${it.rating === v ? 'on' : ''}" data-a="rate" data-i="${i}" data-v="${v}">${label}<small>${sub}</small></button>`;
    h += `<div class="rate ${ui.anim.rate === i ? 'anim' : ''}"><p>Wie hat sich das angefühlt?</p><div class="rate-btns">
      ${b('easy', 'Leicht', '3+ Wdh. übrig')}${b('ok', 'Passend', '1–2 übrig')}${b('hard', 'Sehr schwer', 'am Limit')}
    </div></div>`;
  }
  return h + `</div>`;
}

function cardioBody(it, i) {
  return `<div class="ex-body ${ui.anim.open === i ? 'anim' : ''}">
    ${it.note ? `<p class="ex-note">${esc(it.note)}</p>` : ''}
    <div class="cardio-box"><div style="flex:1"><div class="big">${it.duration} min</div><div class="muted small">${esc(it.name)}</div></div>
    <button class="check ${it.done[0] ? 'on' : ''}" data-a="toggleSet" data-i="${i}" data-s="0" aria-label="Cardio erledigt">${I.check}</button></div>
  </div>`;
}

function restText(sec) {
  if (!sec) return '–';
  return sec < 60 ? `${sec} s` : `${fmt(sec / 60)} min`;
}

function viewSummary() {
  const { entry, changes, deloadMsg, sets, volume } = ui.summary;
  const name = state.profile?.name;
  const prs = changes.filter(c => c.pr).length;
  let h = `<div class="trophy">${I.trophy}</div>
    <h1>Stark${name ? ', ' + esc(name) : ''}!</h1>
    <p class="lead">${esc(entry.dayName)} ist erledigt${prs ? ` – mit ${prs === 1 ? 'einem neuen Rekord' : `${prs} neuen Rekorden`}` : ''}.</p>
    <div class="stat-row">
      <div class="stat"><b>${entry.minutes}</b><span>Minuten</span></div>
      <div class="stat"><b>${sets}</b><span>Sätze</span></div>
      <div class="stat"><b>${volume ? fmtVol(volume).replace(' ', '&nbsp;') : '–'}</b><span>Bewegt</span></div>
    </div>`;
  if (deloadMsg) h += `<div class="card notice warn"><span class="ic">${I.info}</span><div><b>Hinweis</b><p>${esc(deloadMsg)}</p></div></div>`;
  h += `<h2>So geht es nächstes Mal weiter</h2><div class="card">`;
  const icon = { up: I.arrowUp, down: I.arrowDown, same: I.equal, skip: I.minus };
  for (const c of changes) {
    const u = unitFor(c);
    const nx = c.after.weight == null ? `${c.after.reps} Wdh.` : `${fmt(c.after.weight)} ${u} × ${c.after.reps}`;
    const was = c.before.weight == null || c.type === 'skip' || c.type === 'same' ? '' : `<span class="dim"> (vorher ${fmt(c.before.weight)} × ${c.before.reps})</span>`;
    h += `<div class="chg"><span class="dot ${c.type}">${icon[c.type]}</span><div><b>${esc(c.name)}${c.pr ? `<span class="pr">${I.trophy}Rekord</span>` : ''}</b><span>${esc(c.text)}</span><div class="nx num">→ ${nx}${was}</div></div></div>`;
  }
  h += `</div><div style="height:8px"></div><button class="btn primary" data-a="closeSummary">Fertig</button>`;
  return h;
}

/* ---------- Verlauf ---------- */

function lineChart(points, { h = 150, unit = 'kg' } = {}) {
  if (points.length < 2) return `<p class="empty">Ab 2 Einträgen erscheint hier ein Diagramm.</p>`;
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
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf">
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
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Volumen pro Woche">${vals.map((v, i) => {
    const x = i * slot + (slot - bw) / 2;
    const bh = v ? Math.max(4, (v / max) * (H - pb - pt)) : 3;
    const y = H - pb - bh, last = i === n - 1, cx = (x + bw / 2).toFixed(1);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${last ? '#c8f542' : v ? 'rgba(200,245,66,.3)' : 'rgba(255,255,255,.07)'}"/>
      ${v && (last || v === max) ? `<text x="${cx}" y="${(y - 6).toFixed(1)}" fill="${last ? '#c8f542' : '#a4a9b1'}" font-size="10.5" font-weight="700" text-anchor="middle">${fmtVol(v)}</text>` : ''}
      <text x="${cx}" y="${H - 5}" fill="${last ? '#a4a9b1' : '#6c717a'}" font-size="10" text-anchor="middle">${labels[i]}</text>`;
  }).join('')}</svg>`;
}

function viewHistory() {
  const sessions = state.history.slice().sort((a, b) => a.date.localeCompare(b.date));
  const wk = weekStats();
  let h = `<div class="eyebrow">Dein Fortschritt</div><h1>Verlauf</h1><div style="height:12px"></div>
    <div class="stat-row">
      <div class="stat"><b>${sessions.length}</b><span>Trainings</span></div>
      <div class="stat"><b>${wk.count}/${wk.target}</b><span>Woche</span></div>
      <div class="stat"><b>${I.flame}${wk.streak}</b><span>Serie</span></div>
    </div>`;

  // Volumen pro Woche
  const mon = weekStart(new Date());
  const vals = [], labels = [];
  for (let i = 7; i >= 0; i--) {
    const s = new Date(mon); s.setDate(s.getDate() - i * 7);
    vals.push(sessionsBetween(s).reduce((a, e) => a + entryVolume(e), 0));
    labels.push(i === 0 ? 'Jetzt' : fmtDate(s, { day: '2-digit', month: '2-digit' }));
  }
  h += `<h2>Bewegtes Gewicht <small>pro Woche</small></h2><div class="card">${vals.some(Boolean) ? barChart(vals, labels) : '<p class="empty">Nach deinem ersten Training siehst du hier dein Wochenvolumen.</p>'}</div>`;

  // Körpergewicht
  const bw = state.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
  const lastBw = bw[bw.length - 1];
  const monthAgo = bw.filter(b => new Date(b.date).getTime() <= Date.now() - 28 * 864e5).pop();
  const diff = lastBw && monthAgo ? lastBw.kg - monthAgo.kg : null;
  h += `<h2>Körpergewicht</h2><div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
      <b style="font-size:28px;letter-spacing:-.02em" class="num">${lastBw ? fmt(lastBw.kg) + '<span class="dim" style="font-size:16px"> kg</span>' : '–'}</b>
      ${diff == null ? `<span class="muted small">${lastBw ? fmtDate(lastBw.date) : ''}</span>` : `<span class="tag ${(diff < 0) === (state.profile?.goal !== 'muskel') ? 'ac' : ''}">${diff > 0 ? '+' : ''}${fmt(Math.round(diff * 10) / 10)} kg in 4 Wochen</span>`}</div>
    ${lineChart(bw.slice(-30).map(b => ({ x: b.date, y: b.kg })), { h: 130 })}
    <div class="btn-row" style="margin-top:12px"><div class="inwrap" style="flex:1"><input class="in" id="bwIn" inputmode="decimal" placeholder="z. B. 82,4"><span class="u">kg</span></div>
    <button class="btn sm" data-a="bwAdd" style="flex:0 0 auto">Eintragen</button></div>
    <p class="dim small" style="margin:8px 0 0">Tipp: 1× pro Woche morgens nüchtern wiegen.</p></div>`;

  // Übungsfortschritt
  const exs = allExercises();
  if (!ui.histEx || !exs.find(e => e.id === ui.histEx)) ui.histEx = exs[0]?.id;
  const pts = [];
  for (const s of sessions) for (const it of s.items) {
    if (it.exId === ui.histEx && it.weight != null && it.reps?.length && !s.deload) pts.push({ x: s.date, y: it.weight, reps: it.reps });
  }
  const best = pts.length ? Math.max(...pts.map(p => p.y)) : null;
  h += `<h2>Übungsfortschritt</h2><div class="card">
    <select class="in" data-c="histEx" style="margin-bottom:12px">${exs.map(e => `<option value="${e.id}" ${e.id === ui.histEx ? 'selected' : ''}>${esc(e.dayId)} · ${esc(e.name)}</option>`).join('')}</select>
    ${pts.length ? `<div class="stat-row two"><div class="stat"><b>${fmt(best)} kg</b><span>Bestes Gewicht</span></div><div class="stat"><b>${pts.length}</b><span>Einheiten</span></div></div>` : ''}
    ${pts.length ? lineChart(pts.slice(-20)) : '<p class="empty">Noch keine Daten für diese Übung.</p>'}
    ${pts.length ? `<div class="sess"><div class="det" style="padding-top:10px">${pts.slice(-6).reverse().map(p => `<div><span>${fmtDate(p.x)}</span><span>${fmt(p.y)} kg × ${p.reps.join(' · ')}</span></div>`).join('')}</div></div>` : ''}
  </div>`;

  // Trainingsliste
  h += `<h2>Trainings</h2><div class="card tight">`;
  if (!sessions.length) h += `<p class="empty" style="padding:14px 0">Noch keine Trainings.</p>`;
  for (const s of sessions.slice().reverse().slice(0, 40)) {
    h += `<details class="sess"><summary><span class="badge sm" style="width:36px;height:36px;font-size:15px">${esc(s.dayId)}</span>
      <span class="t"><b>${esc(s.dayName)}</b><span class="muted small">${fmtDate(s.date)} · ${s.minutes} min${s.deload ? ' · Deload' : ''}</span></span>
      <span class="r">Erschöpfung<br><span class="fat">${[1, 2, 3, 4, 5].map(v => `<i class="${v <= s.fatigue ? 'on' : ''}"></i>`).join('')}</span></span></summary>
      <div class="det">${s.items.map(it => it.kind === 'cardio'
        ? `<div><span>${esc(it.name)}</span><span>${it.done ? it.duration + ' min ✓' : '–'}</span></div>`
        : `<div><span>${esc(it.name)}</span><span>${it.reps.length ? `${fmt(it.weight)} kg × ${it.reps.join(' · ')}` : 'übersprungen'}</span></div>`).join('')}
      <button class="link" data-a="delSession" data-id="${s.id}">Eintrag löschen</button></div></details>`;
  }
  h += `</div>`;
  return h;
}

/* ---------- Plan & Einstellungen ---------- */

function viewPlan() {
  if (ui.planDay >= state.plan.length) ui.planDay = 0;
  const day = state.plan[ui.planDay];
  const p = state.profile;
  let h = `<div class="eyebrow">Dein Training</div><h1>Plan</h1><div style="height:12px"></div>`;

  if (p) {
    h += `<div class="card"><div class="notice"><span class="ic">${I[GOALS[p.goal].icon]}</span><div><b>${GOALS[p.goal].label}</b><p>${esc(SPLITS[p.split].label)} · ${p.days}× pro Woche</p></div></div>
      <div class="profile">
        <div><span>Erfahrung</span><b>${EXP[p.exp].label}</b></div>
        <div><span>Ort</span><b>${EQUIP[p.equip].label}</b></div>
        <div><span>Dauer</span><b>ca. ${p.minutes} min</b></div>
        <div><span>Cardio</span><b>${p.cardio ? CARDIO_MIN[p.goal] + ' min' : 'Nein'}</b></div>
      </div>
      <button class="btn sm" style="width:100%" data-a="newPlan">${I.repeat} Neuen Plan erstellen</button></div>`;
  } else {
    h += `<div class="card notice"><span class="ic">${I.spark}</span><div><b>Plan per Fragebogen erstellen</b><p>Beantworte ein paar Fragen und die App baut dir einen passenden Plan. Dein Verlauf bleibt erhalten.</p>
      <button class="btn sm" style="margin-top:10px" data-a="newPlan">Fragebogen starten</button></div></div>`;
  }

  h += `<h2>Trainingstage</h2>
    <div class="chips" style="margin:0 0 12px">${state.plan.map((d, i) => `<button class="chip ${i === ui.planDay ? 'on' : ''}" data-a="planDay" data-v="${i}">${esc(d.id)}</button>`).join('')}</div>
    <div class="card"><label class="f" style="margin:0"><span>Name des Tages</span><input class="in" value="${esc(day.name)}" data-c="dayName"></label></div>
    <div class="card tight">`;
  day.exercises.forEach((e, i) => {
    const sub = e.kind === 'cardio' ? `${e.duration} min · Cardio` : `${e.sets} × ${e.repMin}–${e.repMax} · jetzt ${e.targetReps} Wdh. · ${e.weight == null ? '?' : fmt(e.weight)} kg`;
    h += `<button class="plan-row" data-a="exEdit" data-i="${i}"><span class="n">${i + 1}</span><span class="t"><b>${esc(e.name)}</b><span>${sub}</span></span>${I.chevR}</button>`;
  });
  h += `</div><button class="btn ghost" data-a="exAdd">${I.plus} Übung hinzufügen</button>`;

  const s = state.settings;
  h += `<h2>Einstellungen</h2><div class="card">
    <button class="toggle" data-a="toggleTimer"><span class="t"><b>Pausen-Timer</b><span>Startet nach jedem Satz, vibriert am Ende</span></span><span class="sw ${s.restTimer ? 'on' : ''}"></span></button>
    <div style="height:12px"></div>
    <div class="grid2">
      <label class="f"><span>Stangengewicht</span><div class="inwrap"><input class="in" inputmode="decimal" value="${fmt(s.barWeight)}" data-c="setBar"><span class="u">kg</span></div></label>
      <label class="f"><span>Deload alle</span><div class="inwrap"><input class="in" inputmode="numeric" value="${s.deloadWeeks}" data-c="setDeload"><span class="u">Wo.</span></div></label>
    </div>
    <div class="btn-row"><button class="btn sm" data-a="openSetup">Gewichte</button>
    <button class="btn sm" data-a="deloadNow">${isDeload() ? 'Deload beenden' : 'Deload starten'}</button></div>
  </div>
  <h2>Datensicherung</h2><div class="card">
    <p class="muted small" style="margin:0 0 12px">Deine Daten liegen nur auf diesem Handy. Exportiere ab und zu ein Backup, z. B. in Google Drive.</p>
    <div class="btn-row"><button class="btn sm" data-a="export">Backup exportieren</button>
    <label class="btn sm" style="margin:0">Importieren<input type="file" accept="application/json,.json" data-c="import" hidden></label></div>
    <div style="height:10px"></div>
    <button class="btn sm danger" style="width:100%" data-a="reset">Alles zurücksetzen</button>
  </div>
  <p class="dim small" style="text-align:center">Fitnessplaner · Daten lokal gespeichert</p>`;
  return h;
}

function viewModal() {
  const m = ui.modal;
  if (!m) { ui.lastModal = null; return ''; }
  const fresh = ui.lastModal !== m;
  ui.lastModal = m;
  let inner = '';
  if (m.type === 'fatigue') {
    const a = state.active;
    const open = a.items.filter(it => !itemComplete(it)).length;
    const labels = ['', 'frisch', 'locker', 'normal', 'müde', 'platt'];
    inner = `<h3>Wie erschöpft bist du?</h3>
      <p class="muted small" style="margin:0">Fließt in die Gewichte fürs nächste Mal ein.</p>
      ${open ? `<p class="small" style="color:var(--same)">${open} Übung(en) nicht abgeschlossen. Ganz ausgelassene bleiben unverändert, angefangene zählen als nicht geschafft.</p>` : ''}
      <div class="fatigue">${[1, 2, 3, 4, 5].map(v => `<button class="${ui.fatigue === v ? 'on' : ''}" data-a="fatigue" data-v="${v}">${v}<small>${labels[v]}</small></button>`).join('')}</div>
      <button class="btn primary" data-a="saveWorkout" ${ui.fatigue ? '' : 'disabled'}>Speichern</button>
      <div style="height:8px"></div><button class="btn ghost" data-a="modalClose">Weiter trainieren</button>`;
  } else if (m.type === 'edit') {
    const day = state.plan[ui.planDay];
    const e = m.isNew ? m.draft : day.exercises[m.i];
    const isC = e.kind === 'cardio';
    const last = day.exercises.length - 1;
    const ref = EX.find(x => x.id === e.ref);
    const alts = ref ? EX.filter(x => x.pat === ref.pat && x.id !== ref.id && equipOK(x, state.profile?.equip || 'gym')) : [];
    inner = `<div style="display:flex;align-items:center;gap:8px"><h3 style="flex:1">${m.isNew ? 'Neue Übung' : 'Übung bearbeiten'}</h3>
      ${m.isNew ? '' : `<button class="icon-btn" data-a="exMove" data-d="-1" ${m.i === 0 ? 'disabled' : ''} aria-label="Nach oben">${I.up}</button>
      <button class="icon-btn" data-a="exMove" data-d="1" ${m.i === last ? 'disabled' : ''} aria-label="Nach unten">${I.down}</button>`}</div>
      ${m.isNew ? '' : `<p class="dim small" style="margin:0">Position ${m.i + 1} von ${last + 1}</p>`}<div style="height:12px"></div>
      ${alts.length ? `<label class="f"><span>Gegen Alternative tauschen</span><select class="in" data-c="altPick"><option value="">Alternative wählen …</option>${alts.map(x => `<option value="${x.id}">${esc(x.name)} (${KIND[x.kind]})</option>`).join('')}</select></label>` : ''}
      <label class="f"><span>Name</span><input class="in" id="f-name" value="${esc(e.name)}"></label>
      <label class="f"><span>Art</span><select class="in" id="f-kind" data-c="kindChange">${Object.entries(KIND).map(([k, v]) => `<option value="${k}" ${k === e.kind ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <div id="f-cardio" ${isC ? '' : 'hidden'}><label class="f"><span>Dauer (min)</span><input class="in" id="f-duration" inputmode="numeric" value="${e.duration ?? 20}"></label></div>
      <div id="f-strength" ${isC ? 'hidden' : ''}>
      <div class="grid3">
        <label class="f"><span>Sätze</span><input class="in" id="f-sets" inputmode="numeric" value="${e.sets ?? 3}"></label>
        <label class="f"><span>Wdh. min</span><input class="in" id="f-repMin" inputmode="numeric" value="${e.repMin ?? 8}"></label>
        <label class="f"><span>Wdh. max</span><input class="in" id="f-repMax" inputmode="numeric" value="${e.repMax ?? 12}"></label>
      </div>
      <div class="grid3">
        <label class="f"><span>Gewicht</span><input class="in" id="f-weight" inputmode="decimal" value="${e.weight == null ? '' : fmt(e.weight)}"></label>
        <label class="f"><span>Ziel-Wdh.</span><input class="in" id="f-target" inputmode="numeric" value="${e.targetReps ?? e.repMin ?? 8}"></label>
        <label class="f"><span>Schritt kg</span><input class="in" id="f-inc" inputmode="decimal" value="${fmt(e.inc ?? 2.5)}"></label>
      </div>
      <label class="f"><span>Pause (Sekunden)</span><input class="in" id="f-rest" inputmode="numeric" value="${e.rest ?? 90}"></label>
      </div>
      <label class="f"><span>Hinweis</span><textarea class="in" id="f-note">${esc(e.note)}</textarea></label>
      <button class="btn primary" data-a="exSave">Speichern</button>
      <div style="height:8px"></div>
      <div class="btn-row">${m.isNew ? '' : '<button class="btn danger" data-a="exDelete">Löschen</button>'}<button class="btn ghost" data-a="modalClose">Abbrechen</button></div>`;
  }
  return `<div class="modal-bg ${fresh ? '' : 'noanim'}" data-a="bgClose"><div class="sheet"><div class="grab"></div>${inner}</div></div>`;
}

/* ---------- Toast ---------- */

let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2600);
}

/* ---------- Aktionen ---------- */

const actions = {
  tab: el => { ui.tab = el.dataset.v; render(); window.scrollTo(0, 0); },
  pickDay: el => { state.nextDay = +el.dataset.v; save(); render(); },
  start: () => startWorkout(state.nextDay),
  resume: () => { ui.tab = 'workout'; render(); keepAwake(true); },
  openSetup: () => { ui.tab = 'setup'; render(); window.scrollTo(0, 0); },
  setupDone: () => { state.setupDone = true; save(); ui.tab = 'home'; render(); window.scrollTo(0, 0); },

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
    if (k === 'focus') document.getElementById('wizNextBtn').textContent = arr.length ? 'Weiter' : 'Überspringen';
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
    if (state.active && !confirm('Das laufende Training wird verworfen. Weiter?')) return;
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
    if (!confirm('Training abbrechen? Es wird nichts gespeichert.')) return;
    state.active = null; ui.rest = null; save(); keepAwake(false); ui.tab = 'home'; render();
  },
  closeSummary: () => { ui.summary = null; ui.tab = 'home'; render(); window.scrollTo(0, 0); },

  // Verlauf
  bwAdd: () => {
    const v = num(document.getElementById('bwIn').value);
    if (!v || v < 30 || v > 300) return toast('Bitte ein gültiges Gewicht eingeben');
    state.bodyweight.push({ date: new Date().toISOString(), kg: v });
    save(); render(); toast('Gewicht gespeichert');
  },
  delSession: el => {
    if (!confirm('Dieses Training aus dem Verlauf löschen? Die aktuellen Gewichte im Plan bleiben unverändert.')) return;
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
  exAdd: () => { ui.modal = { type: 'edit', isNew: true, draft: { id: uid(), name: '', kind: 'dumbbell', sets: 3, repMin: 10, repMax: 12, targetReps: 10, weight: null, inc: 2, rest: 90, note: '', fails: 0 } }; render(); },
  exSave: () => {
    const m = ui.modal;
    const list = state.plan[ui.planDay].exercises;
    const v = id => document.getElementById(id)?.value ?? '';
    const name = v('f-name').trim();
    if (!name) return toast('Bitte einen Namen eingeben');
    const kind = v('f-kind');
    const base = m.isNew ? m.draft : list[m.i];
    const alt = m.alt || {};
    let e;
    if (kind === 'cardio') {
      e = { id: base.id, name, kind, duration: Math.max(1, num(v('f-duration')) || 20), note: v('f-note').trim() };
    } else {
      const repMin = Math.max(1, Math.round(num(v('f-repMin')) || 8));
      const repMax = Math.max(repMin, Math.round(num(v('f-repMax')) || repMin));
      e = {
        id: base.id, ref: alt.ref ?? base.ref, name, kind,
        single: alt.single ?? base.single ?? false, muscles: alt.muscles ?? base.muscles ?? '', role: base.role,
        sets: clamp(Math.round(num(v('f-sets')) || 3), 1, 10),
        repMin, repMax,
        targetReps: clamp(Math.round(num(v('f-target')) || repMin), repMin, repMax),
        weight: num(v('f-weight')),
        inc: Math.max(0, num(v('f-inc')) ?? 2.5),
        rest: Math.max(0, Math.round(num(v('f-rest')) ?? 90)),
        note: v('f-note').trim(),
        fails: alt.ref ? 0 : base.fails || 0,
      };
    }
    if (m.isNew) list.push(e); else list[m.i] = e;
    ui.modal = null; save(); render(); toast('Gespeichert');
  },
  exDelete: () => {
    const list = state.plan[ui.planDay].exercises;
    if (!confirm(`„${list[ui.modal.i].name}“ löschen?`)) return;
    list.splice(ui.modal.i, 1);
    ui.modal = null; save(); render();
  },
  modalClose: () => { ui.modal = null; render(); },
  bgClose: (el, ev) => { if (ev.target === el) { ui.modal = null; render(); } },

  toggleTimer: () => { state.settings.restTimer = !state.settings.restTimer; save(); render(); },
  deloadNow: () => {
    const n = Math.min(3, state.settings.sessionsPerWeek);
    state.deload = isDeload() ? { remaining: 0, sessionsSince: 0 } : { remaining: n, sessionsSince: 0 };
    save(); render(); toast(isDeload() ? `Nächste ${n} Trainings: Deload` : 'Deload beendet');
  },
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fitnessplaner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  reset: () => {
    if (!confirm('Wirklich ALLES löschen (Plan, Gewichte, Verlauf)?')) return;
    if (!confirm('Sicher? Das kann nicht rückgängig gemacht werden.')) return;
    state = defaultState(); save();
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
  dayName: el => { const n = el.value.trim(); if (n) { state.plan[ui.planDay].name = n; save(); } },
  setBar: el => { const v = num(el.value); if (v != null && v >= 0) { state.settings.barWeight = v; save(); } },
  setDeload: el => { const v = Math.round(num(el.value)); if (v >= 2 && v <= 20) { state.settings.deloadWeeks = v; save(); } },
  kindChange: el => {
    const isC = el.value === 'cardio';
    document.getElementById('f-cardio').hidden = !isC;
    document.getElementById('f-strength').hidden = isC;
  },
  altPick: el => {
    const x = EX.find(x => x.id === el.value);
    if (!x) return;
    const set = (id, v) => { const f = document.getElementById(id); if (f) f.value = v; };
    set('f-name', x.name); set('f-kind', x.kind); set('f-note', x.note); set('f-inc', fmt(x.inc));
    const w = estimateWeight(x, state.profile, num(document.getElementById('f-repMin').value) || 8);
    set('f-weight', w == null ? '' : fmt(w));
    ui.modal.alt = { ref: x.id, single: x.single, muscles: x.muscles };
    changes.kindChange(document.getElementById('f-kind'));
    toast('Übernommen – Gewicht prüfen und speichern');
  },
  import: el => {
    const file = el.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data.plan)) throw new Error('kein Plan');
        if (!confirm('Backup laden? Die aktuellen Daten werden ersetzt.')) return;
        state = migrate(data);
        save(); ui.tab = 'home'; render(); toast('Backup geladen');
      } catch (e) { toast('Datei ist kein gültiges Backup'); }
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
// Enter im Eingabefeld schließt die Tastatur
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.matches('input')) ev.target.blur();
});

// Laufzeit im Training aktualisieren
setInterval(() => {
  const el = document.getElementById('elapsed');
  if (el && state.active) el.textContent = Math.round((Date.now() - new Date(state.active.startedAt).getTime()) / 60000);
}, 30000);

/* ---------- Start ---------- */

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
