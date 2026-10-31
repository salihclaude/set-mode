'use strict';

/* =========================================================
   Fitnessplaner – Ganzkörper A/B/C, Definition
   Alle Daten liegen lokal im Browser (localStorage).
   ========================================================= */

const STORE_KEY = 'fitplan.v1';
const KIND = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  machine: 'Maschine',
  cable: 'Kabelzug',
  bodyweight: 'Körpergewicht',
  cardio: 'Cardio',
};
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/* ---------- Standard-Plan ---------- */

function ex(name, kind, sets, repMin, repMax, inc, rest, note = '') {
  return { id: uid(), name, kind, sets, repMin, repMax, targetReps: repMin, weight: null, inc, rest, note, fails: 0 };
}
function cardio(name, duration, note) {
  return { id: uid(), name, kind: 'cardio', duration, note };
}

function defaultPlan() {
  return [
    {
      id: 'A', name: 'Ganzkörper A', exercises: [
        ex('Kniebeuge', 'barbell', 4, 6, 8, 2.5, 150, 'Mindestens bis parallel, Rumpf fest'),
        ex('Bankdrücken', 'barbell', 4, 6, 8, 2.5, 150, 'Schulterblätter zusammen, Füße fest am Boden'),
        ex('Langhantelrudern', 'barbell', 3, 8, 10, 2.5, 120, 'Oberkörper ca. 45°, zum Bauchnabel ziehen'),
        ex('Rumänisches Kreuzheben', 'barbell', 3, 8, 10, 2.5, 120, 'Knie leicht gebeugt, Rücken gerade, Dehnung im Beinbeuger'),
        ex('Seitheben', 'dumbbell', 3, 12, 15, 1, 60, 'Kontrolliert, nicht schwingen'),
        ex('Kabel-Crunch', 'cable', 3, 12, 15, 2.5, 60, 'Kniend, Rücken einrollen'),
        cardio('Laufband – Steigung gehen', 20, 'Steigung 10–12 %, 5–5,5 km/h, nicht festhalten'),
      ],
    },
    {
      id: 'B', name: 'Ganzkörper B', exercises: [
        ex('Kreuzheben', 'barbell', 3, 5, 6, 2.5, 180, 'Stange nah am Körper, Rücken neutral'),
        ex('Schrägbankdrücken', 'dumbbell', 3, 8, 10, 2, 120, 'Bank auf ca. 30°'),
        ex('Latzug breit', 'cable', 3, 8, 10, 2.5, 120, 'Zur oberen Brust ziehen, Brust raus'),
        ex('Ausfallschritte', 'dumbbell', 3, 10, 12, 2, 90, 'Wdh. je Bein'),
        ex('Schulterdrücken sitzend', 'dumbbell', 3, 8, 10, 2, 90, 'Lehne fast senkrecht'),
        ex('Bizeps-Curls', 'dumbbell', 3, 10, 12, 1, 60, 'Ellbogen am Körper'),
        ex('Trizepsdrücken am Seil', 'cable', 3, 10, 12, 2.5, 60, 'Unten Seil auseinanderziehen'),
        cardio('Crosstrainer', 20, 'Mittlere Intensität, du solltest noch sprechen können'),
      ],
    },
    {
      id: 'C', name: 'Ganzkörper C', exercises: [
        ex('Beinpresse', 'machine', 4, 10, 12, 5, 120, 'Füße schulterbreit, unten nicht abrunden'),
        ex('Schulterdrücken stehend', 'barbell', 3, 6, 8, 2.5, 150, 'Po und Bauch fest, Kopf durch die Arme'),
        ex('Kabelrudern eng', 'cable', 3, 10, 12, 2.5, 90, 'Schulterblätter zuerst zusammenziehen'),
        ex('Brustpresse', 'machine', 3, 8, 10, 5, 90, 'Griffe auf Brusthöhe'),
        ex('Beinbeuger liegend', 'machine', 3, 10, 12, 5, 90, 'Hüfte auf dem Polster lassen'),
        ex('Face Pulls', 'cable', 3, 12, 15, 2.5, 60, 'Zum Gesicht ziehen, Daumen nach hinten'),
        ex('Wadenheben', 'machine', 3, 12, 15, 5, 60, 'Oben 1 Sek. halten, unten voll dehnen'),
        cardio('Laufband – Steigung gehen', 20, 'Steigung 10–12 %, 5–5,5 km/h, nicht festhalten'),
      ],
    },
  ];
}

