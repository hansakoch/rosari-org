/**
 * sw.js — Service Worker for rosari.org
 * Provides offline support, asset caching, and background sync
 */

const CACHE_NAME = 'rosari-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

// ── Install ─────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache core assets
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continue even if some assets fail
        return Promise.resolve();
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// ── Activate ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't intercept API calls or external resources
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for HTML (always get fresh rosary)
  if (request.mode === 'navigate' || request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('/')))
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, fonts, images)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.status < 400) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// ── Message Handler ─────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_ALL') {
    // Pre-cache all navigable pages
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(['/']).catch(() => {});
    });
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
