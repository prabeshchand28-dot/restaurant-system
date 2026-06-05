// prisma/seed.js
// Run: node prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Users ──────────────────────────────────────
  console.log('👤 Creating users...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'restaurant123',   // plain for now; swap bcrypt later
      name:     'Admin',
      role:     'admin',
      email:    'admin@restaurant.com',
      phone:    '9800000000',
    },
  });
  await prisma.user.upsert({
    where: { username: 'waiter1' },
    update: {},
    create: {
      username: 'waiter1',
      password: 'staff123',
      name:     'Waiter One',
      role:     'waiter',
      email:    '',
      phone:    '',
    },
  });
  console.log('  ✓ 2 users created');

  // ── Restaurant Tables ──────────────────────────
  console.log('🪑 Creating tables 1–10...');
  for (let n = 1; n <= 10; n++) {
    await prisma.restaurantTable.upsert({
      where:  { number: n },
      update: {},
      create: { number: n, capacity: 4 },
    });
  }
  console.log('  ✓ 10 tables created');

  // ── Menu Items ─────────────────────────────────
  console.log('🍽️  Creating menu items...');
  const menuItems = [
    { name: 'Momo',        price: 150, category: 'Snacks',  waitMins: 10, allergens: [] },
    { name: 'Chowmein',    price: 180, category: 'Noodles', waitMins: 12, allergens: ['Gluten'], featured: true },
    { name: 'Thukpa',      price: 200, category: 'Noodles', waitMins: 15, allergens: [] },
    { name: 'Burger',      price: 220, category: 'Snacks',  waitMins:  8, allergens: ['Gluten','Dairy'], discount: 10, featured: true },
    { name: 'Pizza',       price: 350, category: 'Main',    waitMins: 20, allergens: ['Gluten','Dairy'] },
    { name: 'Dal Bhat',    price: 250, category: 'Main',    waitMins: 15, allergens: [], featured: true },
    { name: 'Lassi',       price: 100, category: 'Drinks',  waitMins:  3, allergens: ['Dairy'], discount: 20 },
    { name: 'Masala Chai', price:  60, category: 'Drinks',  waitMins:  5, allergens: ['Dairy'] },
  ];
  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
    if (!existing) await prisma.menuItem.create({ data: item });
  }
  console.log(`  ✓ ${menuItems.length} menu items created`);

  // ── Inventory ──────────────────────────────────
  console.log('📦 Creating inventory...');
  const inventory = [
    { name: 'Rice',    quantity: 50, unit: 'kg',  minStock: 10, category: 'Grains' },
    { name: 'Flour',   quantity: 20, unit: 'kg',  minStock:  5, category: 'Grains' },
    { name: 'Oil',     quantity: 10, unit: 'L',   minStock:  3, category: 'Cooking' },
    { name: 'Chicken', quantity:  8, unit: 'kg',  minStock:  5, category: 'Protein' },
    { name: 'Milk',    quantity: 15, unit: 'L',   minStock:  5, category: 'Dairy' },
    { name: 'Tea',     quantity:  2, unit: 'kg',  minStock:  1, category: 'Beverages' },
  ];
  for (const item of inventory) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
    if (!existing) await prisma.inventoryItem.create({ data: item });
  }
  console.log(`  ✓ ${inventory.length} inventory items created`);

  console.log('\n✅ Seed complete!\n');
  console.log('  Login: admin / restaurant123');
  console.log('  Staff: waiter1 / staff123\n');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
