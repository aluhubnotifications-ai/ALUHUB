const CACHE_NAME = 'aluhub-v31';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json',
];

// On install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Failed to cache some assets (this is OK):', err.message);
        });
      })
      .then(() => {
        console.log('[SW] Install complete');
        self.skipWaiting();
      })
  );
});

// On activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// On fetch: network-first for API/data, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network-first (always try server)
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((c) => c.put(request, responseClone))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches
            .match(request)
            .then((cached) => cached || new Response('Offline', { status: 503 }));
        })
    );
  }

  // App JS/CSS (/app/*): network-first so deploys are picked up immediately
  if (url.pathname.startsWith('/app/')) {
    return event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((c) => c.put(request, responseClone))
              .catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || new Response('', { status: 503 }))
        )
    );
  }

  // Everything else (logo, manifest, index): cache-first
  event.respondWith(
    caches
      .match(request)
      .then((cached) => cached || fetch(request))
      .catch(() => new Response('Offline', { status: 503 }))
  );
});

// On push: show notification
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let notifData;
  try {
    notifData = event.data.json();
  } catch {
    notifData = { title: 'ALUHub', body: event.data.text() };
  }

  const options = {
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: notifData.tag || 'aluhub-notification',
    requireInteraction: notifData.requireInteraction || false,
    ...notifData,
  };

  event.waitUntil(self.registration.showNotification(notifData.title || 'ALUHub', options));
});

// On notification click: focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
