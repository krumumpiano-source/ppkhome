const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const CONFIG = {
  HOUSING_COUNT: 17,
  FLAT_PREFIX: 'F',
  FLAT_COUNT: 16,
  ROLES: {
    RESIDENT: 'resident',
    COMMITTEE: 'committee',
    ACCOUNTING: 'accounting',
    ADMIN: 'admin',
    DEPUTY_ADMIN: 'deputy_admin',
    EXECUTIVE: 'executive',
    APPLICANT: 'applicant'
  },
  DEFAULT_WATER_RATE: 9,
  DEFAULT_VACANT_METER_FEE: 9,
  DEFAULT_COMMON_FEE: 0
};

function hashPassword(password) {
  const salt = process.env.PASSWORD_SALT || 'THR_DEFAULT_SALT';
  return crypto.createHash('sha256').update(salt + password).digest('base64');
}

function createSession(userId, role, unitId) {
  const id = uuidv4();
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const session = {
    userId,
    role,
    unitId: unitId || null,
    expires
  };
  db.setSession(id, session);
  return { id, expires };
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const session = db.getSession(sessionId);
  if (!session) return null;
  if (session.expires && session.expires < Date.now()) {
    db.deleteSession(sessionId);
    return null;
  }
  return session;
}

function deleteSession(sessionId) {
  if (sessionId) {
    db.deleteSession(sessionId);
  }
}

async function getSysConfig(key) {
  const configs = await db.getCollection('SYS_CONFIG');
  const item = db.findInCollection(configs, item => item.key === key);
  return item ? item.value : null;
}

async function setSysConfig(key, value) {
  const configs = await db.getCollection('SYS_CONFIG');
  const existing = db.findInCollection(configs, item => item.key === key);
  if (existing) {
    existing.value = value;
    await db.updateInCollection('SYS_CONFIG', item => item.key === key, () => existing);
  } else {
    await db.addToCollection('SYS_CONFIG', { key, value });
  }
}

function getUnitIds() {
  const house = [];
  for (let i = 1; i <= CONFIG.HOUSING_COUNT; i++) {
    house.push(String(i));
  }
  const flat = [];
  for (let j = 1; j <= CONFIG.FLAT_COUNT; j++) {
    flat.push(CONFIG.FLAT_PREFIX + j);
  }
  return { house, flat };
}

async function auditLog(action, userId, detail) {
  try {
    await db.addToCollection('AUDIT_LOG', {
      timestamp: new Date().toISOString(),
      userId: userId || '',
      action,
      detail: detail ? JSON.stringify(detail) : ''
    });
  } catch (err) {
    console.error('auditLog error:', err.message);
  }
}

async function getHolidayDates() {
  const raw = await getSysConfig('holidayDates');
  if (!raw) return [];
  const parts = String(raw).split(',');
  const dates = [];
  for (const part of parts) {
    const s = part.trim();
    if (!s) continue;
    const d = new Date(s);
    if (!isNaN(d.getTime())) dates.push(d.getTime());
  }
  return dates;
}

async function addBusinessDays(startDate, n) {
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const holidays = await getHolidayDates();
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    const isWeekend = (day === 0 || day === 6);
    const t = d.getTime();
    let isHoliday = false;
    for (const h of holidays) {
      const hd = new Date(h);
      hd.setHours(0, 0, 0, 0);
      if (hd.getTime() === t) {
        isHoliday = true;
        break;
      }
    }
    if (!isWeekend && !isHoliday) count++;
  }
  return d;
}

async function getBillingDateForRound(roundId) {
  const rounds = await db.getCollection('BILLING_ROUNDS');
  const round = db.findInCollection(rounds, r => r.roundId === roundId);
  if (!round) return null;
  if (round.billingDate) {
    const d = new Date(round.billingDate);
    return isNaN(d.getTime()) ? null : d;
  }
  const month = parseInt(round.month, 10) || 1;
  const year = parseInt(round.year, 10) || new Date().getFullYear();
  return new Date(year, month - 1, 1);
}

async function getDueDateForRound(roundId) {
  const billing = await getBillingDateForRound(roundId);
  if (!billing) return null;
  return addBusinessDays(billing, 3);
}

function daysBetween(fromDate, toDate) {
  const a = new Date(fromDate);
  const b = new Date(toDate);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)));
}

async function getCurrentBillingRound() {
  const rounds = await db.getCollection('BILLING_ROUNDS');
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].status === 'open') {
      return {
        id: rounds[i].roundId,
        month: rounds[i].month,
        year: rounds[i].year,
        status: rounds[i].status
      };
    }
  }
  return null;
}

async function getRoundMonthYear(roundId) {
  const rounds = await db.getCollection('BILLING_ROUNDS');
  const round = db.findInCollection(rounds, r => r.roundId === roundId);
  if (!round) return { month: '', year: '' };
  return { month: round.month || '', year: round.year || '' };
}

async function getWaterChargeForRound(roundId, unitId) {
  const readings = await db.getCollection('WATER_READINGS');
  const reading = db.findInCollection(readings, r => r.roundId === roundId && r.unitId === unitId);
  return reading ? (Number(reading.amount) || 0) : 0;
}

async function getElectricChargeForRound(roundId, unitId) {
  const readings = await db.getCollection('ELECTRIC_READINGS');
  const reading = db.findInCollection(readings, r => r.roundId === roundId && r.unitId === unitId);
  return reading ? (Number(reading.amount) || 0) : 0;
}

async function getCommonFeeForUnit(unitId) {
  const fee = await getSysConfig('commonFee');
  return Number(fee) || 0;
}

async function getPaymentForRoundAndUnit(roundId, unitId) {
  const payments = await db.getCollection('PAYMENTS');
  const payment = db.findInCollection(payments, p => p.roundId === roundId && p.unitId === unitId);
  if (!payment) return null;
  return {
    amount: payment.amount,
    date: payment.date,
    verified: payment.verified === true || payment.verified === 'TRUE'
  };
}

module.exports = {
  CONFIG,
  hashPassword,
  createSession,
  getSession,
  deleteSession,
  getSysConfig,
  setSysConfig,
  getUnitIds,
  auditLog,
  getHolidayDates,
  addBusinessDays,
  getBillingDateForRound,
  getDueDateForRound,
  daysBetween,
  getCurrentBillingRound,
  getRoundMonthYear,
  getWaterChargeForRound,
  getElectricChargeForRound,
  getCommonFeeForUnit,
  getPaymentForRoundAndUnit
};
