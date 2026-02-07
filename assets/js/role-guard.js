/**
 * role-guard.js — RBAC: แสดงเมนูตาม Role, redirect ถ้าไม่มีสิทธิ์
 */
var ROLES = {
  resident: 'resident',
  committee: 'committee',
  accounting: 'accounting',
  admin: 'admin',
  deputy_admin: 'deputy_admin',
  executive: 'executive',
  applicant: 'applicant'
};
var RoleGuard = {
  role: function () { return Auth.getRole(); },
  require: function (allowedRoles) {
    var r = this.role();
    if (allowedRoles.indexOf(r) >= 0) return true;
    window.location.href = (typeof getLoginUrl === 'function' ? getLoginUrl() : 'login.html');
    return false;
  },
  menu: function () {
    var r = this.role();
    var items = [];
    
    // Use new I18N system if available, fallback to old system
    var getLabel = function(key) {
      if (typeof I18N !== 'undefined' && typeof I18N.t === 'function') {
        return I18N.t('nav.' + key);
      }
      // Fallback to old system
      var lang = (typeof I18N !== 'undefined' && I18N.currentLang === 'en') ? 'en' : 'th';
      var labels = {
        th: {
          about: 'เกี่ยวกับบ้านพักครู',
          dashboard: 'แดชบอร์ด',
          billing: 'แจ้งยอด & ส่งสลิป',
        history: 'ประวัติการชำระ',
        requests: 'คำร้องย้าย/คืนบ้านพัก',
        regulations: 'ระเบียบของพันธะโค',
        manual: 'คู่มือการใช้งานโปรแกรม',
          profile: 'ข้อมูลส่วนตัว',
          waterMeter: 'บันทึกมิเตอร์น้ำ',
          electricBill: 'บันทึกค่าไฟ',
          taskStatus: 'สถานะงาน',
          summary: 'สรุปรอบการเงิน',
          ledger: 'บัญชีกองกลาง',
          bankCheck: 'ตรวจสอบยอดเงิน',
          users: 'จัดการผู้ใช้',
          roles: 'บทบาท',
          assets: 'บ้านพัก/แฟลต',
          queue: 'คิวคำร้อง',
          settings: 'ตั้งค่าระบบ',
          aboutManager: 'จัดการหน้าเกี่ยวกับ',
          reports: 'รายงาน',
          auditLog: 'Audit Log',
          executiveDashboard: 'แดชบอร์ดผู้บริหาร',
          executiveReports: 'รายงาน',
          apply: 'ยื่นคำร้อง',
          queueStatus: 'สถานะคิว',
          logout: 'ออกจากระบบ'
        },
        en: {
          about: 'About Teacher Housing',
          dashboard: 'Dashboard',
          billing: 'Submit Payment',
        history: 'Payment History',
        requests: 'Move/Return Requests',
        regulations: 'Housing Regulations',
        manual: 'User Manual',
          profile: 'Profile',
          waterMeter: 'Record Water Meter',
          electricBill: 'Record Electricity',
          taskStatus: 'Task Status',
          summary: 'Financial Summary',
          ledger: 'Central Ledger',
          bankCheck: 'Verify Balance',
          users: 'Manage Users',
          roles: 'Roles',
          assets: 'Housing/Flats',
          queue: 'Application Queue',
          settings: 'System Settings',
          aboutManager: 'Manage About Page',
          reports: 'Reports',
          auditLog: 'Audit Log',
          executiveDashboard: 'Executive Dashboard',
          executiveReports: 'Reports',
          apply: 'Apply',
          queueStatus: 'Queue Status',
          logout: 'Logout'
        }
      };
      return (labels[lang] || labels.th)[key] || key;
    };
    
    var t = {
      about: getLabel('about'),
      dashboard: getLabel('dashboard'),
      billing: getLabel('billing'),
      history: getLabel('history'),
      requests: getLabel('requests'),
      regulations: getLabel('regulations'),
      manual: getLabel('manual'),
      profile: getLabel('profile'),
      waterMeter: getLabel('waterMeter'),
      electricBill: getLabel('electricBill'),
      taskStatus: getLabel('taskStatus'),
      summary: getLabel('summary'),
      ledger: getLabel('ledger'),
      bankCheck: getLabel('bankCheck'),
      users: getLabel('users'),
      roles: getLabel('roles'),
      assets: getLabel('assets'),
      queue: getLabel('queue'),
      settings: getLabel('settings'),
      aboutManager: getLabel('aboutManager'),
      reports: getLabel('reports'),
      auditLog: getLabel('auditLog'),
      executiveDashboard: getLabel('executiveDashboard'),
      executiveReports: getLabel('executiveReports'),
      apply: getLabel('apply'),
      queueStatus: getLabel('queueStatus'),
      logout: getLabel('logout')
    };
    items.push({ href: 'index.html', label: t.about });
    if (r === ROLES.resident || r === ROLES.committee || r === ROLES.accounting) {
      items.push({ href: 'resident/dashboard.html', label: t.dashboard });
      items.push({ href: 'resident/history.html', label: t.history });
      items.push({ href: 'resident/requests.html', label: t.requests });
      items.push({ href: 'resident/regulations.html', label: t.regulations });
      items.push({ href: 'resident/manual.html', label: t.manual });
      items.push({ href: 'resident/profile.html', label: t.profile });
    }
    if (r === ROLES.committee) {
      items.push({ href: 'committee/water-meter.html', label: t.waterMeter });
      items.push({ href: 'committee/electric-bill.html', label: t.electricBill });
      items.push({ href: 'committee/task-status.html', label: t.taskStatus });
    }
    if (r === ROLES.accounting) {
      items.push({ href: 'accounting/summary.html', label: t.summary });
      items.push({ href: 'accounting/ledger.html', label: t.ledger });
      items.push({ href: 'accounting/bank-check.html', label: t.bankCheck });
    }
    if (r === ROLES.admin || r === ROLES.deputy_admin) {
      items.push({ href: 'admin/users.html', label: t.users });
      items.push({ href: 'admin/roles.html', label: t.roles });
      items.push({ href: 'admin/assets.html', label: t.assets });
      items.push({ href: 'admin/queue.html', label: t.queue });
      items.push({ href: 'admin/settings.html', label: t.settings });
      items.push({ href: 'admin/about-manager.html', label: t.aboutManager });
      items.push({ href: 'admin/reports.html', label: t.reports });
      items.push({ href: 'admin/audit-log.html', label: t.auditLog });
    }
    if (r === ROLES.executive) {
      items.push({ href: 'executive/dashboard.html', label: t.executiveDashboard });
      items.push({ href: 'executive/reports.html', label: t.executiveReports });
    }
    if (r === ROLES.applicant) {
      items.push({ href: 'applicant/apply.html', label: t.apply });
      items.push({ href: 'applicant/queue-status.html', label: t.queueStatus });
    }
    return items;
  },
  // แปลง path ให้ถูกต้องตามตำแหน่งปัจจุบัน
  resolvePath: function(href) {
    var currentPath = window.location.pathname;
    var currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    
    // ถ้า href เริ่มด้วย ../ หรือ ./ หรือ / ให้ใช้ตามนั้น
    if (href.indexOf('../') === 0 || href.indexOf('./') === 0 || href.indexOf('/') === 0) {
      return href;
    }
    
    // ถ้าอยู่ใน subfolder (เช่น resident/, admin/)
    if (currentDir.indexOf('/resident/') >= 0 || 
        currentDir.indexOf('/admin/') >= 0 ||
        currentDir.indexOf('/committee/') >= 0 ||
        currentDir.indexOf('/accounting/') >= 0 ||
        currentDir.indexOf('/executive/') >= 0 ||
        currentDir.indexOf('/applicant/') >= 0) {
      // Path ที่อยู่ใน public/ root
      if (href === 'index.html' || href === 'login.html' || href === 'register.html') {
        return '../' + href;
      }
      // Path ที่อยู่ใน subfolder เดียวกัน
      if (href.indexOf('resident/') === 0 || 
          href.indexOf('admin/') === 0 ||
          href.indexOf('committee/') === 0 ||
          href.indexOf('accounting/') === 0 ||
          href.indexOf('executive/') === 0 ||
          href.indexOf('applicant/') === 0) {
        return '../' + href;
      }
      return '../' + href;
    }
    
    return href;
  },
  
  renderNav: function (currentPath) {
    var items = this.menu();
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var resolvedHref = this.resolvePath(items[i].href);
      var cls = (currentPath && currentPath.indexOf(items[i].href) >= 0) ? ' active' : '';
      html += '<a href="' + escapeHtml(resolvedHref) + '" class="' + cls + '">' + escapeHtml(items[i].label) + '</a>';
    }
    if (Auth.isLoggedIn()) {
      var lang = (typeof I18N !== 'undefined' && I18N.currentLang === 'en') ? 'en' : 'th';
      var logoutLabel = lang === 'en' ? 'Logout' : 'ออกจากระบบ';
      html += '<a href="#" id="nav-logout">' + escapeHtml(logoutLabel) + '</a>';
    }
    return html;
  }
};