function defaultState() {
  return {
    version: 1,
    setupDone: false,
    plan: defaultPlan(),
    nextDay: 0,
    settings: { barWeight: 20, deloadWeeks: 6, sessionsPerWeek: 3 },
    deload: { remaining: 0, sessionsSince: 0 },
    history: [],
    bodyweight: [],
    active: null,
  };
}

/* ---------- Speicher ---------- */

let state = load();
const ui = { tab: state.setupDone ? 'home' : 'setup', planDay: 0, open: null, modal: null, summary: null, histEx: null, fatigue: null };

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { /* leer oder blockiert */ }
  return defaultState();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Speichern fehlgeschlagen – Backup exportieren!'); }
}

/* ---------- Helfer ---------- */

function uid() { return Math.random().toString(36).slice(2, 10); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmt(n) {
  if (n == null || isNaN(n)) return '–';
  return Number(n).toLocaleString('de-DE', { maximumFractionDigits: 2 });
}
function num(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}
function roundTo(x, inc) {
  const step = inc > 0 ? inc : 0.5;
  return +(Math.round(x / step) * step).toFixed(2);
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmtDate(iso, opts = { weekday: 'short', day: '2-digit', month: '2-digit' }) {
  return new Date(iso).toLocaleDateString('de-DE', opts);
}
function daysAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  return d === 0 ? 'heute' : d === 1 ? 'gestern' : `vor ${d} Tagen`;
}
function unitFor(kind) {
  return kind === 'dumbbell' ? 'kg je Hand' : kind === 'bodyweight' ? 'kg extra' : 'kg';
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
  for (const p of PLATES) {
    while (per >= p - 1e-9) { out.push(p); per = +(per - p).toFixed(3); }
  }
  return 'Pro Seite: ' + out.map(fmt).join(' + ') + (per > 0.01 ? ` (+${fmt(per)} fehlt)` : '');
}
function vibrate(ms = 15) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } }
function estMinutes(day) {
  let sec = 0;
  for (const e of day.exercises) {
    if (e.kind === 'cardio') sec += e.duration * 60;
    else sec += e.sets * (45 + (e.rest || 90));
  }
  return Math.round(sec / 60 / 5) * 5;
}

/* ---------- Training: Start / Ende ---------- */

function isDeload() { return state.deload.remaining > 0; }

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
        exId: e.id, kind: e.kind, name: e.name, note: e.note, rest: e.rest, inc: e.inc,
        repMin: e.repMin, repMax: e.repMax, targetReps: e.targetReps,
        sets, weight, reps: Array(sets).fill(e.targetReps), done: Array(sets).fill(false), rating: null,
      };
    }),
  };
  ui.open = null;
  ui.tab = 'workout';
  save();
  keepAwake(true);
  render();
  window.scrollTo(0, 0);
}

function itemComplete(it) {
  if (it.kind === 'cardio') return it.done[0];
  return it.done.every(Boolean) && !!it.rating;
}
function itemStarted(it) { return it.done.some(Boolean); }

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

  for (const it of a.items) {
    const e = findEx(it.exId);
    if (it.kind === 'cardio') {
      entry.items.push({ exId: it.exId, kind: 'cardio', name: it.name, duration: it.duration, done: it.done[0] });
      continue;
    }
    entry.items.push({
      exId: it.exId, kind: it.kind, name: it.name, weight: it.weight, targetReps: it.targetReps,
      reps: it.reps.filter((_, i) => it.done[i]), rating: it.rating,
    });
    if (e) changes.push({ name: it.name, kind: it.kind, ...progress(e, it, fatigue, a.deload) });
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
    if (recent.length === 3 && avg >= 4.3) {
      state.deload = { remaining: 3, sessionsSince: 0 };
      deloadMsg = 'Du warst 3× in Folge sehr erschöpft → die nächsten 3 Trainings sind eine leichte Deload-Woche.';
    } else if (state.deload.sessionsSince >= limit) {
      state.deload = { remaining: 3, sessionsSince: 0 };
      deloadMsg = `${state.settings.deloadWeeks} Wochen hart trainiert → die nächsten 3 Trainings sind eine leichte Deload-Woche.`;
    }
  }

  state.nextDay = (a.dayIdx + 1) % state.plan.length;
  state.active = null;
  save();
  keepAwake(false);
  ui.summary = { entry, changes, deloadMsg };
  ui.modal = null;
  ui.tab = 'summary';
  render();
  window.scrollTo(0, 0);
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

/* ---------- Icons ---------- */

const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/></svg>',
  hist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
};

/* ---------- Rendering ---------- */

const $app = document.getElementById('app');

