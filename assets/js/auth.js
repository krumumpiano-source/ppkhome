/**
 * auth.js — สถานะการล็อกอิน Session
 */
var Auth = {
  KEY: 'teacher_housing_session',
  getSessionId: function () {
    try {
      return sessionStorage.getItem(this.KEY);
    } catch (e) { return null; }
  },
  setSession: function (data) {
    try {
      sessionStorage.setItem(this.KEY, data.sessionId || '');
      sessionStorage.setItem(this.KEY + '_role', data.role || '');
      sessionStorage.setItem(this.KEY + '_userId', data.userId || '');
      sessionStorage.setItem(this.KEY + '_unitId', data.unitId || '');
      if (data.allowedMenus) {
        sessionStorage.setItem(this.KEY + '_allowedMenus', JSON.stringify(data.allowedMenus));
      }
      if (data.menuRegistry) {
        sessionStorage.setItem(this.KEY + '_menuRegistry', JSON.stringify(data.menuRegistry));
      }
      if (data.rolePreset) {
        sessionStorage.setItem(this.KEY + '_rolePreset', data.rolePreset || '');
      }
    } catch (e) {}
  },
  clear: function () {
    try {
      sessionStorage.removeItem(this.KEY);
      sessionStorage.removeItem(this.KEY + '_role');
      sessionStorage.removeItem(this.KEY + '_userId');
      sessionStorage.removeItem(this.KEY + '_unitId');
      sessionStorage.removeItem(this.KEY + '_allowedMenus');
      sessionStorage.removeItem(this.KEY + '_menuRegistry');
      sessionStorage.removeItem(this.KEY + '_rolePreset');
    } catch (e) {}
  },
  getRole: function () { return sessionStorage.getItem(this.KEY + '_role') || ''; },
  getUserId: function () { return sessionStorage.getItem(this.KEY + '_userId') || ''; },
  getUnitId: function () { return sessionStorage.getItem(this.KEY + '_unitId') || ''; },
  getAllowedMenus: function () {
    try {
      var raw = sessionStorage.getItem(this.KEY + '_allowedMenus');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },
  getMenuRegistry: function () {
    try {
      var raw = sessionStorage.getItem(this.KEY + '_menuRegistry');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },
  getRolePreset: function () { return sessionStorage.getItem(this.KEY + '_rolePreset') || ''; },
  getUser: function () {
    try {
      return {
        userId: this.getUserId(),
        role: this.getRole(),
        unitId: this.getUnitId(),
        sessionId: this.getSessionId(),
        allowedMenus: this.getAllowedMenus(),
        rolePreset: this.getRolePreset()
      };
    } catch (e) {
      return null;
    }
  },
  isLoggedIn: function () { return !!this.getSessionId(); },
  
  /**
   * ตรวจสอบการล็อกอินและ redirect อัตโนมัติ
   * @param {string} redirect - Path สำหรับ redirect ถ้ายังไม่ล็อกอิน (default: '../login.html')
   * @returns {boolean} true ถ้าล็อกอินแล้ว, false ถ้ายังไม่ล็อกอิน (จะ redirect อัตโนมัติ)
   */
  requireLogin: function (redirect) {
    if (!this.isLoggedIn()) {
      var redirectPath = redirect || '../login.html';
      // Resolve relative path
      var currentPath = window.location.pathname;
      var currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
      if (redirectPath.indexOf('../') === 0) {
        redirectPath = currentDir + '/' + redirectPath.substring(3);
      } else if (redirectPath.indexOf('./') === 0) {
        redirectPath = currentDir + '/' + redirectPath.substring(2);
      } else if (redirectPath.indexOf('/') !== 0) {
        redirectPath = currentDir + '/' + redirectPath;
      }
      window.location.href = redirectPath;
      return false;
    }
    return true;
  }
};
