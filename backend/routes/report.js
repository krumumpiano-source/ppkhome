const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getCurrentBillingRound,
  getRoundMonthYear,
  getSysConfig,
  getUnitIds,
  auditLog,
  CONFIG
} = require('../services/logic');
const db = require('../services/db');

async function getRoundSummary(sessionId, roundId) {
  let waterTotal = 0;
  const waterReadings = await db.getCollection('WATER_READINGS');
  for (const reading of waterReadings) {
    if (reading.roundId === roundId) {
      waterTotal += Number(reading.amount) || 0;
    }
  }
  let electricTotal = 0;
  const electricReadings = await db.getCollection('ELECTRIC_READINGS');
  for (const reading of electricReadings) {
    if (reading.roundId === roundId) {
      electricTotal += Number(reading.amount) || 0;
    }
  }
  const commonFee = Number(await getSysConfig('commonFee')) || 0;
  const units = await db.getCollection('UNITS');
  let occupiedCount = 0;
  for (const unit of units) {
    if (unit.status === 'occupied') occupiedCount++;
  }
  const commonTotal = occupiedCount * commonFee;
  const vacantFee = Number(await getSysConfig('vacantMeterFee')) || CONFIG.DEFAULT_VACANT_METER_FEE;
  return {
    success: true,
    roundId,
    depositWater: waterTotal,
    depositElectric: electricTotal,
    depositTotal: waterTotal + electricTotal,
    commonFeeTotal: commonTotal,
    vacantMeterFee: vacantFee,
    expenses: []
  };
}

router.get('/executive-dashboard', requireAuth, requireRole(CONFIG.ROLES.EXECUTIVE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const units = getUnitIds();
  const totalUnits = units.house.length + units.flat.length;
  const unitsData = await db.getCollection('UNITS');
  let occupied = 0;
  let vacant = 0;
  for (const unit of unitsData) {
    if (unit.status === 'occupied') occupied++;
    else vacant++;
  }
  const round = await getCurrentBillingRound();
  let paymentRate = null;
  let overdueCount = 0;
  if (round) {
    const payments = await db.getCollection('PAYMENTS');
    let paid = 0;
    const total = occupied;
    for (const payment of payments) {
      if (payment.roundId === round.id) paid++;
    }
    paymentRate = total > 0 ? Math.round(100 * paid / total) : 0;
    overdueCount = total - paid;
  }
  const applications = await db.getCollection('APPLICATIONS');
  const totalApps = applications.length;
  const queue = await db.getCollection('QUEUE');
  let inQueue = 0;
  for (const q of queue) {
    if (q.status === 'in_queue') inQueue++;
  }
  res.json({
    success: true,
    totalUnits,
    occupied,
    vacant,
    paymentRate,
    overdueCount,
    centralBalance: null,
    applicationsTotal: totalApps,
    applicationsInQueue: inQueue
  });
});

router.get('/billing-rounds', requireAuth, requireRole(CONFIG.ROLES.COMMITTEE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN, CONFIG.ROLES.EXECUTIVE, CONFIG.ROLES.ACCOUNTING), async (req, res) => {
  const rounds = await db.getCollection('BILLING_ROUNDS');
  const roundsList = rounds.map(r => ({
    roundId: r.roundId,
    month: r.month,
    year: r.year,
    status: r.status
  })).sort((a, b) => {
    // เรียงตาม year และ month (ใหม่สุดก่อน)
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
  res.json({ success: true, rounds: roundsList });
});

router.get('/period', requireAuth, requireRole(CONFIG.ROLES.EXECUTIVE, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { fromDate, toDate } = req.query;
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  const summary = { from: fromDate, to: toDate, paymentCount: 0, totalAmount: 0 };
  const payments = await db.getCollection('PAYMENTS');
  for (const payment of payments) {
    const d = new Date(payment.date).getTime();
    if (d >= from && d <= to) {
      summary.paymentCount++;
      summary.totalAmount += Number(payment.amount) || 0;
    }
  }
  res.json({ success: true, report: summary });
});

router.get('/round-summary/:roundId', requireAuth, requireRole(CONFIG.ROLES.ACCOUNTING, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { roundId } = req.params;
  const summary = await getRoundSummary(req.session.userId, roundId);
  res.json(summary);
});

router.get('/central-ledger/:roundId', requireAuth, requireRole(CONFIG.ROLES.ACCOUNTING, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { roundId } = req.params;
  const ledger = await db.getCollection('CENTRAL_LEDGER');
  const income = [];
  const expense = [];
  for (const entry of ledger) {
    if (entry.roundId !== roundId) continue;
    if (entry.type === 'income') {
      income.push({ desc: entry.description, amount: entry.amount });
    }
    if (entry.type === 'expense') {
      expense.push({ desc: entry.description, amount: entry.amount });
    }
  }
  let balance = 0;
  income.forEach(x => balance += Number(x.amount) || 0);
  expense.forEach(x => balance -= Number(x.amount) || 0);
  res.json({ success: true, income, expense, balance });
});

router.post('/verify-bank-balance', requireAuth, requireRole(CONFIG.ROLES.ACCOUNTING, CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN), async (req, res) => {
  const { roundId, bankBalance, note } = req.body;
  const summary = await getRoundSummary(req.session.userId, roundId);
  if (!summary.success) {
    return res.json(summary);
  }
  const systemBalance = summary.depositTotal - 0;
  const diff = Number(bankBalance) - systemBalance;
  await auditLog('bank_verify', req.session.userId, { roundId, bank: bankBalance, system: systemBalance, note });
  const match = Math.abs(diff) < 0.01;
  let overdueCount = 0;
  const payments = await db.getCollection('PAYMENTS');
  const units = await db.getCollection('UNITS');
  let occupied = 0;
  for (const unit of units) {
    if (unit.status === 'occupied') occupied++;
  }
  const paidUnits = {};
  for (const payment of payments) {
    if (payment.roundId === roundId) paidUnits[payment.unitId] = true;
  }
  overdueCount = Math.max(0, occupied - Object.keys(paidUnits).length);
  res.json({
    success: true,
    systemBalance,
    bankBalance: Number(bankBalance),
    difference: diff,
    match,
    message: note || (match ? 'ตรงกัน' : 'ไม่ตรงกัน กรุณาบันทึกหมายเหตุ')
  });
});

router.get('/audit-log', requireAuth, requireRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.DEPUTY_ADMIN, CONFIG.ROLES.EXECUTIVE), async (req, res) => {
  const { from, to, userId, action, limit = 500 } = req.query;
  const logs = await db.getCollection('AUDIT_LOG');
  const fromTime = from ? new Date(from).getTime() : 0;
  const toTime = to ? new Date(to).getTime() : Number.MAX_VALUE;
  const rows = [];
  for (let i = logs.length - 1; i >= 0 && rows.length < limit; i--) {
    const log = logs[i];
    const t = new Date(log.timestamp).getTime();
    if (t < fromTime || t > toTime) continue;
    if (userId && log.userId !== userId) continue;
    if (action && log.action !== action) continue;
    rows.push({
      when: log.timestamp,
      userId: log.userId,
      action: log.action,
      detail: log.detail
    });
  }
  res.json({ success: true, rows });
});

module.exports = router;