function render() {
  let html = '';
  if (ui.tab === 'setup') html = viewSetup();
  else if (ui.tab === 'workout' && state.active) html = viewWorkout();
  else if (ui.tab === 'summary' && ui.summary) html = viewSummary();
  else if (ui.tab === 'history') html = viewHistory();
  else if (ui.tab === 'plan') html = viewPlan();
  else { ui.tab = 'home'; html = viewHome(); }

  const showNav = ['home', 'history', 'plan'].includes(ui.tab);
  $app.innerHTML = html + (showNav ? viewNav() : '') + viewModal();
}

function viewNav() {
  const b = (t, icon, label) => `<button data-a="tab" data-v="${t}" class="${ui.tab === t ? 'on' : ''}">${icon}<span>${label}</span></button>`;
  return `<nav class="nav">${b('home', I.home, 'Training')}${b('history', I.hist, 'Verlauf')}${b('plan', I.plan, 'Plan')}</nav>`;
}

function setLine(e, deload) {
  if (e.kind === 'cardio') return `<b>${e.duration} min</b>`;
  const sets = deload ? Math.max(2, e.sets - 1) : e.sets;
  const w = e.weight == null ? null : deload ? roundTo(e.weight * 0.85, e.inc) : e.weight;
  return `${sets} × ${e.targetReps} · <b>${w == null ? '? ' : fmt(w)} kg</b>`;
}

function viewHome() {
  const day = state.plan[state.nextDay] || state.plan[0];
  const last = state.history[state.history.length - 1];
  const deload = isDeload();
  const missing = allExercises().filter(e => e.weight == null).length;

  let h = `<h1>Heute</h1>`;
  if (state.active) {
    h += `<div class="card hero">
      <div class="hero-top"><div class="day-badge">${esc(state.active.dayId)}</div>
      <div><div class="pill ac">Läuft</div><div class="hero-title">${esc(state.active.dayName)}</div></div></div>
      <div style="height:16px"></div>
      <button class="btn primary" data-a="resume">Training fortsetzen</button>
    </div>`;
  } else {
    h += `<div class="card hero">
      <div class="hero-top"><div class="day-badge">${esc(day.id)}</div>
      <div>
        ${deload ? `<div class="pill warn">Deload · noch ${state.deload.remaining}</div>` : ''}
        <div class="hero-title">${esc(day.name)}</div>
        <div class="muted small">${day.exercises.length} Übungen · ca. ${estMinutes(day)} min</div>
      </div></div>
      <ul class="ex-list">${day.exercises.map(e => `<li><span class="name">${esc(e.name)}</span><span class="val">${setLine(e, deload)}</span></li>`).join('')}</ul>
      <div style="height:16px"></div>
      <button class="btn primary" data-a="start">Training starten</button>
      <div class="chips">${state.plan.map((d, i) => `<button class="chip ${i === state.nextDay ? 'on' : ''}" data-a="pickDay" data-v="${i}">Tag ${esc(d.id)}</button>`).join('')}</div>
    </div>`;
    if (deload) h += `<p class="muted small">Deload-Woche: ca. 85 % Gewicht und ein Satz weniger, damit sich dein Körper erholt. Danach geht es mit den normalen Gewichten weiter.</p>`;
  }

  if (missing) h += `<div class="card"><b>Noch ${missing} Gewichte offen</b><p class="muted small" style="margin:6px 0 12px">Trag deine aktuellen Arbeitsgewichte ein, dann rechnet die App ab dann alles selbst.</p><button class="btn sm" data-a="openSetup">Gewichte eintragen</button></div>`;

  h += `<h2>Zuletzt</h2>`;
  if (last) {
    h += `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px"><b>${esc(last.dayName)}</b><span class="muted">${daysAgo(last.date)}</span></div>
      <div class="muted small" style="margin-top:4px">${fmtDate(last.date)} · ${last.minutes} min · Erschöpfung ${last.fatigue}/5${last.deload ? ' · Deload' : ''}</div></div>`;
  } else {
    h += `<p class="empty">Noch kein Training gespeichert.</p>`;
  }
  return h;
}

