// services/notificationService.js
// SSE (Server-Sent Events) real-time notification hub

const clients = new Map(); // clientId → res

// ── Add SSE client ────────────────────────────────────────────────────
function addClient(clientId, res) {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  // Initial ping so the connection stays alive
  res.write(':ok\n\n');
  clients.set(clientId, res);

  // Cleanup on disconnect
  res.on('close', () => {
    clients.delete(clientId);
  });
}

// ── Broadcast to all clients ─────────────────────────────────────────
// Sends BOTH a named event (for kitchen's addEventListener) AND
// an unnamed message (for dashboard's onmessage handler)
function broadcast(type, data) {
  const payload = JSON.stringify({ type, ...data });

  // Named event — kitchen listens with addEventListener('new_order', ...)
  const namedMsg = `event: ${type}\ndata: ${payload}\n\n`;

  // Unnamed event — dashboard listens with evtSource.onmessage
  const unnamedMsg = `data: ${payload}\n\n`;

  clients.forEach(res => {
    try {
      res.write(namedMsg);
      res.write(unnamedMsg);
    } catch (e) { /* client disconnected */ }
  });
}

// ── Public helpers ────────────────────────────────────────────────────
function notifyNewOrder(order) {
  broadcast('new_order', { order });
}

function notifyOrderUpdate(order) {
  broadcast('order_update', { order });
}

function notifyBell(table, message) {
  broadcast('call_bell', { table, message });
}

function clientCount() {
  return clients.size;
}

module.exports = { addClient, notifyNewOrder, notifyOrderUpdate, notifyBell, clientCount };
