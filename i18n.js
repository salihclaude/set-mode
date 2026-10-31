'use strict';

/* =========================================================
   SET Mode – Internationalisierung
   Jede Sprache liegt in lang/<code>.js und meldet sich mit
   I18N.add(code, meta, dict) an. Neue Sprache = neue Datei
   + <script>-Tag in index.html + Eintrag in sw.js.
   Fehlende Schlüssel fallen auf Deutsch zurück.
   ========================================================= */

const I18N = {
  dicts: {},
  meta: {},
  order: [],
  lang: 'de',
  fallback: 'de',
  add(code, meta, dict) {
    this.meta[code] = meta;
    this.dicts[code] = dict;
    if (!this.order.includes(code)) this.order.push(code);
  },
  has(code) { return !!this.dicts[code]; },
  detect() {
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'de'])
      .map(l => String(l).slice(0, 2).toLowerCase());
    return prefs.find(l => this.has(l)) || this.fallback;
  },
  set(code) {
    this.lang = this.has(code) ? code : this.fallback;
    document.documentElement.lang = this.lang;
  },
  locale() { return (this.meta[this.lang] || this.meta[this.fallback]).locale; },
};

function i18nLookup(dict, key) {
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);
}

/* Übersetzung mit Platzhaltern {name}. Werte können auch Funktionen sein (z. B. für Plural). */
function t(key, params) {
  let v = i18nLookup(I18N.dicts[I18N.lang], key);
  if (v == null) v = i18nLookup(I18N.dicts[I18N.fallback], key);
  if (v == null) return key;
  if (typeof v === 'function') return v(params || {});
  if (params && typeof v === 'string') return v.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
  return v;
}

/* Wie t(), liefert aber null statt des Schlüssels, wenn es keinen Text gibt. */
function tOpt(key, params) {
  const has = i18nLookup(I18N.dicts[I18N.lang], key) ?? i18nLookup(I18N.dicts[I18N.fallback], key);
  return has == null ? null : t(key, params);
}
