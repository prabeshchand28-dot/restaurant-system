// public/js/autoupdate.js
// Auto-update: polls /api/ping every 15s.
// If the server restarts (buildId changes), shows a banner and auto-reloads the page.

(function () {
  let knownBuildId = null;
  let reloading    = false;
  let failStreak   = 0;

  async function checkVersion() {
    if (reloading) return;
    try {
      const res  = await fetch('/api/ping', { cache: 'no-store' });
      if (!res.ok) { failStreak++; return; }
      const data = await res.json();
      failStreak = 0;

      if (!knownBuildId) {
        // First successful check — store the current buildId
        knownBuildId = data.buildId;
        return;
      }

      if (data.buildId !== knownBuildId) {
        // Server was updated / restarted with new code
        reloading = true;
        showUpdateBanner();
        setTimeout(async () => {
          // Clear all SW caches so fresh JS/CSS is served after reload
          if ('caches' in window) {
            try {
              const keys = await caches.keys();
              await Promise.all(keys.map(k => caches.delete(k)));
            } catch (_) {}
          }
          location.reload(true);
        }, 2500);
      }
    } catch (_) {
      failStreak++;
      // Server unreachable — skip, don't reload
    }
  }

  function showUpdateBanner() {
    // Remove any existing banner
    const old = document.getElementById('__autoupdate_banner__');
    if (old) old.remove();

    const banner = document.createElement('div');
    banner.id = '__autoupdate_banner__';
    banner.innerHTML = `
      <span style="font-size:18px">🔄</span>
      <span>System update bhayo — page refresh hudai xa...</span>
      <div style="width:0;height:3px;background:rgba(255,255,255,.5);border-radius:2px;
        animation:au-progress 2.2s linear forwards;margin-top:6px;border-radius:2px"></div>
    `;
    banner.style.cssText = `
      position:fixed;top:0;left:0;right:0;z-index:999999;
      background:#1a7a3a;color:#fff;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:12px 20px;font-size:14px;font-weight:700;
      font-family:'Plus Jakarta Sans',Arial,sans-serif;
      box-shadow:0 2px 16px rgba(0,0,0,.3);
      gap:4px;
    `;

    // Progress bar animation
    const style = document.createElement('style');
    style.textContent = `@keyframes au-progress{from{width:0}to{width:100%}}`;
    document.head.appendChild(style);
    document.body.prepend(banner);
  }

  // Poll every 15 seconds
  setInterval(checkVersion, 15000);

  // First check after 3 seconds (let page fully load first)
  setTimeout(checkVersion, 3000);
})();
