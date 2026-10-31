// SET Mode – Offline-Cache. Bei Änderungen an der App die Version erhöhen.
const CACHE = 'setmode-v5';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'i18n.js',
  'lang/de.js',
  'lang/en.js',
  'lang/es.js',
  'lang/tr.js',
  'data.js',
  'anim.js',
  'voice.js',
  'audio/manifest.json',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

// Beim Installieren immer frisch vom Server laden (nicht aus dem HTTP-Cache),
// damit nie alte und neue Dateien gemischt werden.
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Sofort aus dem Cache (schnell auch bei schlechtem Netz im Gym),
// im Hintergrund aktualisieren – Updates greifen beim nächsten Öffnen.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const cached = await c.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request, { cache: 'no-cache' })
        .then(res => { if (res.ok) c.put(e.request, res.clone()); return res; })
        .catch(() => cached || c.match('index.html'));
      return cached || fresh;
    })
  );
});
