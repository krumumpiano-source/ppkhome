/**
 * Code.gs — จุดเข้าใช้งาน Web App (doGet / doPost)
 * ระบบบริหารจัดการบ้านพักครูแบบดิจิทัล
 */

function doGet(e) {
  var params = e.parameter;
  var mode = params.mode || 'app';
  var page = params.page || 'index';
  if (mode === 'reset') {
    return HtmlService.createHtmlOutputFromFile('public/forgot-password').setTitle('รีเซ็ตรหัสผ่าน');
  }
  if (mode === 'api') {
    return ContentService.createTextOutput(JSON.stringify(handleApi(params))).setMimeType(ContentService.MimeType.JSON);
  }
  var template = getPageTemplate(page, params);
  return HtmlService.createTemplateFromFile(template)
    .evaluate()
    .setTitle('ระบบบ้านพักครู')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var req = {};
    // Parse POST data
    if (e.postData && e.postData.contents) {
      try {
        req = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // Fallback: try URL parameters
        req = e.parameter || {};
      }
    } else {
      req = e.parameter || {};
    }
    
    var action = req.action;
    if (!action) {
      return json({ success: false, message: 'ไม่ระบุ action' });
    }
    
    // Central router - map actions to functions
    var routes = {
      'login': function() { return login(req.email, req.password); },
      'logout': function() { return logout(req.sessionId); },
      'getSession': function() { return { success: true, session: getSession(req.sessionId) }; },
      'changePassword': function() { return changePassword(req.sessionId, req.oldPassword, req.newPassword); },
      'requestPasswordReset': function() { return requestPasswordReset(req.email); },
      'resetPasswordWithToken': function() { return resetPasswordWithToken(req.token, req.newPassword); },
      'registerRequest': function() { return registerRequest({ fullName: req.fullName, email: req.email, phone: req.phone }); },
      'getMyProfile': function() { return getMyProfile(req.sessionId); },
      'updateMyProfile': function() { return updateMyProfile(req.sessionId, JSON.parse(req.payload || '{}')); },
      'listUsers': function() { return listUsers(req.sessionId); },
      'setUserStatusOrRole': function() { return setUserStatusOrRole(req.sessionId, req.targetUserId, req.actionType, req.value); },
      'getBillingForUnit': function() { return getBillingForUnit(req.sessionId, req.unitId); },
      'submitPayment': function() { return submitPayment(req.sessionId, req.roundId, req.unitId, req.amount, req.slipDataUrl, req.note); },
      'getPaymentHistory': function() { return getPaymentHistory(req.sessionId, req.unitId, req.limit); },
      'getMyPaymentStatusList': function() { return getMyPaymentStatusList(req.sessionId); },
      'getWaterFormData': function() { return getWaterFormData(req.sessionId, req.unitId); },
      'submitWaterReading': function() { return submitWaterReading(req.sessionId, req.roundId, req.unitId, req.currentReading, req.note); },
      'getElectricFormData': function() { return getElectricFormData(req.sessionId, req.roundId); },
      'submitElectricReadings': function() { return submitElectricReadings(req.sessionId, req.roundId, JSON.parse(req.readings || '[]'), req.totalBill, req.lostHouse, req.lostFlat); },
      'getRoundSummary': function() { return getRoundSummary(req.sessionId, req.roundId); },
      'getCentralLedger': function() { return getCentralLedger(req.sessionId, req.roundId); },
      'verifyBankBalance': function() { return verifyBankBalance(req.sessionId, req.roundId, req.bankBalance, req.note); },
      'submitRepairRequest': function() { return submitRepairRequest(req.sessionId, req.unitId, req.type || 'แจ้งซ่อม', req.note); },
      'submitApplication': function() { return submitApplication(JSON.parse(req.payload || '{}')); },
      'getMyQueueStatus': function() { return getMyQueueStatus(req.applicationId); },
      'listApplicationsAndQueue': function() { return listApplicationsAndQueue(req.sessionId); },
      'reorderQueue': function() { return reorderQueue(req.sessionId, JSON.parse(req.applicationIds || '[]')); },
      'getAboutContent': function() { return getAboutContent(req.sessionId); },
      'saveAboutSection': function() { return saveAboutSection(req.sessionId, req.sectionId, req.title, req.body, req.imageUrl, req.visible !== 'false', req.order); },
      'getExecutiveDashboard': function() { return getExecutiveDashboard(req.sessionId); },
      'getReportByPeriod': function() { return getReportByPeriod(req.sessionId, req.fromDate, req.toDate, req.format); },
      'getAuditLog': function() { return getAuditLog(req.sessionId, JSON.parse(req.options || '{}')); },
      'exportAllData': function() { return exportAllData(req.sessionId); },
      'importData': function() { return importData(req.sessionId, req.sourceSpreadsheetId); },
      'setupSystem': function() { return setupSystem(); },
      'setupSheetHeaders': function() { return setupSheetHeaders(); },
      'setupInitialUnits': function() { return setupInitialUnits(); },
      'setupInitialSysConfig': function() { return setupInitialSysConfig(); },
      'setupInitialAboutContent': function() { return setupInitialAboutContent(); },
      'createFirstAdmin': function() { return createFirstAdmin(req.email, req.password, req.fullName); }
    };
    
    if (!routes[action]) {
      return json({ success: false, message: 'action ไม่รู้จัก: ' + action });
    }
    
    try {
      var result = routes[action]();
      return json(result || { success: false, message: 'Function returned no result' });
    } catch (err) {
      return json({ success: false, message: err.message || 'เกิดข้อผิดพลาด' });
    }
  } catch (err) {
    return json({ success: false, message: err.message || 'เกิดข้อผิดพลาด' });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPageTemplate(page, params) {
  var role = params.role;
  var allowed = {
    'index': 'public/index',
    'login': 'public/login',
    'register': 'public/register',
    'forgot-password': 'public/forgot-password',
    'resident-dashboard': 'public/resident/dashboard',
    'resident-billing': 'public/resident/billing',
    'resident-history': 'public/resident/history',
    'resident-profile': 'public/resident/profile',
    'committee-water': 'public/committee/water-meter',
    'committee-electric': 'public/committee/electric-bill',
    'committee-status': 'public/committee/task-status',
    'accounting-summary': 'public/accounting/summary',
    'accounting-ledger': 'public/accounting/ledger',
    'accounting-bank': 'public/accounting/bank-check',
    'admin-users': 'public/admin/users',
    'admin-roles': 'public/admin/roles',
    'admin-assets': 'public/admin/assets',
    'admin-queue': 'public/admin/queue',
    'admin-settings': 'public/admin/settings',
    'admin-about': 'public/admin/about-manager',
    'admin-reports': 'public/admin/reports',
    'admin-audit': 'public/admin/audit-log',
    'executive-dashboard': 'public/executive/dashboard',
    'executive-reports': 'public/executive/reports',
    'applicant-apply': 'public/applicant/apply',
    'applicant-queue': 'public/applicant/queue-status'
  };
  var template = allowed[page] || 'public/index';
  return template;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * API router — DEPRECATED (LEGACY ONLY)
 * 
 * ⚠️ WARNING: This function is deprecated and kept only for backward compatibility.
 * 
 * Rules:
 * - New pages MUST NOT call this function directly
 * - New pages MUST use doPost() router central instead
 * - Frontend calls API.run() which automatically routes to doPost()
 * 
 * This function exists only to support legacy code that may still use:
 *   google.script.run.handleApi(params)
 * 
 * @deprecated Use doPost() router central instead
 */
function handleApi(params) {
  // Convert to doPost format and call
  var mockE = {
    postData: {
      contents: JSON.stringify(params || {})
    },
    parameter: params || {}
  };
  return JSON.parse(doPost(mockE).getContent());
}
