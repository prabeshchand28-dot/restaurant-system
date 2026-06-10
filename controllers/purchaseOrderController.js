const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const genPONumber = async () => {
  const count = await prisma.purchaseOrder.count();
  return `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { status, supplierId, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = parseInt(supplierId);
    if (from || to) {
      where.orderDate = {};
      if (from) where.orderDate.gte = new Date(from);
      if (to) where.orderDate.lte = new Date(to + 'T23:59:59');
    }
    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });
    if (!po) return res.status(404).json({ message: 'Not found' });
    res.json(po);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { supplierId, supplierName = '', expectedDate, notes = '', createdBy = '', items = [] } = req.body;
    if (!items.length) return res.status(400).json({ message: 'At least one item required' });
    const poNumber = await genPONumber();
    let subtotal = 0;
    const preparedItems = items.map(i => {
      const total = parseFloat(i.quantity) * parseFloat(i.unitPrice);
      subtotal += total;
      return { itemName: i.itemName, unit: i.unit || 'kg', quantity: parseFloat(i.quantity), unitPrice: parseFloat(i.unitPrice), total };
    });
    const tax = subtotal * 0.13;
    const total = subtotal + tax;
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber, supplierId: supplierId ? parseInt(supplierId) : null,
        supplierName, notes, createdBy, subtotal, tax, total,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        items: { create: preparedItems },
      },
      include: { items: true },
    });
    res.json(po);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, receivedDate } = req.body;
    const data = { status };
    if (status === 'RECEIVED' && !receivedDate) data.receivedDate = new Date();
    else if (receivedDate) data.receivedDate = new Date(receivedDate);
    const po = await prisma.purchaseOrder.update({ where: { id: parseInt(req.params.id) }, data });
    res.json(po);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Mark received quantities per item
exports.receive = async (req, res) => {
  try {
    const { items } = req.body; // [{id, receivedQty}]
    await Promise.all(items.map(i =>
      prisma.purchaseOrderItem.update({
        where: { id: i.id },
        data: { receivedQty: parseFloat(i.receivedQty) },
      })
    ));
    // Auto-set PO status
    const po = await prisma.purchaseOrder.findUnique({ where: { id: parseInt(req.params.id) }, include: { items: true } });
    const allReceived = po.items.every(i => i.receivedQty >= i.quantity);
    const anyReceived = po.items.some(i => i.receivedQty > 0);
    await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: { status: allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL' : po.status, receivedDate: allReceived ? new Date() : po.receivedDate },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.purchaseOrder.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const [draft, sent, partial, received, totalVal] = await Promise.all([
      prisma.purchaseOrder.count({ where: { status: 'DRAFT' } }),
      prisma.purchaseOrder.count({ where: { status: 'SENT' } }),
      prisma.purchaseOrder.count({ where: { status: 'PARTIAL' } }),
      prisma.purchaseOrder.count({ where: { status: 'RECEIVED' } }),
      prisma.purchaseOrder.aggregate({ _sum: { total: true } }),
    ]);
    res.json({ draft, sent, partial, received, totalValue: totalVal._sum.total || 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
