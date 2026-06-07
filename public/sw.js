// public/sw.js — Restaurant System Service Worker
// Offline First: cache static assets, queue failed API calls

const CACHE_NAME  = 'restaurant-v1';
const STATIC_URLS = [
  '/', '/dashboard', '/payment', '/kitchen', '/staff', '/order',
  '/css/style.css', '/css/dashboard.css',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

// ── Install: cache static assets ────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_URLS.filter(u => !u.startsWith('http') || u.includes('googleapis') || u.includes('jsdelivr'))))
      .catch(() => {}) // don't fail install if some assets missing
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network first, fallback to cache ─────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network first, queue if offline (POST/PATCH/PUT/DELETE)
  if (url.pathname.startsWith('/api/')) {
    if (['POST','PATCH','PUT','DELETE'].includes(request.method)) {
      event.respondWith(networkWithOfflineQueue(request));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  // Static assets: cache first
  event.respondWith(cacheFirst(request));
});

// ── Strategies ───────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache    = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache    = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkWithOfflineQueue(request) {
  try {
    return await fetch(request);
  } catch {
    // Save to offline queue — send message to client
    const body = await request.clone().text();
    const queuedItem = {
      id:        Date.now().toString(),
      url:       request.url,
      method:    request.method,
      headers:   Object.fromEntries(request.headers.entries()),
      body,
      timestamp: Date.now(),
    };
    // Notify all clients to queue this request
    self.clients.matchAll().then(clients =>
      clients.forEach(c => c.postMessage({ type: 'QUEUE_REQUEST', item: queuedItem }))
    );
    return new Response(JSON.stringify({
      success:  true,
      offline:  true,
      queued:   true,
      queueId:  queuedItem.id,
      message:  'Saved offline — will sync when online',
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}

// ── Background Sync trigger ──────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SYNC_NOW') {
    self.clients.matchAll().then(clients =>
      clients.forEach(c => c.postMessage({ type: 'DO_SYNC' }))
    );
  }
});
