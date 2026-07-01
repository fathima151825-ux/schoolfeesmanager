const CACHE_NAME = 'ssvm-fees-app-v1';
const RUNTIME_CACHE = 'ssvm-runtime-v1';
const API_CACHE = 'ssvm-api-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/images/no_image.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extensions and non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.hostname.includes('supabase.co') || request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response before caching
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        })
    );
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncOfflinePayments());
  }
  if (event.tag === 'sync-student-data') {
    event.waitUntil(syncOfflineStudentData());
  }
});

// Sync offline payments when online
async function syncOfflinePayments() {
  try {
    const cache = await caches.open('offline-payments');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Attempt to send to server
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(data)
        });
        
        // Remove from cache after successful sync
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync payment:', error);
      }
    }
  } catch (error) {
    console.error('Sync payments error:', error);
  }
}

// Sync offline student data when online
async function syncOfflineStudentData() {
  try {
    const cache = await caches.open('offline-student-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Attempt to send to server
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(data)
        });
        
        // Remove from cache after successful sync
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync student data:', error);
      }
    }
  } catch (error) {
    console.error('Sync student data error:', error);
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});