// controllers/tableController.js
const prisma  = require('../config/prisma');
const { generateQRDataUrl } = require('../utils/qrGenerator');

exports.getAll = async (req, res) => {
  try {
    const rid = req.restaurantId || 1;
    const tables = await prisma.restaurantTable.findMany({ where: { active: true, restaurantId: rid }, orderBy: { number: 'asc' } });
    res.json(tables.map(t => t.number));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const rid = req.restaurantId || 1;
    const no = parseInt(req.body.number);
    if (!no || no < 1) return res.status(400).json({ success: false, message: 'Valid table number required' });
    await prisma.restaurantTable.upsert({
      where: { restaurantId_number: { restaurantId: rid, number: no } },
      update: { active: true },
      create: { restaurantId: rid, number: no, capacity: 4 },
    });
    const tables = await prisma.restaurantTable.findMany({ where: { active: true, restaurantId: rid }, orderBy: { number: 'asc' } });
    res.json({ success: true, tables: tables.map(t => t.number) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const rid = req.restaurantId || 1;
    const no = parseInt(req.params.no);
    await prisma.restaurantTable.updateMany({ where: { number: no, restaurantId: rid }, data: { active: false } });
    const tables = await prisma.restaurantTable.findMany({ where: { active: true, restaurantId: rid }, orderBy: { number: 'asc' } });
    res.json({ success: true, tables: tables.map(t => t.number) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getQR = async (req, res) => {
  try {
    const no  = parseInt(req.params.no);
    const baseUrl = process.env.PUBLIC_URL || process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const rid = req.restaurantId || 1;
    const url = `${baseUrl}/menu?table=${no}&r=${rid}`;
    const dataUrl = await generateQRDataUrl(url);
    res.json({ success: true, dataUrl, url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
