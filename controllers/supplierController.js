const prisma = require('../config/prisma');

// ── Suppliers ──────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, contact, phone, email, address, category } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });
    const supplier = await prisma.supplier.create({
      data: { name, contact: contact||'', phone: phone||'', email: email||'', address: address||'', category: category||'General' },
    });
    res.json({ success: true, supplier });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, contact, phone, email, address, category } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(req.params.id) },
      data: { ...(name&&{name}), ...(contact!==undefined&&{contact}), ...(phone!==undefined&&{phone}), ...(email!==undefined&&{email}), ...(address!==undefined&&{address}), ...(category&&{category}) },
    });
    res.json({ success: true, supplier });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.supplier.update({ where: { id: parseInt(req.params.id) }, data: { active: false } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Purchase Orders ────────────────────────────────────────
exports.getAllPO = async (req, res) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true, items: true },
      orderBy: { orderedAt: 'desc' },
    });
    res.json(orders);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.createPO = async (req, res) => {
  try {
    const { supplierId, items, notes } = req.body;
    if (!supplierId || !items || !items.length)
      return res.status(400).json({ success: false, message: 'supplierId and items required' });

    const totalAmount = items.reduce((s, i) => s + (i.price * i.qty), 0);
    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId: parseInt(supplierId),
        totalAmount,
        notes: notes || '',
        items: { create: items.map(i => ({ name: i.name, qty: parseFloat(i.qty), unit: i.unit||'', price: parseInt(i.price) })) },
      },
      include: { supplier: true, items: true },
    });
    res.json({ success: true, order: po });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Ordered', 'Received', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const po = await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: { status, ...(status === 'Received' && { receivedAt: new Date() }) },
      include: { supplier: true, items: true },
    });
    res.json({ success: true, order: po });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
