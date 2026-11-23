const CACHE = 'mnemonix-shell-v2';
const shell = ['/', '/assets/style.css', '/assets/app.js', '/assets/art.js', '/assets/views.js', '/assets/legal.js',
  '/assets/progress.js', '/assets/training.js', '/assets/seed.js', '/assets/manrope.woff2', '/assets/space.woff2',
  '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(shell)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mnemonix-shell-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || !shell.includes(url.pathname)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(url.pathname, copy)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match(url.pathname)));
});
