const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Tags CRUD ────────────────────────────────────────────
exports.getTags = async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type, active: true } : {};
    const tags = await prisma.allergenTag.findMany({ where, orderBy: { name: 'asc' } });
    res.json(tags);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createTag = async (req, res) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const tag = await prisma.allergenTag.create({ data: { name, icon: icon || '', color: color || '#888888', type: type || 'ALLERGEN' } });
    res.status(201).json(tag);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ message: 'Tag name already exists' });
    res.status(500).json({ message: e.message });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const tag = await prisma.allergenTag.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(tag);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteTag = async (req, res) => {
  try {
    await prisma.allergenTag.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Menu item tag assignments ────────────────────────────
exports.getItemTags = async (req, res) => {
  try {
    const menuItemId = Number(req.params.menuItemId);
    const rows = await prisma.menuItemTag.findMany({
      where: { menuItemId },
      include: { tag: true },
    });
    res.json(rows.map(r => r.tag));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.setItemTags = async (req, res) => {
  try {
    const menuItemId = Number(req.params.menuItemId);
    const { tagIds } = req.body; // array of tag IDs
    if (!Array.isArray(tagIds)) return res.status(400).json({ message: 'tagIds array required' });
    // Delete existing then recreate
    await prisma.menuItemTag.deleteMany({ where: { menuItemId } });
    if (tagIds.length > 0) {
      await prisma.menuItemTag.createMany({
        data: tagIds.map(tagId => ({ menuItemId, tagId: Number(tagId) })),
        skipDuplicates: true,
      });
    }
    const rows = await prisma.menuItemTag.findMany({ where: { menuItemId }, include: { tag: true } });
    res.json(rows.map(r => r.tag));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addItemTag = async (req, res) => {
  try {
    const menuItemId = Number(req.params.menuItemId);
    const { tagId } = req.body;
    const row = await prisma.menuItemTag.create({ data: { menuItemId, tagId: Number(tagId) } });
    res.status(201).json(row);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ message: 'Tag already assigned' });
    res.status(500).json({ message: e.message });
  }
};

exports.removeItemTag = async (req, res) => {
  try {
    const menuItemId = Number(req.params.menuItemId);
    const tagId = Number(req.params.tagId);
    await prisma.menuItemTag.deleteMany({ where: { menuItemId, tagId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Tag browser: all menu items with their tags ──────────
exports.getMenuWithTags = async (req, res) => {
  try {
    const { search } = req.query;
    const menuItems = await prisma.menuItem.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      orderBy: { name: 'asc' },
      take: 100,
    });
    const ids = menuItems.map(m => m.id);
    const tagRows = await prisma.menuItemTag.findMany({
      where: { menuItemId: { in: ids } },
      include: { tag: true },
    });
    const tagsByItem = {};
    tagRows.forEach(r => {
      if (!tagsByItem[r.menuItemId]) tagsByItem[r.menuItemId] = [];
      tagsByItem[r.menuItemId].push(r.tag);
    });
    res.json(menuItems.map(m => ({ ...m, tags: tagsByItem[m.id] || [] })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};
