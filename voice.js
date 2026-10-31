'use strict';

/* =========================================================
   SET Mode – Voiceover für die Übungserklärungen
   Zuordnung:  Übungs-ID + Sprache → Sprechtext → Audioquelle
   - Sprechtext: wird aus den vorhandenen Erklärungstexten der Sprache
     gebaut (lang/<code>.js → ex.<id>: name, exec, cue, mistake).
   - Quelle 1 (bevorzugt): Studioaufnahmen (ElevenLabs) audio/<lang>/<id>.mp3 mit
     Satzanfängen (marks), gelistet in audio/manifest.json. Sie werden nur
     genutzt, wenn der Text-Hash zum aktuellen Text passt (geänderter Text →
     Aufnahme gilt als veraltet). Ältere Form audio/<lang>/<id>/<n>.<ext>
     (ein Satz pro Datei) wird weiter unterstützt. Siehe VOICEOVER.md.
   - Quelle 2 (Rückfall): Sprachausgabe des Geräts (Web Speech API), aber nur
     mit einer Stimme der gewählten Sprache – nie mit einer fremden Stimme.
   Wiedergabe satzweise: So folgt die Animation dem Gesprochenen, und
   Pausieren/Fortsetzen ist auch dort zuverlässig, wo speechSynthesis.pause()
   nicht funktioniert (Android).
   ========================================================= */

