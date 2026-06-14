const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

// Get current ngrok public URL from local ngrok API
async function getNgrokUrl() {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data).tunnels;
          const https = tunnels.find(t => t.proto === 'https');
          resolve(https ? https.public_url : null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function getBaseUrl(req, providedUrl) {
  if (providedUrl) return providedUrl;
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;
  const ngrok = await getNgrokUrl();
  if (ngrok) return ngrok;
  return `${req.protocol}://${req.get('host')}`;
}

// Return QR data for all tables — client uses qrcode.js to render
exports.getTableQRs = async (req, res) => {
  try {
    const tables = await prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } });
    const base = await getBaseUrl(req, req.query.baseUrl);
    const qrData = tables.map(t => ({
      tableNumber: t.number,
      label: t.label || `Table ${t.number}`,
      url: `${base}/menu?table=${t.number}`,
      qrContent: `${base}/menu?table=${t.number}`,
    }));
    res.json(qrData);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Return QR for a single table
exports.getTableQR = async (req, res) => {
  try {
    const base = await getBaseUrl(req, req.query.baseUrl);
    const url = `${base}/menu?table=${req.params.table}`;
    res.json({ tableNumber: +req.params.table, url, qrContent: url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Return current public URL (ngrok or PUBLIC_URL)
exports.getPublicUrl = async (req, res) => {
  const url = await getBaseUrl(req, null);
  res.json({ url });
};

// Return QR for WiFi info
exports.getWifiQR = async (req, res) => {
  try {
    const { ssid, password, type = 'WPA' } = req.query;
    if (!ssid) return res.status(400).json({ message: 'ssid required' });
    const qrContent = `WIFI:T:${type};S:${ssid};P:${password || ''};H:false;`;
    res.json({ ssid, qrContent });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
