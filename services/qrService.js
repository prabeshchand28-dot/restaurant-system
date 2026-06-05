// services/qrService.js
const { generateTableQR, generateQRDataUrl } = require('../utils/qrGenerator');
const db = require('../config/database');

async function generateAllTableQRs(baseUrl) {
  const tables  = db.getTables();
  const results = [];
  for (const t of tables) {
    const result = await generateTableQR(t, baseUrl);
    results.push({ table: t, ...result });
  }
  return results;
}

module.exports = { generateAllTableQRs, generateTableQR, generateQRDataUrl };