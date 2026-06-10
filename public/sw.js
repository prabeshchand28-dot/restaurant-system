// public/sw.js — Restaurant System Service Worker
// Strategy: HTML pages always network-first (so updates are instant),
//           API calls always network-first with offline fallback,
//           True static assets (css/js/fonts) cache-first.

const CACHE_NAME  = 'restaurant-v4';  // bumped — HTML now network-only

// Only cache actual static files, NOT html pages
const STATIC_URLS = [
  '/css/style.css',
  '/css/dashboard.css',
];

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate: wipe ALL old caches ───────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET for caching logic
  if (request.method !== 'GET') {
    event.respondWith(networkWithOfflineQueue(request));
    return;
  }

  // API GET calls: network first, offline JSON fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, true));
    return;
  }

  // HTML pages: ALWAYS go to network — never serve stale pages from cache
  const isPage = !url.pathname.includes('.') || url.pathname.endsWith('.html');
  if (isPage) {
    event.respondWith(fetch(request).catch(() =>
      caches.match(request).then(c => c || new Response('<h2>Offline — start the server and refresh</h2>', {
        status: 503, headers: { 'Content-Type': 'text/html' }
      }))
    ));
    return;
  }

  // True static assets (.css, .js, fonts): cache first
  event.respondWith(cacheFirst(request));
});

// ── Strategies ───────────────────────────────────────────
async function networkFirst(request, isApi) {
  try {
    const response = await fetch(request);
    // Only cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (isApi) {
      return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('<h2>Offline — start the server and refresh</h2>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkWithOfflineQueue(request) {
  try {
    return await fetch(request);
  } catch {
    const body = await request.clone().text();
    const queuedItem = {
      id: Date.now().toString(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    };
    self.clients.matchAll().then(clients =>
      clients.forEach(c => c.postMessage({ type: 'QUEUE_REQUEST', item: queuedItem }))
    );
    return new Response(JSON.stringify({
      success: true, offline: true, queued: true,
      queueId: queuedItem.id,
      message: 'Saved offline — will sync when online',
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}

// ── Background Sync ──────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SYNC_NOW') {
    self.clients.matchAll().then(clients =>
      clients.forEach(c => c.postMessage({ type: 'DO_SYNC' }))
    );
  }
});
