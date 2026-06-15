// controllers/settingsController.js
const prisma = require('../config/prisma');

// Default settings
const DEFAULTS = {
  restaurant_name:        'My Restaurant',
  restaurant_address:     'Kathmandu, Nepal',
  restaurant_phone:       '01-XXXXXXX',
  restaurant_email:       '',
  restaurant_description: '',
  restaurant_logo:        '',
  restaurant_website:     '',
  open_time:              '10:00',
  close_time:             '22:00',
  open_days:              'Sun-Fri',
  facebook:               '',
  instagram:              '',
  tiktok:                 '',
  maps_url:               '',
  tax_rate:               '13',
  service_charge:     '0',
  currency:           'रू',
  language:           'en',
  theme_color:        '#f97316',
  daily_goal:         '5000',
  shift_start:        '09:30',
  printer_name:       '',
  printer_width:      '80',
  low_stock_alert:    '5',
};

exports.getAll = async (req, res) => {
  try {
    const rid = req.restaurantId || 1;
    const rows = await prisma.setting.findMany({ where: { restaurantId: rid } });
    const settings = { ...DEFAULTS };
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.set = async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    const rid = req.restaurantId || 1;
    const ops = Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where:  { restaurantId_key: { restaurantId: rid, key } },
        update: { value: String(value) },
        create: { restaurantId: rid, key, value: String(value) },
      })
    );
    await Promise.all(ops);
    res.json({ success: true, message: 'Settings saved' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: req.params.key } });
    const value = row?.value ?? DEFAULTS[req.params.key] ?? null;
    res.json({ key: req.params.key, value });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
