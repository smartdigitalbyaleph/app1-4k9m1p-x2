// Service worker Kleo Budget — mise en cache pour usage hors ligne.
// Incrémentez CACHE_NAME à chaque nouvelle version mise en ligne
// pour forcer les navigateurs à récupérer les fichiers à jour.
const CACHE_NAME = 'kleo-budget-cache-v1.6.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Installation : on met en cache la coquille de l'application.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => console.warn('Kleo SW: cache initial incomplet', err))
  );
  self.skipWaiting();
});

// Activation : on supprime les anciens caches de versions précédentes.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Stratégie "cache d'abord, réseau en secours" :
// l'app s'ouvre instantanément depuis le cache, même hors ligne,
// et se met à jour silencieusement dès qu'une connexion est disponible.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
