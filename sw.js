// DEFCON MINUTEUR — Service Worker
// Cache les ressources pour usage hors-ligne

const CACHE_NAME = 'defcon-v2';
const CACHE_URLS = ['/', '/index.html', '/manifest.json'];

// ── Installation : mise en cache des ressources statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : cache-first pour les assets, network-first pour le reste
self.addEventListener('fetch', event => {
  // Ne gérer que les requêtes GET same-origin
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Mettre en cache les nouvelles ressources réussies
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback vers la page principale si hors-ligne
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
