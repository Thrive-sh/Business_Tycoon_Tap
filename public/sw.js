/* ==========================================================================
   BUSINESS TYCOON TAP - SERVICE WORKER (OFFLINE CACHE-FIRST)
   ========================================================================== */

const CACHE_NAME = 'business-tycoon-tap-v19';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/core/base.css',
  './assets/core/preview.css',
  './assets/core/responsive.css',
  './assets/core/dom.js',
  './assets/core/config.js',
  './assets/core/assets.js',
  './assets/core/format.js',
  './assets/core/state.js',
  './assets/core/feedback.js',
  './assets/core/badges.js',
  './assets/core/milestones.js',
  './assets/core/preview.js',
  './assets/core/main.js',
  './assets/tabs/earnings/earnings.css',
  './assets/tabs/earnings/earnings.js',
  './assets/tabs/investing/investing.css',
  './assets/tabs/investing/investing.js',
  './assets/tabs/business/business.css',
  './assets/tabs/business/business.js',
  './assets/tabs/items/items.js',
  './assets/tabs/profile/profile.css',
  './assets/tabs/profile/profile.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(function (networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, cloned);
            });
          }
          return networkResponse;
        })
        .catch(function () {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
    })
  );
});
