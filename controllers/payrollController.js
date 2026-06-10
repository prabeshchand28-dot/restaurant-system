const prisma = require('../config/prisma');

// Pay Rates
exports.getPayRates = async (req, res) => {
  try {
    const rates = await prisma.staffPayRate.findMany({ orderBy: { userName: 'asc' } });
    res.json(rates);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.setPayRate = async (req, res) => {
  try {
    const { userId, userName, userRole, hourlyRate, monthlyRate, payType } = req.body;
    if (!userId || !userName) return res.status(400).json({ success: false, message: 'userId and userName required' });
    const rate = await prisma.staffPayRate.upsert({
      where: { userId: parseInt(userId) },
      update: { userName, userRole: userRole||'', hourlyRate: parseInt(hourlyRate)||0, monthlyRate: parseInt(monthlyRate)||0, payType: payType||'hourly', updatedAt: new Date() },
      create: { userId: parseInt(userId), userName, userRole: userRole||'', hourlyRate: parseInt(hourlyRate)||0, monthlyRate: parseInt(monthlyRate)||0, payType: payType||'hourly' },
    });
    res.json({ success: true, rate });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Payroll
exports.getAll = async (req, res) => {
  try {
    const { month } = req.query;
    const where = month ? { month } : {};
    const payrolls = await prisma.payroll.findMany({ where, orderBy: { userName: 'asc' } });
    res.json(payrolls);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.generate = async (req, res) => {
  try {
    const { month } = req.body; // YYYY-MM
    if (!month) return res.status(400).json({ success: false, message: 'month required' });

    const rates = await prisma.staffPayRate.findMany();
    const attendance = await prisma.attendance.findMany({ where: { date: { startsWith: month } } });

    // Group hours by userId
    const hoursByUser = {};
    attendance.forEach(a => {
      if (a.hoursWorked) {
        hoursByUser[a.userId] = (hoursByUser[a.userId] || 0) + a.hoursWorked;
      }
    });

    const results = [];
    for (const rate of rates) {
      const hours = hoursByUser[rate.userId] || 0;
      const basePay = rate.payType === 'hourly'
        ? Math.round(hours * rate.hourlyRate)
        : rate.monthlyRate;
      const overtime = rate.payType === 'hourly' && hours > 160
        ? Math.round((hours - 160) * rate.hourlyRate * 0.5)
        : 0;
      const netPay = basePay + overtime;

      const payroll = await prisma.payroll.upsert({
        where: { userId_month: { userId: rate.userId, month } },
        update: { hoursWorked: hours, basePay, overtime, netPay },
        create: { userId: rate.userId, userName: rate.userName, userRole: rate.userRole, month, hoursWorked: hours, basePay, overtime, netPay },
      });
      results.push(payroll);
    }
    res.json({ success: true, payrolls: results, month });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.updatePayroll = async (req, res) => {
  try {
    const { bonus, deductions, notes, status } = req.body;
    const p = await prisma.payroll.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    const b = parseInt(bonus) || p.bonus;
    const d = parseInt(deductions) || p.deductions;
    const netPay = p.basePay + p.overtime + b - d;
    const updated = await prisma.payroll.update({
      where: { id: p.id },
      data: { bonus: b, deductions: d, netPay, notes: notes||p.notes, status: status||p.status },
    });
    res.json({ success: true, payroll: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getSummary = async (req, res) => {
  try {
    const { month } = req.query;
    const where = month ? { month } : {};
    const payrolls = await prisma.payroll.findMany({ where });
    const total = payrolls.reduce((s, p) => s + p.netPay, 0);
    const paid = payrolls.filter(p => p.status === 'Paid').length;
    res.json({ total, count: payrolls.length, paid, pending: payrolls.length - paid });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
