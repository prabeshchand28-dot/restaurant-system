// utils/qrGenerator.js
const QRCode = require('qrcode');
const path   = require('path');
const fs     = require('fs');

async function generateTableQR(tableNo, baseUrl) {
  const url     = `${baseUrl}/order?table=${tableNo}`;
  const outPath = path.join(__dirname, `../uploads/qr/table-${tableNo}.png`);
  await QRCode.toFile(outPath, url, { width: 300, margin: 2 });
  return { url, filePath: outPath, webPath: `/uploads/qr/table-${tableNo}.png` };
}

async function generateQRDataUrl(text) {
  return await QRCode.toDataURL(text, { width: 200, margin: 2 });
}

module.exports = { generateTableQR, generateQRDataUrl };