/* ═══════════════════════════
   DASHBOARD JS
   ═══════════════════════════ */

let allOrders = [];
let allMenu = [];
let currentFilter = 'All';
let editingId = null;
let tables = JSON.parse(localStorage.getItem('restaurant_tables') || '[1,2,3,4,5]');

const BASE_URL = 'http://172.20.10.3:3000';

// ── Nav Tabs ──
function switchTab(tab, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  if (tab === 'menu') loadMenuItems();
  if (tab === 'tables') renderQRCodes();
  if (tab === 'guests') loadGuests();
}

// ── Orders ──
function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderOrders();
}

function renderOrders() {
  const list = document.getElementById('ordersList');
  const filtered = currentFilter === 'All' ? allOrders : allOrders.filter(o => o.status === currentFilter);
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="emoji">🍽️</div><p>No orders yet</p></div>`;
    return;
  }
  list.innerHTML = [...filtered].reverse().map(order => {
    const total = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const itemsStr = order.items.map(i => `${i.name} ×${i.qty}`).join(', ');
    const time = new Date(order.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const guestInfo = order.guests ? `<span class="guest-info">👥 ${order.guests.count} · ${order.guests.gender}</span>` : '';
    let actionBtns = '';
    if (order.status === 'Pending')
      actionBtns = `<button class="action-btn preparing" onclick="updateStatus(${order.id},'Preparing')">Start Preparing</button>`;
    else if (order.status === 'Preparing')
      actionBtns = `<button class="action-btn completed" onclick="updateStatus(${order.id},'Completed')">Mark Completed</button>`;
    return `<div class="order-card ${order.status}">
      <div class="order-table-num">${order.table}</div>
      <div class="order-body">
        <div class="order-meta">
          <span class="order-id">ORDER #${order.id}</span>
          <span class="order-time">${time}</span>
          <span style="font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid var(--dark-border);color:var(--muted)">${order.status}</span>
          ${guestInfo}
        </div>
        <div class="order-items-text">${itemsStr}</div>
        <div class="order-footer">
          <div class="order-total-val">Rs. ${total}</div>
          <div class="order-actions">${actionBtns}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function loadData() {
  try {
    const [ordersRes, statsRes] = await Promise.all([fetch('/api/orders'), fetch('/api/stats')]);
    allOrders = await ordersRes.json();
    const stats = await statsRes.json();
    document.getElementById('statTotal').textContent = stats.totalOrders;
    document.getElementById('statRevenue').textContent = `Rs. ${stats.revenue}`;
    document.getElementById('statPending').textContent = stats.pendingOrders;
    renderOrders();
  } catch(e) { console.error(e); }
}

async function updateStatus(id, status) {
  await fetch(`/api/orders/${id}/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadData();
}

// ── Menu ──
function categoryEmoji(cat) {
  return { Snacks:'🥟', Noodles:'🍜', Main:'🍛', Drinks:'🥤' }[cat] || '🍽️';
}

async function loadMenuItems() {
  const res = await fetch('/api/menu');
  allMenu = await res.json();
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = allMenu.map(item => {
    const emoji = categoryEmoji(item.category);
    const imgSrc = item.image
      ? item.image
      : `https://source.unsplash.com/200x140/?${encodeURIComponent(item.name)},food`;
    const disc = item.discount || 0;
    const discPrice = disc > 0 ? Math.round(item.price * (1 - disc/100)) : item.price;
    const featBadge = item.featured ? '<span style="background:#e8b86d;color:#0d0d0d;font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;margin-left:4px">⭐ Best</span>' : '';
    const discBadge = disc > 0 ? `<span style="background:#e05252;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:5px;margin-left:4px">${disc}% OFF</span>` : '';
    return `<div class="menu-card">
      <div class="menu-card-img">
        <img src="${imgSrc}" alt="${item.name}" onerror="this.parentElement.innerHTML='${emoji}'"/>
      </div>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}${featBadge}${discBadge}</div>
        <div class="menu-card-cat">${item.category}</div>
        <div class="menu-card-price">${disc > 0 ? `<span>Rs. ${discPrice}</span> <span style="font-size:12px;text-decoration:line-through;color:var(--muted)">Rs. ${item.price}</span>` : `Rs. ${item.price}`}</div>
        <div class="menu-card-actions">
          <button class="edit-btn" onclick="openEditMenu(${item.id})">✏️ Edit</button>
          <button class="del-btn" onclick="deleteMenuItem(${item.id})">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openAddMenu() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('itemName').value = '';
  document.getElementById('itemPrice').value = '';
  document.getElementById('itemCategory').value = '';
  document.getElementById('itemWaitMins').value = '10';
  document.getElementById('itemDiscount').value = '0';
  document.getElementById('itemFeatured').checked = false;
  document.getElementById('imgPreview').classList.remove('show');
  document.getElementById('itemWaitMins').value = item.waitMins || 10;
  document.getElementById('itemDiscount').value = item.discount || 0;
  document.getElementById('itemFeatured').checked = item.featured || false;
  document.getElementById('imgFile').value = '';
  document.getElementById('menuModal').classList.add('open');
}

function openEditMenu(id) {
  const item = allMenu.find(m => m.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Item';
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemPrice').value = item.price;
  document.getElementById('itemCategory').value = item.category;
  if (item.image) {
    document.getElementById('imgPreview').src = item.image;
    document.getElementById('imgPreview').classList.add('show');
  } else {
    document.getElementById('imgPreview').classList.remove('show');
  }
  document.getElementById('itemWaitMins').value = item.waitMins || 10;
  document.getElementById('itemDiscount').value = item.discount || 0;
  document.getElementById('itemFeatured').checked = item.featured || false;
  document.getElementById('imgFile').value = '';
  document.getElementById('menuModal').classList.add('open');
}

function closeMenuModal() { document.getElementById('menuModal').classList.remove('open'); }

function previewImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const p = document.getElementById('imgPreview');
    p.src = e.target.result;
    p.classList.add('show');
  };
  reader.readAsDataURL(file);
}

async function saveMenuItem() {
  const name = document.getElementById('itemName').value.trim();
  const price = document.getElementById('itemPrice').value;
  const category = document.getElementById('itemCategory').value.trim();
  const fileInput = document.getElementById('imgFile');
  if (!name || !price || !category) return alert('सबै fields भर्नुस्!');
  const waitMins = document.getElementById('itemWaitMins').value || 10;
  const discount = document.getElementById('itemDiscount').value || 0;
  const featured = document.getElementById('itemFeatured').checked;
  const fd = new FormData();
  fd.append('name', name); fd.append('price', price); fd.append('category', category);
  fd.append('waitMins', waitMins);
  fd.append('discount', discount);
  fd.append('featured', featured);
  fd.append('allergens', JSON.stringify([]));
  if (fileInput.files[0]) fd.append('image', fileInput.files[0]);
  try {
    const url = editingId ? `/api/menu/${editingId}` : '/api/menu';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: fd });
    const data = await res.json();
    if (data.success) { closeMenuModal(); loadMenuItems(); }
  } catch(e) { alert('Save failed'); }
}

async function deleteMenuItem(id) {
  if (!confirm('यो item delete गर्ने?')) return;
  await fetch(`/api/menu/${id}`, { method: 'DELETE' });
  loadMenuItems();
}

// ── Guests ──
async function loadGuests() {
  try {
    const res = await fetch('/api/guests');
    const guests = await res.json();
    const tbody = document.getElementById('guestsTableBody');
    if (guests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:40px">No guests yet</td></tr>`;
      return;
    }
    tbody.innerHTML = [...guests].reverse().map(g => {
      const time = new Date(g.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      return `<tr>
        <td>Table ${g.table}</td>
        <td>${g.count} जना</td>
        <td>${g.gender}</td>
        <td>${time}</td>
      </tr>`;
    }).join('');
  } catch(e) { console.error(e); }
}

// ── QR Tables ──
function saveTables() { localStorage.setItem('restaurant_tables', JSON.stringify(tables)); }

function addTable() {
  const input = document.getElementById('newTableNo');
  const no = parseInt(input.value);
  if (!no || no < 1) return alert('Valid table number हाल्नुस्!');
  if (tables.includes(no)) return alert(`Table ${no} already exists!`);
  tables.push(no); tables.sort((a, b) => a - b); saveTables(); renderQRCodes(); input.value = '';
}

function deleteTable(no) {
  if (!confirm(`Table ${no} delete गर्ने?`)) return;
  tables = tables.filter(t => t !== no); saveTables(); renderQRCodes();
}

function renderQRCodes() {
  const grid = document.getElementById('qrGrid');
  if (tables.length === 0) { grid.innerHTML = '<div style="color:var(--muted);padding:30px">कुनै table छैन।</div>'; return; }
  grid.innerHTML = tables.map(t => `
    <div class="qr-card">
      <div class="qr-table-label">Table ${t}</div>
      <div class="qr-box" id="qr-${t}"></div>
      <div class="qr-url">${BASE_URL}/order?table=${t}</div>
      <div class="qr-actions">
        <button class="qr-btn print" onclick="printSingle(${t})">🖨️</button>
        <button class="qr-btn del" onclick="deleteTable(${t})">✕</button>
      </div>
    </div>`).join('');
  tables.forEach(t => {
    new QRCode(document.getElementById(`qr-${t}`), {
      text: `${BASE_URL}/order?table=${t}`, width: 118, height: 118,
      colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H
    });
  });
}

function printSingle(no) {
  document.getElementById('printGrid').innerHTML = `
    <div class="print-qr-item" style="grid-column:1/-1;max-width:220px;margin:0 auto">
      <h4>Table ${no}</h4><div id="print-qr-single"></div>
      <p>${BASE_URL}/order?table=${no}</p>
    </div>`;
  document.getElementById('printModal').classList.add('open');
  new QRCode(document.getElementById('print-qr-single'), { text: `${BASE_URL}/order?table=${no}`, width: 180, height: 180, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
}

function openPrintAll() {
  document.getElementById('printGrid').innerHTML = tables.map(t => `
    <div class="print-qr-item"><h4>Table ${t}</h4><div id="pqr-${t}"></div><p>${BASE_URL}/order?table=${t}</p></div>`).join('');
  document.getElementById('printModal').classList.add('open');
  tables.forEach(t => new QRCode(document.getElementById(`pqr-${t}`), { text: `${BASE_URL}/order?table=${t}`, width: 160, height: 160, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H }));
}

function closePrintAll() {
  document.getElementById('printModal').classList.remove('open');
  document.getElementById('printGrid').innerHTML = '';
}

// Init
document.getElementById('newTableNo').addEventListener('keydown', e => { if (e.key === 'Enter') addTable(); });
loadData();
setInterval(loadData, 10000);

// ── Reports ──
async function loadReports() {
  try {
    const res = await fetch('/api/reports/summary');
    const data = await res.json();

    document.getElementById('repRevenue').textContent = `Rs. ${data.stats.revenue}`;
    document.getElementById('repOrders').textContent  = data.stats.totalOrders;
    document.getElementById('repPending').textContent = data.stats.pendingOrders;

    // Top Items
    document.getElementById('topItems').innerHTML = data.topItems.length
      ? data.topItems.map((item, i) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dark-border);font-size:14px">
          <span>${i+1}. ${item.name}</span>
          <span style="color:var(--accent);font-weight:600">${item.qty} sold</span>
        </div>`).join('')
      : '<p style="color:var(--muted);font-size:13px">No data yet</p>';

    // Guest Breakdown
    document.getElementById('guestBreakdown').innerHTML = Object.keys(data.guestBreakdown).length
      ? Object.entries(data.guestBreakdown).map(([gender, count]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dark-border);font-size:14px">
          <span>${gender === 'Male' ? '👨' : gender === 'Female' ? '👩' : '🧑'} ${gender}</span>
          <span style="color:var(--accent);font-weight:600">${count} guests</span>
        </div>`).join('')
      : '<p style="color:var(--muted);font-size:13px">No data yet</p>';

    // Orders by Status
    document.getElementById('ordersByStatus').innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;background:rgba(224,82,82,0.1);border:1px solid rgba(224,82,82,0.3);border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#e05252">${data.byStatus.Pending}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Pending</div>
        </div>
        <div style="flex:1;background:rgba(91,141,238,0.1);border:1px solid rgba(91,141,238,0.3);border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--blue)">${data.byStatus.Preparing}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Preparing</div>
        </div>
        <div style="flex:1;background:rgba(76,175,125,0.1);border:1px solid rgba(76,175,125,0.3);border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:var(--green)">${data.byStatus.Completed}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">Completed</div>
        </div>
      </div>`;
  } catch(e) { console.error(e); }
}

// Override switchTab to handle reports
const _origSwitchTab = switchTab;
// Patch switchTab for reports
window.switchTab = function(tab, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  if (tab === 'menu')    loadMenuItems();
  if (tab === 'tables')  renderQRCodes();
  if (tab === 'guests')  loadGuests();
  if (tab === 'reports') loadReports();
};

// ── Payment Modal (called from orders) ──
function openPayment(orderId, total) {
  window.location.href = `/payment?orderId=${orderId}`;
}

// ── Call Bell Alert ──
const evtSource = new EventSource('/api/dashboard/events');
evtSource.addEventListener('call_bell', (e) => {
  const data = JSON.parse(e.data);
  showBellAlert(data.table, data.message);
});
evtSource.addEventListener('new_order', () => loadData());
evtSource.addEventListener('order_update', () => loadData());

function showBellAlert(table, message) {
  // Play sound if available
  try { new Audio('/bell.mp3').play(); } catch(e) {}

  const alert = document.createElement('div');
  alert.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:9999;
    background:#e8b86d;color:#0d0d0d;border-radius:14px;
    padding:16px 20px;box-shadow:0 8px 32px rgba(232,184,109,0.4);
    font-family:'DM Sans',sans-serif;animation:slideIn 0.3s ease;
    display:flex;align-items:center;gap:12px;max-width:320px;
  `;
  alert.innerHTML = `
    <span style="font-size:28px">🔔</span>
    <div>
      <div style="font-weight:700;font-size:15px">Table ${table} — Staff Needed!</div>
      <div style="font-size:13px;margin-top:2px">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:20px;cursor:pointer;margin-left:auto">×</button>
  `;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 8000);
}

// Override switchTab to handle reports with ratings
const _baseSwitchTab = window.switchTab;
window.switchTab = function(tab, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  if (tab === 'menu')    loadMenuItems();
  if (tab === 'tables')  renderQRCodes();
  if (tab === 'guests')  loadGuests();
  if (tab === 'reports') loadReports();
};