function viewSetup() {
  let h = `<h1>Startgewichte</h1>
  <p class="muted">Trag dein aktuelles <b>Arbeitsgewicht</b> pro Übung ein: das Gewicht, mit dem du die angegebenen Wiederholungen sauber schaffst und 1–2 Wdh. Reserve hast. Ab dann passt die App alles automatisch an.</p>`;
  for (const d of state.plan) {
    h += `<h2>${esc(d.name)}</h2><div class="card">`;
    for (const e of d.exercises) {
      if (e.kind === 'cardio') continue;
      h += `<div class="setup-row"><div class="t"><b>${esc(e.name)}</b><span>${e.sets} × ${e.repMin}–${e.repMax} · ${unitFor(e.kind)}</span></div>
        <input class="in" inputmode="decimal" placeholder="kg" value="${e.weight == null ? '' : fmt(e.weight)}" data-c="setupW" data-id="${e.id}"></div>`;
    }
    h += `</div>`;
  }
  h += `<div style="height:8px"></div><button class="btn primary" data-a="setupDone">Speichern & los</button>
  <p class="dim small" style="text-align:center">Fehlende Gewichte kannst du auch später im Training eintragen.</p>`;
  return h;
}

function viewWorkout() {
  const a = state.active;
  const total = a.items.length;
  const done = a.items.filter(itemComplete).length;
  const openIdx = ui.open ?? a.items.findIndex(it => !itemComplete(it));
  const mins = Math.round((Date.now() - new Date(a.startedAt).getTime()) / 60000);

  let h = `<div class="wo-head"><div class="wo-head-row">
    <div><div class="wo-title">${esc(a.dayName)}${a.deload ? ' <span class="pill warn">Deload</span>' : ''}</div>
    <div class="muted small"><span id="elapsed">${mins}</span> min · ${done}/${total} erledigt</div></div>
    <button class="btn sm ghost" data-a="cancelWorkout">Abbrechen</button></div>
    <div class="progress"><i style="width:${(done / total) * 100}%"></i></div></div>`;

  a.items.forEach((it, i) => {
    const complete = itemComplete(it);
    const open = i === openIdx;
    const cls = `card ex-card ${complete ? 'done' : ''} ${open ? 'open' : ''}`;
    const summary = it.kind === 'cardio' ? `${it.duration} min` : `${it.sets} × ${it.targetReps} · ${it.weight == null ? '?' : fmt(it.weight)} ${unitFor(it.kind)}`;
    h += `<div class="${cls}" id="item-${i}">
      <button class="ex-head" data-a="openItem" data-i="${i}">
        <span class="idx">${complete ? I.check : i + 1}</span>
        <span class="t"><b>${esc(it.name)}</b><span>${summary}</span></span>
      </button>`;
    if (open) h += it.kind === 'cardio' ? cardioBody(it, i) : exBody(it, i);
    h += `</div>`;
  });

  h += `<div style="height:8px"></div><button class="btn ${done === total ? 'primary' : ''}" data-a="finish">Training beenden</button>`;
  return h;
}

function exBody(it, i) {
  const allDone = it.done.every(Boolean);
  let h = `<div class="ex-body">
    <div class="ex-meta"><span>${KIND[it.kind] || ''}</span><span>Ziel ${it.repMin}–${it.repMax} Wdh.</span><span>Pause ${restText(it.rest)}</span></div>
    ${it.note ? `<p class="ex-note">${esc(it.note)}</p>` : ''}
    <div class="weight-box">
      <button class="step" data-a="wStep" data-i="${i}" data-d="-1">−</button>
      <input inputmode="decimal" value="${it.weight == null ? '' : fmt(it.weight)}" placeholder="?" data-c="wInput" data-i="${i}" aria-label="Gewicht">
      <span class="unit">${unitFor(it.kind)}</span>
      <button class="step" data-a="wStep" data-i="${i}" data-d="1">+</button>
    </div>
    <div class="plates">${it.kind === 'barbell' ? esc(platesFor(it.weight)) : '&nbsp;'}</div>`;
  it.reps.forEach((r, s) => {
    h += `<div class="set-row ${it.done[s] ? 'is-done' : ''}">
      <span class="sn">Satz ${s + 1}</span>
      <span class="reps">
        <button class="step" data-a="rStep" data-i="${i}" data-s="${s}" data-d="-1">−</button>
        <span class="v">${r}<small>Wdh.</small></span>
        <button class="step" data-a="rStep" data-i="${i}" data-s="${s}" data-d="1">+</button>
      </span>
      <button class="check ${it.done[s] ? 'on' : ''}" data-a="toggleSet" data-i="${i}" data-s="${s}" aria-label="Satz erledigt">${I.check}</button>
    </div>`;
  });
  if (allDone) {
    const b = (v, label, sub) => `<button class="${it.rating === v ? 'on' : ''}" data-a="rate" data-i="${i}" data-v="${v}">${label}<small>${sub}</small></button>`;
    h += `<div class="rate"><p>Wie hat sich die Übung angefühlt?</p><div class="rate-btns">
      ${b('easy', 'Leicht', '3+ Wdh. übrig')}${b('ok', 'Passend', '1–2 übrig')}${b('hard', 'Sehr schwer', 'am Limit')}
    </div></div>`;
  }
  return h + `</div>`;
}

