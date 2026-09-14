/* JPTL Property Management — Service Worker for PWA + Web Push */
/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'jptl-cache-v2';
const PRECACHE_URLS = ['/', '/manifest.json'];

// Install: pre-cache shell assets & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-First with Cache Fallback (guarantees latest code, prevents stale dev/prod cache)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Always bypass caching for API calls, dev HMR, or non-GET requests
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    request.url.includes('/@vite/') ||
    request.url.includes('/@fs/') ||
    request.url.includes('hot-update')
  ) {
    return;
  }

  // Network-first strategy for navigation and static assets
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Push notification
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'JPTL Notification', body: event.data?.text() || '' };
  }

  const title = data.title || 'JPTL Property Management';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'jptl-notification',
    renotify: true,
    timestamp: data.timestamp || Date.now(),
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open Portal' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
