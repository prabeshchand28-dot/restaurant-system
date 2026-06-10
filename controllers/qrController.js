const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Return QR data for all tables — client uses qrcode.js to render
exports.getTableQRs = async (req, res) => {
  try {
    const { baseUrl } = req.query;
    const tables = await prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } });
    const base = baseUrl || `${req.protocol}://${req.get('host')}`;
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
    const { baseUrl } = req.query;
    const base = baseUrl || `${req.protocol}://${req.get('host')}`;
    const url = `${base}/menu?table=${req.params.table}`;
    res.json({ tableNumber: +req.params.table, url, qrContent: url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
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