function cardioBody(it, i) {
  return `<div class="ex-body">
    ${it.note ? `<p class="ex-note">${esc(it.note)}</p>` : ''}
    <div class="cardio-box"><div style="flex:1"><div class="big">${it.duration} min</div><div class="muted small">${esc(it.name)}</div></div>
    <button class="check ${it.done[0] ? 'on' : ''}" data-a="toggleSet" data-i="${i}" data-s="0" aria-label="Cardio erledigt">${I.check}</button></div>
  </div>`;
}

function restText(sec) {
  if (!sec) return '–';
  if (sec < 60) return `${sec} s`;
  const m = sec / 60;
  return `${fmt(m)} min`;
}

function viewSummary() {
  const { entry, changes, deloadMsg } = ui.summary;
  let h = `<h1>Stark! 💪</h1>
    <p class="muted">${esc(entry.dayName)} · ${entry.minutes} min · Erschöpfung ${entry.fatigue}/5</p>`;
  if (deloadMsg) h += `<div class="card" style="border-color:#4a3a10"><b style="color:var(--same)">Hinweis</b><p class="small" style="margin:6px 0 0">${esc(deloadMsg)}</p></div>`;
  h += `<h2>So geht es nächstes Mal weiter</h2><div class="card">`;
  for (const c of changes) {
    const nx = c.after.weight == null ? `${c.after.reps} Wdh.` : `${fmt(c.after.weight)} ${unitFor(c.kind)} × ${c.after.reps}`;
    const was = c.before.weight == null ? '' : `<span class="dim"> (vorher ${fmt(c.before.weight)} × ${c.before.reps})</span>`;
    h += `<div class="chg"><span class="dot ${c.type}"></span><div><b>${esc(c.name)}</b><span>${esc(c.text)}</span><div class="nx num">→ ${nx}${c.type !== 'skip' && c.type !== 'same' ? was : ''}</div></div></div>`;
  }
  h += `</div><div style="height:8px"></div><button class="btn primary" data-a="closeSummary">Fertig</button>`;
  return h;
}

/* ---------- Verlauf ---------- */

