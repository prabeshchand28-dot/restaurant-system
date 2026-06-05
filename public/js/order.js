/* ═══════════════════════════
   ORDER PAGE JS
   ═══════════════════════════ */

let menu     = [];
let cart     = {};
let cartOpen = false;

// ── Tabs ──
function switchTab(tab, el) {
  document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'orders') {
    document.getElementById('ordersTabBtn').innerHTML = '📋 <span data-i18n="myOrders">My Orders</span>';
    loadMyOrders();
  }
  document.getElementById('cartBar').style.display = tab === 'menu' ? '' : 'none';
}

// ── Menu ──
function categoryEmoji(cat) {
  return { Snacks:'🥟', Noodles:'🍜', Main:'🍛', Drinks:'🥤' }[cat] || '🍽️';
}

async function loadMenu() {
  const res = await fetch('/api/menu');
  menu = await res.json();
  renderTabs();
  renderMenu('All');
}

function renderTabs() {
  const cats = ['All', ...new Set(menu.map(i => i.category))];
  document.getElementById('categoryTabs').innerHTML = cats.map(c =>
    `<button class="cat-tab ${c==='All'?'active':''}" onclick="selectTab(this,'${c}')">${c}</button>`
  ).join('');
}

function selectTab(el, cat) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderMenu(cat);
}

function renderMenu(cat) {
  const filtered = cat === 'All' ? menu : menu.filter(i => i.category === cat);
  document.getElementById('menuList').innerHTML = filtered.map(item => {
    const qty   = cart[item.id] || 0;
    const emoji = categoryEmoji(item.category);
    const imgSrc = item.image
      ? item.image
      : `https://source.unsplash.com/90x90/?${encodeURIComponent(item.name)},food`;
    return `<div class="menu-item ${qty > 0 ? 'in-cart' : ''}">
      <div class="menu-item-img">
        <img src="${imgSrc}" alt="${item.name}" onerror="this.parentElement.innerHTML='${emoji}'">
      </div>
      <div class="menu-item-body">
        <div>
          <div class="item-name">${item.name}</div>
          <div class="item-price">Rs. ${item.price}</div>
        </div>
        <div class="qty-control">
          ${qty > 0 ? `<button class="qty-btn" onclick="updateQty(${item.id},-1)">−</button><span class="qty-num">${qty}</span>` : ''}
          <button class="qty-btn add" onclick="updateQty(${item.id},1)">+</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function updateQty(id, delta) {
  cart[id] = Math.max(0, (cart[id] || 0) + delta);
  if (cart[id] === 0) delete cart[id];
  renderMenu(document.querySelector('.cat-tab.active').textContent);
  updateCartBar();
}

function updateCartBar() {
  const total = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu.find(m => m.id === parseInt(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  document.getElementById('cartCount').textContent = `${count} ${count !== 1 ? 'items' : 'item'}`;
  document.getElementById('cartTotal').textContent = `Rs. ${total}`;
  document.getElementById('cartBar').classList.toggle('visible', count > 0);
  document.getElementById('cartItemsList').innerHTML = Object.entries(cart).map(([id, qty]) => {
    const item = menu.find(m => m.id === parseInt(id));
    return `<div class="cart-row"><span>${item.name} × ${qty}</span><span>Rs. ${item.price * qty}</span></div>`;
  }).join('');
}

function toggleCart() {
  cartOpen = !cartOpen;
  document.getElementById('cartItemsList').classList.toggle('open', cartOpen);
  document.getElementById('cartToggleHint').textContent = cartOpen ? '▼ Tap to close' : '▲ Tap to review';
}

async function placeOrder() {
  const tableNo = parseInt(new URLSearchParams(window.location.search).get('table')) || 1;
  const btn     = document.getElementById('orderBtn');
  btn.disabled  = true; btn.textContent = 'Placing order…';
  const items   = Object.entries(cart).map(([id, qty]) => {
    const item = menu.find(m => m.id === parseInt(id));
    return { name: item.name, qty, price: item.price };
  });
  try {
    const res  = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: tableNo, items })
    });
    const data = await res.json();
    if (data.success) {
      cart = {}; updateCartBar();
      document.getElementById('cartBar').classList.remove('visible');
      const banner = document.getElementById('successBanner');
      banner.style.display = 'block';
      renderMenu(document.querySelector('.cat-tab.active').textContent);
      setTimeout(() => banner.style.display = 'none', 5000);
      document.getElementById('ordersTabBtn').innerHTML = '📋 My Orders <span style="background:#c0392b;color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:6px">NEW</span>';
    }
  } catch { alert('Could not place order. Please try again.'); }
  finally { btn.disabled = false; btn.textContent = 'Place Order'; }
}

// ── My Orders ──
async function loadMyOrders() {
  const tableNo = parseInt(new URLSearchParams(window.location.search).get('table')) || 1;
  try {
    const res      = await fetch('/api/orders');
    const allOrders = await res.json();
    const myOrders  = allOrders.filter(o => o.table === tableNo);
    const section   = document.getElementById('ordersSection');
    if (myOrders.length === 0) {
      section.innerHTML = `<div class="empty-orders"><div style="font-size:48px">🍽️</div><p style="margin-top:8px">No orders yet</p></div>`;
      return;
    }
    section.innerHTML = [...myOrders].reverse().map(order => {
      const total    = order.items.reduce((s, i) => s + i.price * i.qty, 0);
      const itemsStr = order.items.map(i => `${i.name} × ${i.qty} — Rs. ${i.price * i.qty}`).join('<br>');
      const time     = new Date(order.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      return `<div class="order-history-card">
        <div class="order-history-header">
          <span class="order-num">ORDER #${order.id}</span>
          <span class="order-time-label">${time}</span>
        </div>
        <div class="order-items-list">${itemsStr}</div>
        <hr class="order-divider">
        <div class="order-total-row"><span>Total</span><span>Rs. ${total}</span></div>
        <div style="margin-top:12px">
          <span class="status-badge ${order.status}">
            <span class="status-dot"></span>
            ${order.status === 'Pending' ? '⏳ Pending' : order.status === 'Preparing' ? '👨‍🍳 Preparing' : '✅ Completed'}
          </span>
        </div>
      </div>`;
    }).join('');
  } catch(e) { console.error(e); }
}

setInterval(() => {
  if (document.getElementById('tab-orders').classList.contains('active')) loadMyOrders();
}, 10000);