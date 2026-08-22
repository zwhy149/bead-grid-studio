const CACHE_PREFIX = 'bead-grid-studio-community-';
const CACHE_NAME = `${CACHE_PREFIX}v1.1.2`;
const APP_SHELL = [
  './manifest.webmanifest',
  './app-icon.svg',
  './app-icon-192.png',
  './app-icon-512.png',
  './legal.css',
  './privacy.html',
  './privacy.en.html',
  './terms.html',
  './terms.en.html',
  './LICENSE.txt',
  './NOTICE.txt',
  './version.json',
];

async function precacheApplication() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch('./index.html', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to cache application shell (${response.status})`);
  const html = await response.clone().text();
  const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((match) => match[1]);
  await cache.put('./index.html', response);
  await cache.addAll([...APP_SHELL, ...new Set(assets)]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheApplication().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(async () => {
          const cachedPage = await caches.match(request, { ignoreSearch: true });
          return cachedPage || caches.match('./index.html');
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && ['script', 'style', 'image', 'manifest'].includes(request.destination)) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