function lineChart(points, { h = 150, unit = 'kg' } = {}) {
  if (points.length < 2) return `<p class="empty">Ab 2 Einträgen erscheint hier ein Diagramm.</p>`;
  const W = 340, H = h, pl = 8, pr = 8, pt = 20, pb = 22;
  const ys = points.map(p => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const x = i => pl + (i / (points.length - 1)) * (W - pl - pr);
  const y = v => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1).toFixed(1)},${H - pb} L${x(0).toFixed(1)},${H - pb} Z`;
  const last = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8f542" stop-opacity=".28"/><stop offset="1" stop-color="#c8f542" stop-opacity="0"/></linearGradient></defs>
    <line x1="${pl}" x2="${W - pr}" y1="${y(max)}" y2="${y(max)}" stroke="#2b2e34" stroke-dasharray="3 4"/>
    <line x1="${pl}" x2="${W - pr}" y1="${y(min)}" y2="${y(min)}" stroke="#2b2e34" stroke-dasharray="3 4"/>
    <text x="${pl}" y="${y(max) - 6}" fill="#6b7079" font-size="11">${fmt(max)} ${unit}</text>
    <text x="${pl}" y="${y(min) - 6}" fill="#6b7079" font-size="11">${fmt(min)} ${unit}</text>
    <path d="${area}" fill="url(#g)"/>
    <path d="${d}" fill="none" stroke="#c8f542" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="${i === points.length - 1 ? 4.5 : 2.5}" fill="#c8f542"/>`).join('')}
    <text x="${W - pr}" y="${H - 5}" fill="#6b7079" font-size="11" text-anchor="end">${fmtDate(last.x, { day: '2-digit', month: '2-digit' })}</text>
    <text x="${pl}" y="${H - 5}" fill="#6b7079" font-size="11">${fmtDate(points[0].x, { day: '2-digit', month: '2-digit' })}</text>
  </svg>`;
}

function viewHistory() {
  let h = `<h1>Verlauf</h1>`;
  const sessions = state.history.slice().sort((a, b) => a.date.localeCompare(b.date));
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = sessions.filter(s => new Date(s.date).getTime() >= weekAgo).length;

  h += `<div class="stat-row"><div class="stat"><b>${sessions.length}</b><span>Trainings</span></div>
    <div class="stat"><b>${thisWeek}/${state.settings.sessionsPerWeek}</b><span>Letzte 7 Tage</span></div></div>`;

  // Körpergewicht
  const bw = state.bodyweight.slice().sort((a, b) => a.date.localeCompare(b.date));
  const lastBw = bw[bw.length - 1];
  const monthAgo = bw.filter(b => new Date(b.date).getTime() <= Date.now() - 28 * 864e5).pop();
  const diff = lastBw && monthAgo ? lastBw.kg - monthAgo.kg : null;
  h += `<h2>Körpergewicht</h2><div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
      <b style="font-size:24px" class="num">${lastBw ? fmt(lastBw.kg) + ' kg' : '–'}</b>
      <span class="muted small">${diff == null ? (lastBw ? fmtDate(lastBw.date) : '') : `${diff > 0 ? '+' : ''}${fmt(diff)} kg in 4 Wochen`}</span></div>
    ${lineChart(bw.slice(-30).map(b => ({ x: b.date, y: b.kg })), { h: 130 })}
    <div class="btn-row" style="margin-top:12px"><input class="in" id="bwIn" inputmode="decimal" placeholder="z. B. 82,4">
    <button class="btn sm" data-a="bwAdd" style="flex:0 0 auto;padding:0 18px">Eintragen</button></div>
    <p class="dim small" style="margin:8px 0 0">Tipp: 1× pro Woche morgens nüchtern wiegen.</p></div>`;

  // Übungsfortschritt
  const exs = allExercises();
  if (!ui.histEx || !exs.find(e => e.id === ui.histEx)) ui.histEx = exs[0]?.id;
  const pts = [];
  for (const s of sessions) for (const it of s.items) {
    if (it.exId === ui.histEx && it.weight != null && it.reps?.length && !s.deload) pts.push({ x: s.date, y: it.weight, reps: it.reps });
  }
  h += `<h2>Übungsfortschritt</h2><div class="card">
    <select class="in" data-c="histEx" style="margin-bottom:12px">${exs.map(e => `<option value="${e.id}" ${e.id === ui.histEx ? 'selected' : ''}>${esc(e.dayId)} · ${esc(e.name)}</option>`).join('')}</select>
    ${pts.length ? lineChart(pts.slice(-20)) : '<p class="empty">Noch keine Daten für diese Übung.</p>'}
    ${pts.length ? `<div class="sess"><div class="det" style="padding-top:10px">${pts.slice(-6).reverse().map(p => `<div><span>${fmtDate(p.x)}</span><span>${fmt(p.y)} kg × ${p.reps.join(', ')}</span></div>`).join('')}</div></div>` : ''}
  </div>`;

  // Trainingsliste
  h += `<h2>Trainings</h2><div class="card">`;
  if (!sessions.length) h += `<p class="empty">Noch keine Trainings.</p>`;
  for (const s of sessions.slice().reverse().slice(0, 40)) {
    h += `<details class="sess"><summary><span><b>${esc(s.dayName)}</b><br><span class="muted small">${fmtDate(s.date)} · ${s.minutes} min${s.deload ? ' · Deload' : ''}</span></span><span class="muted small">Erschöpfung<br>${s.fatigue}/5</span></summary>
      <div class="det">${s.items.map(it => it.kind === 'cardio'
        ? `<div><span>${esc(it.name)}</span><span>${it.done ? it.duration + ' min ✓' : '–'}</span></div>`
        : `<div><span>${esc(it.name)}</span><span>${it.reps.length ? `${fmt(it.weight)} kg × ${it.reps.join(', ')}` : 'übersprungen'}</span></div>`).join('')}
      <button class="link" data-a="delSession" data-id="${s.id}">Eintrag löschen</button></div></details>`;
  }
  h += `</div>`;
  return h;
}

/* ---------- Plan & Einstellungen ---------- */

function viewPlan() {
  const day = state.plan[ui.planDay];
  let h = `<h1>Plan</h1>
    <div class="chips" style="margin:0 0 12px">${state.plan.map((d, i) => `<button class="chip ${i === ui.planDay ? 'on' : ''}" data-a="planDay" data-v="${i}">Tag ${esc(d.id)}</button>`).join('')}</div>
    <div class="card"><label class="f" style="margin:0"><span>Name des Tages</span><input class="in" value="${esc(day.name)}" data-c="dayName"></label></div>
    <div class="card">`;
  day.exercises.forEach((e, i) => {
    const sub = e.kind === 'cardio' ? `${e.duration} min · Cardio` : `${e.sets} × ${e.repMin}–${e.repMax} · aktuell ${e.targetReps} Wdh. · ${e.weight == null ? '?' : fmt(e.weight)} kg`;
    h += `<button class="plan-row" data-a="exEdit" data-i="${i}"><span class="t"><b>${esc(e.name)}</b><span>${sub}</span></span>
      <span class="icon-btn">${I.edit}</span></button>`;
  });
  h += `</div><button class="btn ghost" data-a="exAdd">+ Übung hinzufügen</button>`;

  const s = state.settings;
  h += `<h2>Einstellungen</h2><div class="card">
    <div class="grid2">
      <label class="f"><span>Stangengewicht (kg)</span><input class="in" inputmode="decimal" value="${fmt(s.barWeight)}" data-c="setBar"></label>
      <label class="f"><span>Deload alle … Wochen</span><input class="in" inputmode="numeric" value="${s.deloadWeeks}" data-c="setDeload"></label>
    </div>
    <div class="btn-row"><button class="btn sm" data-a="openSetup">Gewichte eintragen</button>
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
  if (!m) return '';
  let inner = '';
  if (m.type === 'fatigue') {
    const a = state.active;
    const open = a.items.filter(it => !itemComplete(it)).length;
    const labels = ['', 'frisch', 'locker', 'normal', 'müde', 'platt'];
    inner = `<h3>Wie erschöpft bist du?</h3>
      <p class="muted small" style="margin:0">Fließt in die Gewichte fürs nächste Mal ein.</p>
      ${open ? `<p class="small" style="color:var(--same)">${open} Übung(en) nicht abgeschlossen. Ganz ausgelassene bleiben unverändert, angefangene zählen als nicht geschafft.</p>` : ''}
      <div class="fatigue">${[1, 2, 3, 4, 5].map(v => `<button class="${ui.fatigue === v ? 'on' : ''}" data-a="fatigue" data-v="${v}">${v}<small>${labels[v]}</small></button>`).join('')}</div>
      <button class="btn primary" data-a="saveWorkout" ${ui.fatigue ? '' : 'disabled style="opacity:.4"'}>Speichern</button>
      <div style="height:8px"></div><button class="btn ghost" data-a="modalClose">Weiter trainieren</button>`;
  } else if (m.type === 'edit') {
    const day = state.plan[ui.planDay];
    const e = m.isNew ? m.draft : day.exercises[m.i];
    const isC = e.kind === 'cardio';
    const last = day.exercises.length - 1;
    inner = `<div style="display:flex;align-items:center;gap:8px"><h3 style="flex:1">${m.isNew ? 'Neue Übung' : 'Übung bearbeiten'}</h3>
      ${m.isNew ? '' : `<button class="icon-btn" data-a="exMove" data-d="-1" ${m.i === 0 ? 'disabled' : ''} aria-label="Nach oben">${I.up}</button>
      <button class="icon-btn" data-a="exMove" data-d="1" ${m.i === last ? 'disabled' : ''} aria-label="Nach unten">${I.down}</button>`}</div>
      ${m.isNew ? '' : `<p class="dim small" style="margin:0">Position ${m.i + 1} von ${last + 1}</p>`}<div style="height:10px"></div>
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
  return `<div class="modal-bg" data-a="bgClose"><div class="sheet"><div class="grab"></div>${inner}</div></div>`;
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

  openItem: el => {
    const i = +el.dataset.i;
    const cur = ui.open ?? state.active.items.findIndex(it => !itemComplete(it));
    ui.open = cur === i ? -1 : i;
    render();
    document.getElementById('item-' + i)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },
  wStep: el => {
    const it = state.active.items[+el.dataset.i];
    const inc = it.inc > 0 ? it.inc : 1;
    it.weight = Math.max(0, roundTo((it.weight ?? 0) + inc * +el.dataset.d, inc));
    save(); render();
  },
  rStep: el => {
    const it = state.active.items[+el.dataset.i];
    const s = +el.dataset.s;
    it.reps[s] = clamp(it.reps[s] + +el.dataset.d, 0, 99);
    save(); render();
  },
  toggleSet: el => {
    const i = +el.dataset.i, s = +el.dataset.s;
    const it = state.active.items[i];
    it.done[s] = !it.done[s];
    vibrate(it.done[s] ? 20 : 8);
    // Cardio fertig → nächste Übung öffnen
    if (it.kind === 'cardio' && it.done[0]) ui.open = null;
    save(); render();
    if (it.done.every(Boolean) && it.kind !== 'cardio') {
      document.querySelector(`#item-${i} .rate`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  },
  rate: el => {
    const i = +el.dataset.i;
    state.active.items[i].rating = el.dataset.v;
    vibrate(20);
    ui.open = null;
    save(); render();
    const next = state.active.items.findIndex(it => !itemComplete(it));
    if (next >= 0) document.getElementById('item-' + next)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  },
  finish: () => { ui.fatigue = null; ui.modal = { type: 'fatigue' }; render(); },
  fatigue: el => {
    // ohne Neu-Rendern, damit das Fenster nicht neu einfährt
    ui.fatigue = +el.dataset.v; vibrate(15);
    document.querySelectorAll('[data-a=fatigue]').forEach(b => b.classList.toggle('on', b === el));
    const btn = document.querySelector('[data-a=saveWorkout]');
    btn.disabled = false; btn.style.opacity = '';
  },
  saveWorkout: () => { if (ui.fatigue) finishWorkout(ui.fatigue); },
  cancelWorkout: () => {
    if (!confirm('Training abbrechen? Es wird nichts gespeichert.')) return;
    state.active = null; save(); keepAwake(false); ui.tab = 'home'; render();
  },
  closeSummary: () => { ui.summary = null; ui.tab = 'home'; render(); window.scrollTo(0, 0); },

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

  planDay: el => { ui.planDay = +el.dataset.v; render(); },
  exMove: el => {
    const list = state.plan[ui.planDay].exercises;
    const i = ui.modal.i, j = i + +el.dataset.d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    ui.modal.i = j;
    save(); render();
    document.querySelector('.modal-bg').style.animation = 'none';
    document.querySelector('.sheet').style.animation = 'none';
  },
  exEdit: el => { ui.modal = { type: 'edit', i: +el.dataset.i }; render(); },
  exAdd: () => { ui.modal = { type: 'edit', isNew: true, draft: ex('', 'dumbbell', 3, 10, 12, 2, 90) }; render(); },
  exSave: () => {
    const m = ui.modal;
    const list = state.plan[ui.planDay].exercises;
    const v = id => document.getElementById(id)?.value ?? '';
    const name = v('f-name').trim();
    if (!name) return toast('Bitte einen Namen eingeben');
    const kind = v('f-kind');
    const base = m.isNew ? m.draft : list[m.i];
    let e;
    if (kind === 'cardio') {
      e = { id: base.id, name, kind, duration: Math.max(1, num(v('f-duration')) || 20), note: v('f-note').trim() };
    } else {
      const repMin = Math.max(1, Math.round(num(v('f-repMin')) || 8));
      const repMax = Math.max(repMin, Math.round(num(v('f-repMax')) || repMin));
      e = {
        id: base.id, name, kind,
        sets: clamp(Math.round(num(v('f-sets')) || 3), 1, 10),
        repMin, repMax,
        targetReps: clamp(Math.round(num(v('f-target')) || repMin), repMin, repMax),
        weight: num(v('f-weight')),
        inc: Math.max(0, num(v('f-inc')) ?? 2.5),
        rest: Math.max(0, Math.round(num(v('f-rest')) ?? 90)),
        note: v('f-note').trim(),
        fails: base.fails || 0,
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

  deloadNow: () => {
    if (isDeload()) state.deload = { remaining: 0, sessionsSince: 0 };
    else state.deload = { remaining: 3, sessionsSince: 0 };
    save(); render(); toast(isDeload() ? 'Nächste 3 Trainings: Deload' : 'Deload beendet');
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
    state = defaultState(); save(); ui.tab = 'setup'; ui.planDay = 0; render();
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
  import: el => {
    const file = el.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data.plan)) throw new Error('kein Plan');
        if (!confirm('Backup laden? Die aktuellen Daten werden ersetzt.')) return;
        state = Object.assign(defaultState(), data);
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
  if (ev.key === 'Enter' && ev.target.matches('input.in, .weight-box input')) ev.target.blur();
});

// Laufzeit im Training aktualisieren
setInterval(() => {
  const el = document.getElementById('elapsed');
  if (el && state.active) el.textContent = Math.round((Date.now() - new Date(state.active.startedAt).getTime()) / 60000);
}, 30000);

/* ---------- Start ---------- */

if (state.active && ui.tab !== 'setup') ui.tab = 'workout';
render();

// Kein Offline-Cache beim lokalen Testen am PC, damit Änderungen sofort sichtbar sind
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
try { navigator.storage?.persist?.(); } catch (e) { }
