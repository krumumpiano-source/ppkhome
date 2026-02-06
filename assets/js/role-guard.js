/**
 * role-guard.js — RBAC: แสดงเมนูตาม Permission, redirect ถ้าไม่มีสิทธิ์
 */
var DEFAULT_MENU_REGISTRY = [
  {
    id: 'MENU_BILLING',
    labelKey: 'nav.billing',
    href: 'resident/billing.html',
    order: 10,
    paths: ['resident/dashboard.html', 'resident/billing.html', 'resident/history.html']
  },
  {
    id: 'MENU_WATER_ENTRY',
    labelKey: 'nav.waterEntry',
    href: 'committee/water-meter.html',
    order: 20,
    paths: ['committee/water-meter.html', 'committee/task-status.html']
  },
  {
    id: 'MENU_ELECTRIC_ENTRY',
    labelKey: 'nav.electricEntry',
    href: 'committee/electric-bill.html',
    order: 30,
    paths: ['committee/electric-bill.html']
  },
  {
    id: 'MENU_MONTHLY_DISBURSEMENT',
    labelKey: 'nav.monthlyDisbursement',
    href: 'accounting/summary.html',
    order: 40,
    paths: ['accounting/summary.html']
  },
  {
    id: 'MENU_LEDGER',
    labelKey: 'nav.ledger',
    href: 'accounting/ledger.html',
    order: 50,
    paths: ['accounting/ledger.html']
  },
  {
    id: 'MENU_SLIP_REVIEW',
    labelKey: 'nav.slipReview',
    href: 'accounting/bank-check.html',
    order: 60,
    paths: ['accounting/bank-check.html']
  },
  {
    id: 'MENU_PROFILE_SETTINGS',
    labelKey: 'nav.profileSettings',
    href: 'resident/profile.html',
    order: 70,
    paths: ['resident/profile.html']
  },
  {
    id: 'MENU_ADMIN_SETTINGS',
    labelKey: 'nav.adminSettings',
    href: 'admin/permissions.html',
    order: 80,
    paths: [
      'admin/permissions.html',
      'admin/users.html',
      'admin/roles.html',
      'admin/assets.html',
      'admin/queue.html',
      'admin/settings.html',
      'admin/about-manager.html',
      'admin/audit-log.html'
    ]
  },
  {
    id: 'MENU_RULES_FORMS',
    labelKey: 'nav.rulesForms',
    href: 'rules.html',
    order: 90,
    paths: ['rules.html', 'applicant/apply.html', 'applicant/queue-status.html']
  },
  {
    id: 'MENU_MANUAL',
    labelKey: 'nav.manual',
    href: 'manual.html',
    order: 100,
    paths: ['manual.html']
  },
  {
    id: 'MENU_REPORTS',
    labelKey: 'nav.reports',
    href: 'executive/dashboard.html',
    order: 110,
    paths: ['admin/reports.html', 'executive/dashboard.html', 'executive/reports.html']
  }
];

