/**
 * api.js — เรียก Backend (Render) ผ่าน fetch API
 * รองรับ Offline Mode ด้วย Mock Data
 */
var API = {
  base: null,
  offlineMode: false,
  
  // ตั้งค่า API Base URL (ตั้งใน HTML หรือใช้ default)
  init: function(baseUrl) {
    this.base = baseUrl || null;
  },
  
  // ตรวจสอบว่าเป็น offline mode หรือไม่
  checkOfflineMode: function() {
    this.offlineMode = (window.location.protocol === 'file:' || 
                        window.location.hostname === '' ||
                        (window.location.hostname === 'localhost' && !this.base && !window.API_BASE_URL));
    return this.offlineMode;
  },
  
  run: function (action, params, callback) {
    try {
      // Validate inputs
      if (!action || typeof action !== 'string') {
        if (callback) callback({ success: false, message: 'Invalid action parameter' });
        return;
      }
      
      params = params || {};
      
      // Ensure callback is a function
      if (callback && typeof callback !== 'function') {
        console.error('API.run: callback must be a function');
        callback = null;
      }
      
      // ตรวจสอบ offline mode
      if (this.checkOfflineMode() && typeof MOCK_DATA !== 'undefined') {
        // ใช้ Mock Data
        if (MOCK_DATA.responses && MOCK_DATA.responses[action]) {
          setTimeout(function() {
            try {
              var response = MOCK_DATA.responses[action](params);
              if (callback) callback(response || { success: false, message: 'Mock data returned invalid response' });
            } catch (e) {
              if (callback) callback({ success: false, message: e.message || 'Mock data error' });
            }
          }, 100);
          return;
        } else {
          // ไม่มี mock data สำหรับ action นี้
          if (callback) callback({ 
            success: false, 
            message: 'Offline Mode: ไม่มีข้อมูลจำลองสำหรับ ' + action 
          });
          return;
        }
      }
      
      // Online Mode: เรียก Backend (Render)
      try {
        // กำหนด API endpoint
        var apiBase = this.base || window.API_BASE_URL || '';
        if (!apiBase) {
          if (callback) callback({ 
            success: false, 
            message: 'API Base URL ไม่ได้ตั้งค่า กรุณาตั้งค่า window.API_BASE_URL หรือ API.base' 
          });
          return;
        }
        
        // กำหนด route ตาม action
        var route = '';
        var method = 'GET';
        var bodyParams = {};
        
        // Map actions to routes
        if (action === 'login') {
          route = '/api/auth/login';
          method = 'POST';
          bodyParams = { email: params.email, password: params.password };
        } else if (action === 'logout') {
          route = '/api/auth/logout';
          method = 'POST';
          bodyParams = { sessionId: params.sessionId || Auth.getSessionId() };
        } else if (action === 'getSession') {
          route = '/api/auth/session';
          method = 'GET';
        } else if (action === 'changePassword') {
          route = '/api/auth/change-password';
          method = 'POST';
          bodyParams = { sessionId: params.sessionId || Auth.getSessionId(), oldPassword: params.oldPassword, newPassword: params.newPassword };
        } else if (action === 'requestPasswordReset') {
          route = '/api/auth/request-password-reset';
          method = 'POST';
          bodyParams = { email: params.email };
        } else if (action === 'resetPasswordWithToken') {
          route = '/api/auth/reset-password';
          method = 'POST';
          bodyParams = { token: params.token, newPassword: params.newPassword };
        } else if (action === 'registerRequest') {
          route = '/api/auth/register-request';
          method = 'POST';
          bodyParams = { fullName: params.fullName, email: params.email, phone: params.phone };
        } else if (action === 'getMyProfile') {
          route = '/api/users/profile';
          method = 'GET';
        } else if (action === 'updateMyProfile') {
          route = '/api/users/profile';
          method = 'POST';
          bodyParams = params;
        } else if (action === 'listUsers') {
          route = '/api/users/list';
          method = 'GET';
        } else if (action === 'getMenuRegistry') {
          route = '/api/permissions/menus';
          method = 'GET';
        } else if (action === 'getMyPermissions') {
          route = '/api/permissions/me';
          method = 'GET';
        } else if (action === 'getUserMenuPermissions') {
          route = '/api/permissions/user/' + encodeURIComponent(params.userId || '');
          method = 'GET';
        } else if (action === 'updateUserMenuPermissions') {
          route = '/api/permissions/user/' + encodeURIComponent(params.userId || '');
          method = 'POST';
          bodyParams = { permissions: params.permissions || {} };
        } else if (action === 'resetUserMenuPermissions') {
          route = '/api/permissions/user/' + encodeURIComponent(params.userId || '') + '/reset';
          method = 'POST';
        } else if (action === 'getPermissionAudit') {
          route = '/api/permissions/audit';
          method = 'GET';
          var permQuery = [];
          if (params.targetUserId) permQuery.push('targetUserId=' + encodeURIComponent(params.targetUserId));
          if (params.limit) permQuery.push('limit=' + encodeURIComponent(params.limit));
          if (permQuery.length > 0) route += '?' + permQuery.join('&');
        } else if (action === 'setUserStatusOrRole') {
          route = '/api/users/set-status-or-role';
          method = 'POST';
          bodyParams = { targetUserId: params.targetUserId, actionType: params.actionType, value: params.value };
        } else if (action === 'moveOutUser') {
          route = '/api/users/move-out';
          method = 'POST';
          bodyParams = { targetUserId: params.targetUserId, reason: params.reason };
        } else if (action === 'getBillingForUnit') {
          route = '/api/housing/billing/' + (params.unitId || '');
          method = 'GET';
        } else if (action === 'submitPayment') {
          route = '/api/housing/payment';
          method = 'POST';
          bodyParams = { roundId: params.roundId, unitId: params.unitId, amount: params.amount, slipDataUrl: params.slipDataUrl, note: params.note };
        } else if (action === 'getPaymentHistory') {
          route = '/api/housing/payment-history/' + (params.unitId || '');
          method = 'GET';
          if (params.limit) route += '?limit=' + params.limit;
        } else if (action === 'getMyPaymentStatusList') {
          route = '/api/housing/payment-status';
          method = 'GET';
        } else if (action === 'getWaterFormData') {
          route = '/api/housing/water-form/' + (params.unitId || '');
          method = 'GET';
        } else if (action === 'submitWaterReading') {
          route = '/api/housing/water-reading';
          method = 'POST';
          bodyParams = { roundId: params.roundId, unitId: params.unitId, currentReading: params.currentReading, note: params.note };
        } else if (action === 'getWaterReport') {
          route = '/api/housing/water-report/' + (params.roundId || '');
          method = 'GET';
        } else if (action === 'getBillingRounds') {
          route = '/api/report/billing-rounds';
          method = 'GET';
        } else if (action === 'getElectricFormData') {
          route = '/api/housing/electric-form/' + (params.roundId || '');
          method = 'GET';
        } else if (action === 'submitElectricReadings') {
          route = '/api/housing/electric-reading';
          method = 'POST';
          bodyParams = { roundId: params.roundId, readings: params.readings, totalBill: params.totalBill, lostHouse: params.lostHouse, lostFlat: params.lostFlat };
        } else if (action === 'submitRepairRequest') {
          route = '/api/housing/repair-request';
          method = 'POST';
          bodyParams = { unitId: params.unitId, type: params.type, note: params.note };
        } else if (action === 'submitApplication') {
          route = '/api/housing/application';
          method = 'POST';
          bodyParams = params;
        } else if (action === 'getMyQueueStatus') {
          route = '/api/housing/queue-status/' + (params.applicationId || '');
          method = 'GET';
        } else if (action === 'listApplicationsAndQueue') {
          route = '/api/housing/applications-queue';
          method = 'GET';
        } else if (action === 'approveApplication') {
          route = '/api/housing/application-approve';
          method = 'POST';
          bodyParams = { applicationId: params.applicationId, unitId: params.unitId, note: params.note };
        } else if (action === 'rejectApplication') {
          route = '/api/housing/application-reject';
          method = 'POST';
          bodyParams = { applicationId: params.applicationId, reason: params.reason };
        } else if (action === 'reorderQueue') {
          route = '/api/housing/reorder-queue';
          method = 'POST';
          bodyParams = { applicationIds: params.applicationIds || [] };
        } else if (action === 'getRoundSummary') {
          route = '/api/report/round-summary/' + (params.roundId || '');
          method = 'GET';
        } else if (action === 'getCentralLedger') {
          route = '/api/report/central-ledger/' + (params.roundId || '');
          method = 'GET';
        } else if (action === 'verifyBankBalance') {
          route = '/api/report/verify-bank-balance';
          method = 'POST';
          bodyParams = { roundId: params.roundId, bankBalance: params.bankBalance, note: params.note };
        } else if (action === 'getExecutiveDashboard') {
          route = '/api/report/executive-dashboard';
          method = 'GET';
        } else if (action === 'getBillingRounds') {
          route = '/api/report/billing-rounds';
          method = 'GET';
        } else if (action === 'getReportByPeriod') {
          route = '/api/report/period';
          method = 'GET';
          var query = [];
          if (params.fromDate) query.push('fromDate=' + encodeURIComponent(params.fromDate));
          if (params.toDate) query.push('toDate=' + encodeURIComponent(params.toDate));
          if (params.format) query.push('format=' + encodeURIComponent(params.format));
          if (query.length > 0) route += '?' + query.join('&');
        } else if (action === 'getAuditLog') {
          route = '/api/report/audit-log';
          method = 'GET';
          var query = [];
          if (params.from) query.push('from=' + encodeURIComponent(params.from));
          if (params.to) query.push('to=' + encodeURIComponent(params.to));
          if (params.userId) query.push('userId=' + encodeURIComponent(params.userId));
          if (params.action) query.push('action=' + encodeURIComponent(params.action));
          if (params.limit) query.push('limit=' + encodeURIComponent(params.limit));
          if (query.length > 0) route += '?' + query.join('&');
        } else if (action === 'getAboutContent') {
          route = '/api/about/content';
          method = 'GET';
        } else if (action === 'saveAboutSection') {
          route = '/api/about/section';
          method = 'POST';
          bodyParams = { sectionId: params.sectionId, title: params.title, body: params.body, imageUrl: params.imageUrl, visible: params.visible, order: params.order };
        } else {
          if (callback) callback({ success: false, message: 'Unknown action: ' + action });
          return;
        }
        
        var url = apiBase + route;
        var sessionId = params.sessionId || Auth.getSessionId();
        
        var headers = {
          'Content-Type': 'application/json'
        };
        
        // เพิ่ม sessionId ใน header ถ้ามี
        if (sessionId) {
          headers['X-Session-Id'] = sessionId;
        }
        
        var fetchOptions = {
          method: method,
          headers: headers
        };
        
        // เพิ่ม body สำหรับ POST requests
        if (method === 'POST' && Object.keys(bodyParams).length > 0) {
          fetchOptions.body = JSON.stringify(bodyParams);
        }
        
        fetch(url, fetchOptions)
          .then(function(response) {
            if (!response.ok) {
              throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            return response.json();
          })
          .then(function(data) {
            if (callback) callback(data || { success: false, message: 'No response from server' });
          })
          .catch(function(err) {
            if (callback) callback({ 
              success: false, 
              message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ' + (err.message || 'Network error')
            });
          });
      } catch (e) {
        if (callback) callback({ success: false, message: 'API error: ' + e.message });
      }
    } catch (e) {
      if (callback) callback({ success: false, message: e.message || 'API.run error' });
    }
  }
};
