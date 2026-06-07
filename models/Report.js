// models/Report.js — Prisma wrapper
const { getDailySummary } = require('../services/reportService');

module.exports = {
  getSummary: getDailySummary,
};
