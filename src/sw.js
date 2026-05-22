// Daily Wiki service worker v2
// Handles: caching, offline support, daily reminder notifications

const CACHE_NAME = 'daily-wiki-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

// ── Install ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Wikipedia API: network-first with cache fallback
  if (url.hostname === 'en.wikipedia.org') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok && request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
        }
        return res;
      });
    })
  );
});

// ── Notification scheduling ──────────────────────────────────────────
// We use a simple setTimeout approach. The service worker stays alive
// while the browser is open; for true background delivery the user
// would need the site installed as a PWA (Add to Home Screen).

let reminderTimeout = null;

function scheduleNotification(msUntil, hour) {
  clearTimeout(reminderTimeout);

  reminderTimeout = setTimeout(async () => {
    await self.registration.showNotification('Daily Wiki 📖', {
      body: "Today's article is waiting for you. Keep your streak alive!",
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-reminder',
      renotify: true,
      data: { url: '/' },
      actions: [
        { action: 'open', title: 'Read now' },
        { action: 'dismiss', title: 'Later' },
      ],
    });

    // Re-schedule for next day (same hour)
    const nextMs = 24 * 60 * 60 * 1000;
    scheduleNotification(nextMs, hour);
  }, msUntil);
}

// ── Message handler ──────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, msUntil, hour } = event.data || {};

  if (type === 'SCHEDULE_REMINDER') {
    scheduleNotification(msUntil, hour || 9);
  }

  if (type === 'CANCEL_REMINDER') {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
});

// ── Notification click ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app already open, focus it
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Otherwise open a new tab
      return clients.openWindow('/');
    })
  );
});
