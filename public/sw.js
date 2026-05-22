const CACHE_NAME = 'pysync-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then(fetchRes => {
          // Cache the fetched response if it's a valid response
          if (!fetchRes || fetchRes.status !== 200 || fetchRes.type !== 'basic') {
            return fetchRes;
          }
          
          const responseToCache = fetchRes.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, responseToCache);
              }
            });
            
          return fetchRes;
        }).catch(() => {
          // Fallback if offline and nothing in cache
          // Optionally return a custom offline page here
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
