// public/js/offline.js — Offline First Manager
// IndexedDB + Auto Sync + Conflict Resolution + Status Indicator

const OfflineManager = (() => {
  const DB_NAME    = 'restaurant_offline';
  const DB_VERSION = 1;
  const STORES     = { queue: 'sync_queue', orders: 'offline_orders', cache: 'api_cache' };

  let db = null;
  let isOnline = navigator.onLine;
  let syncInProgress = false;
  let statusEl = null;

  // ── IndexedDB init ────────────────────────────────────
  async function initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORES.queue))
          d.createObjectStore(STORES.queue, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(STORES.orders))
          d.createObjectStore(STORES.orders, { keyPath: 'localId' });
        if (!d.objectStoreNames.contains(STORES.cache))
          d.createObjectStore(STORES.cache, { keyPath: 'key' });
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror   = e => reject(e.target.error);
    });
  }

  function dbOp(store, mode, op) {
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, mode);
      const st  = tx.objectStore(store);
      const req = op(st);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  // ── Offline Order Save ────────────────────────────────
  async function saveOrderOffline(orderData) {
    const localId = 'offline_' + Date.now();
    const order   = { ...orderData, localId, offline: true, createdAt: new Date().toISOString() };
    await dbOp(STORES.orders, 'readwrite', st => st.put(order));
    await queueRequest('POST', '/api/orders', orderData);
    showToast('📴 Offline — Order saved locally', 'warning');
    return { success: true, offline: true, order };
  }

  async function getOfflineOrders() {
    return dbOp(STORES.orders, 'readonly', st => st.getAll());
  }

  // ── Sync Queue ────────────────────────────────────────
  async function queueRequest(method, url, body) {
    const item = { id: Date.now().toString() + Math.random(), method, url, body, timestamp: Date.now() };
    await dbOp(STORES.queue, 'readwrite', st => st.put(item));
    updateStatus();
  }

  async function getQueue() {
    return dbOp(STORES.queue, 'readonly', st => st.getAll());
  }

  async function removeFromQueue(id) {
    return dbOp(STORES.queue, 'readwrite', st => st.delete(id));
  }

  // ── Auto Sync ─────────────────────────────────────────
  async function sync() {
    if (!isOnline || syncInProgress) return;
    const queue = await getQueue();
    if (!queue.length) { updateStatus(); return; }

    syncInProgress = true;
    updateStatus('syncing');
    let synced = 0, failed = 0;

    for (const item of queue) {
      try {
        const res = await fetch(item.url, {
          method:  item.method,
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body:    JSON.stringify(item.body),
        });
        if (res.ok) {
          await removeFromQueue(item.id);
          synced++;
          // Remove from offline orders if it was an order
          if (item.url.includes('/api/orders') && item.method === 'POST') {
            const all = await getOfflineOrders();
            const match = all.find(o => o.localId && Math.abs(o.localId.split('_')[1] - item.id.split('.')[0]) < 1000);
            if (match) await dbOp(STORES.orders, 'readwrite', st => st.delete(match.localId));
          }
        } else { failed++; }
      } catch { failed++; }
    }

    syncInProgress = false;
    if (synced > 0) showToast(`✅ Synced ${synced} item${synced>1?'s':''} to server`, 'success');
    if (failed  > 0) showToast(`⚠️ ${failed} item${failed>1?'s':''} failed to sync`, 'error');
    updateStatus();
    return { synced, failed };
  }

  // ── Conflict Resolution ───────────────────────────────
  // Simple: server wins for GET, local wins for mutations (last-write)
  async function resolveConflict(localData, serverData) {
    // If timestamps available, take the newer one
    const localTime  = new Date(localData.updatedAt || localData.createdAt || 0);
    const serverTime = new Date(serverData.updatedAt || serverData.createdAt || 0);
    return localTime > serverTime ? localData : serverData;
  }

  // ── Status Indicator ──────────────────────────────────
  function createStatusBar() {
    if (document.getElementById('offline-status-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'offline-status-bar';
    bar.style.cssText = `
      position:fixed;bottom:0;left:0;right:0;z-index:9999;
      padding:8px 16px;font-size:12px;font-weight:700;
      display:none;align-items:center;justify-content:space-between;
      font-family:'Plus Jakarta Sans',sans-serif;
    `;
    bar.innerHTML = `
      <span id="offline-status-text">📴 Offline</span>
      <span id="offline-queue-count" style="opacity:.8"></span>
      <button id="offline-sync-btn" onclick="OfflineManager.sync()" 
        style="background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.4);
        color:#fff;padding:3px 10px;border-radius:5px;cursor:pointer;font-size:11px;font-family:inherit">
        🔄 Sync Now
      </button>
    `;
    document.body.appendChild(bar);
    statusEl = bar;
  }

  async function updateStatus(state) {
    if (!statusEl) createStatusBar();
    const queue = await getQueue();
    const count = queue.length;
    const textEl  = document.getElementById('offline-status-text');
    const countEl = document.getElementById('offline-queue-count');

    if (!isOnline) {
      statusEl.style.display    = 'flex';
      statusEl.style.background = '#dc2626';
      textEl.textContent        = '📴 Offline Mode — Data saved locally';
      countEl.textContent       = count > 0 ? `${count} item${count>1?'s':''} queued` : '';
    } else if (state === 'syncing') {
      statusEl.style.display    = 'flex';
      statusEl.style.background = '#f59e0b';
      textEl.textContent        = '🔄 Syncing...';
      countEl.textContent       = `${count} remaining`;
    } else if (count > 0) {
      statusEl.style.display    = 'flex';
      statusEl.style.background = '#2563eb';
      textEl.textContent        = '🌐 Online — Pending sync';
      countEl.textContent       = `${count} item${count>1?'s':''} to sync`;
    } else {
      statusEl.style.display = 'none';
    }
  }

  function showToast(msg, type = 'info') {
    if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;top:16px;left:50%;transform:translateX(-50%);
      background:${type==='success'?'#22c55e':type==='error'?'#ef4444':'#f59e0b'};
      color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:700;
      z-index:10000;font-family:inherit;pointer-events:none`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  // ── Online / Offline Events ───────────────────────────
  window.addEventListener('online', () => {
    isOnline = true;
    updateStatus();
    setTimeout(sync, 1000); // sync after 1s delay
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    updateStatus();
  });

  // ── Service Worker Message Handler ────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'QUEUE_REQUEST') {
        dbOp(STORES.queue, 'readwrite', st => st.put(event.data.item)).then(updateStatus);
      }
      if (event.data?.type === 'DO_SYNC') sync();
    });
  }

  // ── Register Service Worker ───────────────────────────
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('✅ Service Worker registered:', reg.scope);
      // Trigger sync when SW activates
      reg.addEventListener('updatefound', () => {
        reg.installing?.addEventListener('statechange', e => {
          if (e.target.state === 'activated') sync();
        });
      });
    } catch (e) { console.warn('SW registration failed:', e); }
  }

  // ── Init ──────────────────────────────────────────────
  async function init() {
    await initDB();
    createStatusBar();
    updateStatus();
    registerSW();
    // Auto sync every 30s when online
    setInterval(() => { if (isOnline && !syncInProgress) sync(); }, 30000);
  }

  // ── Offline-aware fetch wrapper ───────────────────────
  async function apiFetch(method, url, body) {
    if (!isOnline && ['POST','PATCH','PUT','DELETE'].includes(method)) {
      await queueRequest(method, url, body);
      if (method === 'POST' && url.includes('/api/orders')) {
        return saveOrderOffline(body);
      }
      return { success: true, offline: true, queued: true };
    }
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return res.json();
    } catch (e) {
      if (['POST','PATCH','PUT','DELETE'].includes(method)) {
        await queueRequest(method, url, body);
        return { success: true, offline: true, queued: true, message: 'Saved offline' };
      }
      throw e;
    }
  }

  return { init, sync, apiFetch, saveOrderOffline, getOfflineOrders, getQueue, isOnline: () => isOnline };
})();

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => OfflineManager.init());
