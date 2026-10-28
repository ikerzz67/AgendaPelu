/* Service worker: permite abrir la app sin conexión. No toca los datos (esos viven en IndexedDB). */
const CACHE = 'agenda-peluqueria-v1.0.0';
const FILES = [
  './', 'index.html', 'reservar.html', 'styles.css', 'common.js', 'db.js', 'app.js', 'reservar.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('agenda-peluqueria-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Primero la copia guardada (rápido y sin conexión); en segundo plano se actualiza para la próxima vez. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
