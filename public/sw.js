// Service Worker for XAUUSD AI Scalping Bot PWA
const CACHE_NAME = 'xauusd-bot-v4.0.0-live';
const ASSETS = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network first, strictly fresh for HTML and JS
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // API calls are strictly network-first
  if (event.request.url.includes('/api/')) {
    // For auth endpoints, let browser handle fetch directly so retry and 401/transient errors are not masked
    if (event.request.url.includes('/api/auth/')) {
      return;
    }
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline - បាត់បង់ការភ្ជាប់អ៊ីនធឺណិត' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Always try network first to guarantee live UI updates
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
