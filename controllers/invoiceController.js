const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/invoices?status=&supplierId=
exports.getAll = async (req, res) => {
  try {
    const { status, supplierId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = parseInt(supplierId);
    const invoices = await prisma.vendorInvoice.findMany({
      where, include: { items: true }, orderBy: { createdAt: 'desc' },
    });
    // Auto-mark overdue
    const now = new Date();
    res.json(invoices.map(inv => ({
      ...inv,
      status: inv.status === 'UNPAID' && inv.dueDate && new Date(inv.dueDate) < now ? 'OVERDUE' : inv.status,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/invoices
exports.create = async (req, res) => {
  try {
    const { supplierId, supplierName, invoiceNo, invoiceDate, dueDate, notes, taxRate, items } = req.body;
    if (!supplierName || !invoiceNo) return res.status(400).json({ message: 'supplierName and invoiceNo required' });

    const itemData = (items || []).map(i => ({
      description: i.description || '',
      quantity: parseFloat(i.quantity) || 1,
      unitPrice: parseFloat(i.unitPrice) || 0,
      total: (parseFloat(i.quantity) || 1) * (parseFloat(i.unitPrice) || 0),
    }));
    const subtotal = itemData.reduce((s, i) => s + i.total, 0);
    const tax = subtotal * (parseFloat(taxRate || 0) / 100);
    const total = subtotal + tax;

    const invoice = await prisma.vendorInvoice.create({
      data: {
        supplierId: supplierId ? parseInt(supplierId) : null,
        supplierName, invoiceNo,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal, tax, total, notes: notes || '',
        items: { create: itemData },
      },
      include: { items: true },
    });
    res.json(invoice);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/invoices/:id  (record payment / change status)
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, amountPaid, notes } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (amountPaid !== undefined) data.amountPaid = parseFloat(amountPaid);
    if (notes !== undefined) data.notes = notes;

    // Auto-compute status from payment
    if (data.amountPaid !== undefined) {
      const inv = await prisma.vendorInvoice.findUnique({ where: { id } });
      if (data.amountPaid >= (inv?.total || 0)) data.status = 'PAID';
      else if (data.amountPaid > 0) data.status = 'PARTIAL';
    }
    const invoice = await prisma.vendorInvoice.update({ where: { id }, data, include: { items: true } });
    res.json(invoice);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// DELETE /api/invoices/:id
exports.remove = async (req, res) => {
  try {
    await prisma.vendorInvoice.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/invoices/stats
exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const [all, overdue] = await Promise.all([
      prisma.vendorInvoice.findMany(),
      prisma.vendorInvoice.findMany({ where: { status: 'UNPAID', dueDate: { lt: now } } }),
    ]);
    const totalOwed = all.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.total - (i.amountPaid || 0), 0);
    const totalPaid = all.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
    res.json({
      total: all.length, unpaid: all.filter(i => i.status === 'UNPAID').length,
      partial: all.filter(i => i.status === 'PARTIAL').length,
      overdueCount: overdue.length, totalOwed, totalPaid,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
