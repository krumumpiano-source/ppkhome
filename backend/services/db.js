const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY';

const SHEETS = {
  USERS: 'Users',
  UNITS: 'Units',
  SYS_CONFIG: 'SysConfig',
  WATER_READINGS: 'WaterReadings',
  ELECTRIC_READINGS: 'ElectricReadings',
  BILLING_ROUNDS: 'BillingRounds',
  PAYMENTS: 'Payments',
  CENTRAL_LEDGER: 'CentralLedger',
  APPLICATIONS: 'Applications',
  QUEUE: 'Queue',
  ABOUT_CONTENT: 'AboutContent',
  AUDIT_LOG: 'AuditLog',
  REGISTRATION_REQUESTS: 'RegistrationRequests',
  REPAIR_REQUESTS: 'RepairRequests'
};

let authClient = null;

function initAuth() {
  if (authClient) return authClient;
  
  const credentials = process.env.GOOGLE_CREDENTIALS;
  if (!credentials) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is required');
  }
  
  const key = JSON.parse(credentials);
  authClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
  );
  
  return authClient;
}

async function getSheetData(sheetName) {
  try {
    const auth = initAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`
    });
    
    return response.data.values || [];
  } catch (err) {
    console.error(`Error reading sheet ${sheetName}:`, err.message);
    return [];
  }
}

async function appendRow(sheetName, row) {
  try {
    const auth = initAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] }
    });
    
    return true;
  } catch (err) {
    console.error(`Error appending to sheet ${sheetName}:`, err.message);
    throw err;
  }
}

async function updateRow(sheetName, rowIndex, row) {
  try {
    const auth = initAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [row] }
    });
    
    return true;
  } catch (err) {
    console.error(`Error updating sheet ${sheetName}:`, err.message);
    throw err;
  }
}

async function getCollection(name) {
  try {
    const sheetName = SHEETS[name] || name;
    const data = await getSheetData(sheetName);
    if (data.length === 0) return [];
    const headers = data[0] || [];
    return data.slice(1).map((row, index) => {
      const obj = {};
      headers.forEach((header, colIndex) => {
        obj[header] = row[colIndex] !== undefined ? row[colIndex] : '';
      });
      obj._rowIndex = index + 2;
      return obj;
    });
  } catch (err) {
    console.error(`Error getting collection ${name}:`, err.message);
    return [];
  }
}

function findInCollection(collection, predicate) {
  return collection.find(predicate);
}

function filterCollection(collection, predicate) {
  return collection.filter(predicate);
}

async function addToCollection(name, item) {
  try {
    const sheetName = SHEETS[name] || name;
    const data = await getSheetData(sheetName);
    let headers = [];
    if (data.length > 0) {
      headers = data[0];
    } else {
      headers = Object.keys(item);
      await appendRow(sheetName, headers);
    }
    const row = headers.map(header => {
      const value = item[header];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    await appendRow(sheetName, row);
    return item;
  } catch (err) {
    console.error(`Error adding to collection ${name}:`, err.message);
    throw err;
  }
}

async function updateInCollection(name, predicate, updater) {
  try {
    const collection = await getCollection(name);
    const item = collection.find(predicate);
    if (!item) return null;
    
    const updated = updater(item);
    const sheetName = SHEETS[name] || name;
    const data = await getSheetData(sheetName);
    const headers = data.length > 0 ? data[0] : Object.keys(updated);
    const row = headers.map(header => {
      const value = updated[header];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    await updateRow(sheetName, item._rowIndex, row);
    return updated;
  } catch (err) {
    console.error(`Error updating collection ${name}:`, err.message);
    throw err;
  }
}

async function deleteFromCollection(name, predicate) {
  const collection = await getCollection(name);
  const item = collection.find(predicate);
  if (!item) return null;
  
  const sheetName = SHEETS[name] || name;
  const auth = initAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: await getSheetId(sheetName),
            dimension: 'ROWS',
            startIndex: item._rowIndex - 1,
            endIndex: item._rowIndex
          }
        }
      }]
    }
  });
  
  return item;
}

async function getSheetId(sheetName) {
  try {
    const auth = initAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
    return sheet ? sheet.properties.sheetId : null;
  } catch (err) {
    console.error(`Error getting sheet ID for ${sheetName}:`, err.message);
    return null;
  }
}

const inMemorySessions = {};
const inMemoryResetTokens = {};

function getSession(sessionId) {
  return inMemorySessions[sessionId] || null;
}

function setSession(sessionId, session) {
  inMemorySessions[sessionId] = session;
}

function deleteSession(sessionId) {
  delete inMemorySessions[sessionId];
}

function getResetToken(token) {
  return inMemoryResetTokens[token] || null;
}

function setResetToken(token, data) {
  inMemoryResetTokens[token] = data;
}

function deleteResetToken(token) {
  delete inMemoryResetTokens[token];
}

module.exports = {
  getCollection,
  findInCollection,
  filterCollection,
  addToCollection,
  updateInCollection,
  deleteFromCollection,
  getSheetData,
  appendRow,
  updateRow,
  getSession,
  setSession,
  deleteSession,
  getResetToken,
  setResetToken,
  deleteResetToken,
  SHEETS,
  SPREADSHEET_ID
};
