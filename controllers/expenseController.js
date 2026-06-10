const prisma = require('../config/prisma');

const CATEGORIES = ['Rent', 'Utilities', 'Supplies', 'Staff', 'Marketing', 'Maintenance', 'Food & Beverage', 'Equipment', 'Other'];

exports.getAll = async (req, res) => {
  try {
    const { month, category } = req.query; // month = YYYY-MM
    const where = {};
    if (month) { where.date = { gte: `${month}-01`, lte: `${month}-31` }; }
    if (category) { where.category = category; }
    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { category, description, amount, date, paymentMode, receiptRef, createdBy } = req.body;
    if (!category || !description || !amount || !date)
      return res.status(400).json({ success: false, message: 'category, description, amount, date required' });
    const expense = await prisma.expense.create({
      data: { category, description, amount: parseInt(amount), date, paymentMode: paymentMode||'Cash', receiptRef: receiptRef||'', createdBy: createdBy||'' },
    });
    res.json({ success: true, expense });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { category, description, amount, date, paymentMode, receiptRef } = req.body;
    const expense = await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(category    && { category }),
        ...(description && { description }),
        ...(amount      && { amount: parseInt(amount) }),
        ...(date        && { date }),
        ...(paymentMode && { paymentMode }),
        ...(receiptRef  !== undefined && { receiptRef }),
      },
    });
    res.json({ success: true, expense });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getSummary = async (req, res) => {
  try {
    const { month } = req.query;
    const where = month ? { date: { gte: `${month}-01`, lte: `${month}-31` } } : {};
    const expenses = await prisma.expense.findMany({ where });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const byMonth = expenses.reduce((acc, e) => {
      const m = e.date.slice(0, 7);
      acc[m] = (acc[m] || 0) + e.amount;
      return acc;
    }, {});
    res.json({ total, count: expenses.length, byCategory, byMonth, categories: CATEGORIES });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
