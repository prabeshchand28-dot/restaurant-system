// services/qrService.js — Prisma-based
const prisma = require('../config/prisma');
const { generateQRDataUrl } = require('../utils/qrGenerator');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function generateAllTableQRs() {
  const tables  = await prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } });
  const results = [];
  for (const t of tables) {
    const url     = `${BASE_URL}/order?table=${t.number}`;
    const dataUrl = await generateQRDataUrl(url);
    results.push({ table: t.number, url, dataUrl });
  }
  return results;
}

async function generateTableQR(tableNumber) {
  const url     = `${BASE_URL}/order?table=${tableNumber}`;
  const dataUrl = await generateQRDataUrl(url);
  return { tableNumber, url, dataUrl };
}

module.exports = { generateAllTableQRs, generateTableQR, generateQRDataUrl };
