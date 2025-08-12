const CACHE_NAME = 'hoopboard-v5';
const urlsToCache = [
  '/',
  '/Index.html?v=5',
  '/lockerroom.html?v=5',
  '/post.html?v=5',
  '/about.html?v=5',
  '/styles.css?v=5',
  '/script.js?v=5',
  '/firebase-init.js?v=5',
  '/Real Hoop Board logo.png',
  '/favicon.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Always try to fetch fresh content first, fallback to cache
        return fetch(event.request)
          .then(freshResponse => {
            // Update cache with fresh content
            const responseClone = freshResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return freshResponse;
          })
          .catch(() => {
            // If network fails, use cached version
            return response;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 