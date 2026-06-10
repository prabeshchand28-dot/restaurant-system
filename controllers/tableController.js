// controllers/tableController.js
const prisma  = require('../config/prisma');
const { generateQRDataUrl } = require('../utils/qrGenerator');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

exports.getAll = async (req, res) => {
  try {
    const tables = await prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } });
    res.json(tables.map(t => t.number));
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const no = parseInt(req.body.number);
    if (!no || no < 1) return res.status(400).json({ success: false, message: 'Valid table number required' });
    await prisma.restaurantTable.upsert({
      where: { number: no }, update: { active: true },
      create: { number: no, capacity: 4 },
    });
    const tables = await prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } });
    res.json({ success: true, tables: tables.map(t => t.number) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.restaurantTable.update({ where: { number: parseInt(req.params.no) }, data: { active: false } });
    const tables = await prisma.restaurantTable.findMany({ where: { active: true }, orderBy: { number: 'asc' } });
    res.json({ success: true, tables: tables.map(t => t.number) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getQR = async (req, res) => {
  try {
    const no  = parseInt(req.params.no);
    const url = `${BASE_URL}/order?table=${no}`;
    const dataUrl = await generateQRDataUrl(url);
    res.json({ success: true, dataUrl, url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
