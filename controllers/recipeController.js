const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({ include: { ingredients: true }, orderBy: { name: 'asc' } });
    res.json(recipes);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: parseInt(req.params.id) }, include: { ingredients: true } });
    if (!recipe) return res.status(404).json({ success: false, message: 'Not found' });
    res.json(recipe);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, menuItemId, servings, salePrice, ingredients } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });

    const items = (ingredients || []).map(i => ({
      ingredientName: i.name,
      qty: parseFloat(i.qty) || 0,
      unit: i.unit || '',
      costPerUnit: parseFloat(i.costPerUnit) || 0,
      totalCost: (parseFloat(i.qty) || 0) * (parseFloat(i.costPerUnit) || 0),
    }));
    const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
    const sale = parseInt(salePrice) || 0;
    const profitMargin = sale > 0 ? Math.round(((sale - totalCost) / sale) * 100) : 0;

    const recipe = await prisma.recipe.create({
      data: {
        name,
        menuItemId: menuItemId ? parseInt(menuItemId) : null,
        servings: parseInt(servings) || 1,
        salePrice: sale,
        totalCost,
        profitMargin,
        ingredients: { create: items },
      },
      include: { ingredients: true },
    });
    res.json({ success: true, recipe });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, servings, salePrice, ingredients } = req.body;
    const items = (ingredients || []).map(i => ({
      ingredientName: i.name,
      qty: parseFloat(i.qty) || 0,
      unit: i.unit || '',
      costPerUnit: parseFloat(i.costPerUnit) || 0,
      totalCost: (parseFloat(i.qty) || 0) * (parseFloat(i.costPerUnit) || 0),
    }));
    const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
    const sale = parseInt(salePrice) || 0;
    const profitMargin = sale > 0 ? Math.round(((sale - totalCost) / sale) * 100) : 0;

    // Replace ingredients
    await prisma.recipeItem.deleteMany({ where: { recipeId: parseInt(req.params.id) } });
    const recipe = await prisma.recipe.update({
      where: { id: parseInt(req.params.id) },
      data: { name, servings: parseInt(servings)||1, salePrice: sale, totalCost, profitMargin, updatedAt: new Date(), ingredients: { create: items } },
      include: { ingredients: true },
    });
    res.json({ success: true, recipe });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.recipe.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getCostAnalysis = async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({ include: { ingredients: true } });
    const analysis = recipes.map(r => ({
      id: r.id, name: r.name,
      totalCost: r.totalCost, salePrice: r.salePrice,
      profitMargin: r.profitMargin,
      profit: r.salePrice - r.totalCost,
      status: r.profitMargin >= 60 ? 'Excellent' : r.profitMargin >= 40 ? 'Good' : r.profitMargin >= 20 ? 'Low' : 'Loss',
    }));
    res.json(analysis);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