const VOICE = (() => {
  const MANIFEST_URL = 'audio/manifest.json';
  const RATE = 0.95;
  let manifest = null;
  let voices = [];
  let session = null;
  const listeners = new Set();

  /* ---------- reine Hilfsfunktionen (auch für Tests) ---------- */

  function hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  function splitSentences(text) {
    return String(text || '').split(/(?<=[.!?…])\s+(?=\S)/).map(s => s.trim()).filter(Boolean);
  }
  const withStop = s => (/[.!?…]$/.test(s) ? s : s + '.');

  /* Strikter Zugriff auf genau eine Sprache – kein Rückfall auf Deutsch,
     damit nie ein fremdsprachiger Text vorgelesen wird. */
  function strict(lang, key) {
    const v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), I18N.dicts[lang]);
    return typeof v === 'string' && v.trim() ? v : null;
  }

  /* Abkürzungen und Zahlenbereiche aussprechbar machen (Regeln je Sprache) */
  function speakable(text, lang) {
    const d = I18N.dicts[lang]?.voice || {};
    let s = String(text);
    for (const [re, rep] of d.abbr || []) s = s.replace(new RegExp(re, 'g'), rep);
    if (d.range) s = s.replace(/(\d)\s*[–-]\s*(\d)/g, `$1 ${d.range} $2`);
    return s.replace(/\s+/g, ' ').trim();
  }

  /* Sprechtext in Sätzen: Name → Ausführung → wichtigster Tipp → häufiger Fehler */
  function script(id, lang) {
    const name = strict(lang, `ex.${id}.name`), exec = strict(lang, `ex.${id}.exec`);
    const cue = strict(lang, `ex.${id}.cue`), mistake = strict(lang, `ex.${id}.mistake`);
    const tip = strict(lang, 'voice.tip'), fault = strict(lang, 'voice.mistake');
    if (!name || !exec || !cue || !mistake || !tip || !fault) return null;
    const execS = splitSentences(exec).map(withStop);
    const sentences = [withStop(name), ...execS, withStop(`${tip} ${cue}`), withStop(`${fault} ${mistake}`)].map(s => speakable(s, lang));
    return { id, lang, sentences, execCount: execS.length, hash: hash(sentences.join('\n')) };
  }

  /* Stimmenwahl: nur passende Sprache; bevorzugt hochwertige, lokale Stimmen */
  function scoreVoice(v, lang, locale) {
    const vl = String(v.lang || '').toLowerCase().replace('_', '-');
    if (vl.split('-')[0] !== lang) return -1;
    let s = 1;
    if (locale && vl === locale.toLowerCase()) s += 2;
    const n = String(v.name || '').toLowerCase();
    if (/natural|neural|premium|enhanced|wavenet|studio|online/.test(n)) s += 3;
    if (/google/.test(n)) s += 2;
    if (/compact|espeak|robot/.test(n)) s -= 2;
    if (v.localService) s += 0.5;
    return s;
  }
  function pickVoice(list, lang, locale) {
    let best = null, bestScore = -1;
    for (const v of list || []) { const sc = scoreVoice(v, lang, locale); if (sc > bestScore) { best = v; bestScore = sc; } }
    return bestScore >= 0 ? best : null;
  }

  /* ---------- Umgebung ---------- */

  const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const notify = () => listeners.forEach(fn => { try { fn(); } catch (e) { } });

  function loadVoices() {
    if (!ttsSupported()) return;
    const v = speechSynthesis.getVoices();
    if (v.length && v.length !== voices.length) { voices = v; notify(); }
  }
  function init() {
    if (ttsSupported()) {
      loadVoices();
      speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
      // manche Android-Browser melden voiceschanged nicht zuverlässig
      [250, 1000, 2500].forEach(ms => setTimeout(loadVoices, ms));
    }
    if (typeof fetch === 'function') {
      fetch(MANIFEST_URL, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).then(m => { manifest = m; notify(); }).catch(() => { });
    }
  }

  /* Welche Quelle gibt es für Übung + Sprache? */
  function source(id, lang) {
    const sc = id && script(id, lang);
    if (!sc) return { type: 'none', reason: 'text' };
    const f = manifest?.files?.[lang]?.[id];
    if (f && f.hash === sc.hash && f.n === sc.sentences.length) {
      // eine Datei pro Übung mit Satzanfängen (marks) oder ältere Form: eine Datei pro Satz
      if (f.file && Array.isArray(f.marks) && f.marks.length === sc.sentences.length) return { type: 'file', script: sc, file: `${f.file}?v=${f.hash}`, marks: f.marks, voice: f.voice };
      if (!f.file) return { type: 'file', script: sc, ext: f.ext || 'mp3' };
    }
    if (!ttsSupported()) return { type: 'none', reason: 'notts', script: sc };
    const voice = pickVoice(voices, lang, I18N.meta[lang]?.locale);
    if (!voice) return { type: 'none', reason: voices.length ? 'novoice' : 'loading', script: sc };
    return { type: 'tts', script: sc, voice };
  }

  /* ---------- Wiedergabe ---------- */

  function play(id, lang, cb = {}) {
    stop();
    const src = source(id, lang);
    if (src.type === 'none') return null;
    session = { id, lang, src, cb, i: 0, seq: 0, paused: false, audio: null, timer: 0 };
    if (src.file) playTrack(session);
    else speakAt(0);
    return src;
  }

  /* Eine Aufnahme für die ganze Übung: Satzwechsel anhand der Zeitmarken melden */
  function playTrack(s) {
    const a = new Audio(s.src.file);
    a.preload = 'auto';
    s.audio = a;
    s.i = -1;
    const marks = s.src.marks;
    const tick = () => {
      if (session !== s) return;
      let i = s.i;
      while (i + 1 < marks.length && a.currentTime + 0.05 >= marks[i + 1]) i++;
      if (i !== s.i && i >= 0) { s.i = i; s.cb.onSentence?.(i, s.src.script); }
    };
    s.timer = setInterval(tick, 50);
    const fail = err => {
      if (session !== s || s.paused) return;
      halt(s);
      // z. B. offline und noch nicht im Cache: mit der Gerätestimme ab dem aktuellen Satz weitermachen
      const voice = ttsSupported() && pickVoice(voices, s.lang, I18N.meta[s.lang]?.locale);
      if (voice) { s.src = { type: 'tts', script: s.src.script, voice }; speakAt(Math.max(0, s.i)); notify(); return; }
      session = null;
      s.cb.onError?.(err);
    };
    a.onended = () => { if (session !== s) return; tick(); session = null; halt(s); s.cb.onEnd?.(); };
    a.onerror = () => fail(a.error);
    // erster Satz sofort, damit die Animation nicht auf das Laden wartet
    s.i = 0;
    s.cb.onSentence?.(0, s.src.script);
    a.play().catch(err => { if (err?.name !== 'AbortError') fail(err); });
  }

  function speakAt(i) {
    const s = session;
    if (!s) return;
    const list = s.src.script.sentences;
    if (i >= list.length) { session = null; s.cb.onEnd?.(); return; }
    s.i = i;
    const seq = ++s.seq;
    const alive = () => session === s && s.seq === seq;
    const next = () => { if (alive() && !s.paused) speakAt(i + 1); };
    const fail = err => { if (!alive()) return; session = null; halt(s); s.cb.onError?.(err); };
    s.cb.onSentence?.(i, s.src.script);

    if (s.src.type === 'file') {
      const a = new Audio(`audio/${s.lang}/${s.id}/${i + 1}.${s.src.ext}`);
      s.audio = a;
      a.onended = next;
      a.onerror = fail;
      a.play().catch(fail);
    } else {
      const u = new SpeechSynthesisUtterance(list[i]);
      u.voice = s.src.voice;
      u.lang = s.src.voice.lang;
      u.rate = RATE;
      u.pitch = 1;
      u.onend = next;
      u.onerror = e => { if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; fail(e); };
      speechSynthesis.cancel();
      speechSynthesis.resume();
      speechSynthesis.speak(u);
    }
  }

  function halt(s) {
    if (s?.timer) { clearInterval(s.timer); s.timer = 0; }
    if (s?.audio) { s.audio.onended = s.audio.onerror = null; s.audio.pause(); s.audio.removeAttribute('src'); s.audio = null; }
    if (ttsSupported()) speechSynthesis.cancel();
  }

  function pause() {
    const s = session;
    if (!s || s.paused) return;
    s.paused = true;
    if (s.audio) s.audio.pause();
    else { s.seq++; speechSynthesis.cancel(); } // Satz wird beim Fortsetzen neu begonnen
  }
  function resume() {
    const s = session;
    if (!s || !s.paused) return;
    s.paused = false;
    if (s.src.file) s.audio?.play().catch(() => { });
    else if (s.audio) s.audio.play().catch(() => speakAt(s.i));
    else speakAt(s.i);
  }
  function stop() {
    const s = session;
    session = null;
    halt(s);
  }

  return {
    init, source, play, pause, resume, stop,
    onChange: fn => listeners.add(fn),
    isActive: () => !!session,
    // für Tests und das Generator-Skript
    _: { hash, splitSentences, speakable, script, scoreVoice, pickVoice, setVoices: v => { voices = v; }, setManifest: m => { manifest = m; } },
  };
})();
