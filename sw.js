const CACHE_NAME = 'biblical-icons-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon-64.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  // Bypass the HTTP cache so a new version always stores fresh copies.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' ||
    (url.origin === self.location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')));

  if (isPage) {
    // Network-first for the app page: new words show as soon as the phone is online,
    // with the cached copy as the offline fallback.
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then((c) => c || caches.match('./')))
    );
    return;
  }

  // Cache-first for icons and other static files.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