var DEFAULT_ROLE_MENUS = {
  admin: [
    'MENU_BILLING',
    'MENU_WATER_ENTRY',
    'MENU_ELECTRIC_ENTRY',
    'MENU_MONTHLY_DISBURSEMENT',
    'MENU_LEDGER',
    'MENU_SLIP_REVIEW',
    'MENU_PROFILE_SETTINGS',
    'MENU_ADMIN_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL',
    'MENU_REPORTS'
  ],
  deputy_admin: [
    'MENU_BILLING',
    'MENU_WATER_ENTRY',
    'MENU_ELECTRIC_ENTRY',
    'MENU_MONTHLY_DISBURSEMENT',
    'MENU_LEDGER',
    'MENU_SLIP_REVIEW',
    'MENU_PROFILE_SETTINGS',
    'MENU_ADMIN_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL',
    'MENU_REPORTS'
  ],
  committee: [
    'MENU_BILLING',
    'MENU_WATER_ENTRY',
    'MENU_ELECTRIC_ENTRY',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  accounting: [
    'MENU_MONTHLY_DISBURSEMENT',
    'MENU_LEDGER',
    'MENU_SLIP_REVIEW',
    'MENU_REPORTS',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  resident: [
    'MENU_BILLING',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  executive: [
    'MENU_REPORTS',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  applicant: [
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  water_staff: [
    'MENU_WATER_ENTRY',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  electric_staff: [
    'MENU_ELECTRIC_ENTRY',
    'MENU_PROFILE_SETTINGS',
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ],
  external: [
    'MENU_RULES_FORMS',
    'MENU_MANUAL'
  ]
};

var RoleGuard = {
  role: function () { return Auth.getRole(); },
  rolePreset: function () { return Auth.getRolePreset ? Auth.getRolePreset() : ''; },
  require: function (allowedRoles) {
    var r = this.role();
    if (allowedRoles.indexOf(r) >= 0) return true;
    window.location.href = (typeof getLoginUrl === 'function' ? getLoginUrl() : 'login.html');
    return false;
  },
  getRegistry: function () {
    var registry = Auth.getMenuRegistry ? Auth.getMenuRegistry() : [];
    if (registry && registry.length) return registry;
    return DEFAULT_MENU_REGISTRY;
  },
  getAllowedMenuIds: function () {
    var allowed = Auth.getAllowedMenus ? Auth.getAllowedMenus() : [];
    if (allowed && allowed.length) return allowed;
    var r = this.role();
    return DEFAULT_ROLE_MENUS[r] || [];
  },
  resolveLabel: function (labelKey) {
    if (typeof I18N !== 'undefined' && typeof I18N.t === 'function') {
      return I18N.t(labelKey);
    }
    var lang = (typeof I18N !== 'undefined' && I18N.currentLang === 'en') ? 'en' : 'th';
    var labels = {
      th: {
        'nav.billing': 'ยอดต้องชำระ / ส่งสลิป',
        'nav.waterEntry': 'บันทึกค่าน้ำ',
        'nav.electricEntry': 'บันทึกค่าไฟ',
        'nav.monthlyDisbursement': 'เบิกจ่ายประจำเดือน',
        'nav.ledger': 'บัญชีรายรับรายจ่าย',
        'nav.slipReview': 'ตรวจสลิป',
        'nav.profileSettings': 'ตั้งค่าข้อมูลส่วนตัว',
        'nav.adminSettings': 'ตั้งค่าแอดมิน',
        'nav.rulesForms': 'ระเบียบ / แบบฟอร์ม',
        'nav.manual': 'คู่มือ',
        'nav.reports': 'สถิติและการรายงานผล',
        'nav.logout': 'ออกจากระบบ'
      },
      en: {
        'nav.billing': 'Billing & Payment',
        'nav.waterEntry': 'Water Entry',
        'nav.electricEntry': 'Electric Entry',
        'nav.monthlyDisbursement': 'Monthly Disbursement',
        'nav.ledger': 'Income/Expense Ledger',
        'nav.slipReview': 'Slip Review',
        'nav.profileSettings': 'Profile Settings',
        'nav.adminSettings': 'Admin Settings',
        'nav.rulesForms': 'Rules & Forms',
        'nav.manual': 'Manual',
        'nav.reports': 'Statistics & Reports',
        'nav.logout': 'Logout'
      }
    };
    return (labels[lang] || labels.th)[labelKey] || labelKey;
  },
  menu: function () {
    var allowed = this.getAllowedMenuIds();
    var registry = this.getRegistry();
    var items = [];
    for (var i = 0; i < registry.length; i++) {
      if (allowed.indexOf(registry[i].id) >= 0) {
        items.push({
          id: registry[i].id,
          href: registry[i].href,
          label: this.resolveLabel(registry[i].labelKey),
          order: registry[i].order || 0
        });
      }
    }
    items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    return items;
  },
  hasMenu: function (menuId) {
    var allowed = this.getAllowedMenuIds();
    return allowed.indexOf(menuId) >= 0;
  },
  requireMenu: function (menuId, redirectPath) {
    if (!Auth.isLoggedIn()) return true;
    if (this.hasMenu(menuId)) return true;
    var fallback = redirectPath || this.resolvePath('index.html');
    window.location.href = fallback;
    return false;
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
  findMenuForPath: function (path) {
    var registry = this.getRegistry();
    var needle = path || window.location.pathname || '';
    for (var i = 0; i < registry.length; i++) {
      var paths = registry[i].paths || [];
      for (var j = 0; j < paths.length; j++) {
        if (needle.indexOf(paths[j]) >= 0) return registry[i].id;
      }
      if (registry[i].href && needle.indexOf(registry[i].href) >= 0) return registry[i].id;
    }
    return null;
  },
  guardCurrentPage: function () {
    if (!Auth.isLoggedIn()) return true;
    var menuId = this.findMenuForPath();
    if (!menuId) return true;
    if (this.hasMenu(menuId)) return true;
    var fallback = this.resolvePath('index.html');
    window.location.href = fallback;
    return false;
  },
  renderNav: function (currentPath) {
    this.guardCurrentPage();
    var items = this.menu();
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var resolvedHref = this.resolvePath(items[i].href);
      var cls = (currentPath && currentPath.indexOf(items[i].href) >= 0) ? ' active' : '';
      html += '<a href="' + escapeHtml(resolvedHref) + '" class="' + cls + '">' + escapeHtml(items[i].label) + '</a>';
    }
    if (Auth.isLoggedIn()) {
      var logoutLabel = this.resolveLabel('nav.logout');
      html += '<a href="#" id="nav-logout">' + escapeHtml(logoutLabel) + '</a>';
    }
    return html;
  }
};
