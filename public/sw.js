const CACHE_NAME = 'zaka-plus-cache-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Firebase Firestore, auth, or other gRPC/long-polling requests
  if (!url.protocol.startsWith('http') || 
      url.hostname.includes('firestore.googleapis.com') || 
      url.hostname.includes('identitytoolkit.googleapis.com') || 
      url.hostname.includes('securetoken.googleapis.com') ||
      url.pathname.includes('/api/')) {
    return;
  }

  // Stale-While-Revalidate Strategy
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request, { ignoreSearch: true });
      
      if (cachedResponse) {
        // Return cached response immediately and fetch new version in background
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(err => {
            console.warn('Background update failed:', err);
          });
        
        event.waitUntil(fetchPromise);
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache the response
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      });
    })
  );
});
