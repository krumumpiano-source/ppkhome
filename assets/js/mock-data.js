/**
 * mock-data.js — ข้อมูลจำลองสำหรับทดสอบ Offline Mode
 * เมื่อเปิดไฟล์ HTML จากเครื่องคอมพิวเตอร์ (file://)
 * ข้อมูลนี้จะถูกใช้แทนการเรียก API จริง
 */

var MOCK_DATA = {
  // Mock session สำหรับทดสอบ
  session: {
    sessionId: 'mock_session_' + Date.now(),
    userId: 'mock_user_001',
    role: 'resident',
    unitId: '5',
    email: 'test@example.com',
    fullName: 'ผู้ทดสอบระบบ'
  },

  menuRegistry: [
    { id: 'MENU_BILLING', labelKey: 'nav.billing', href: 'resident/billing.html', order: 10, paths: ['resident/dashboard.html', 'resident/billing.html', 'resident/history.html'] },
    { id: 'MENU_WATER_ENTRY', labelKey: 'nav.waterEntry', href: 'committee/water-meter.html', order: 20, paths: ['committee/water-meter.html', 'committee/task-status.html'] },
    { id: 'MENU_ELECTRIC_ENTRY', labelKey: 'nav.electricEntry', href: 'committee/electric-bill.html', order: 30, paths: ['committee/electric-bill.html'] },
    { id: 'MENU_MONTHLY_DISBURSEMENT', labelKey: 'nav.monthlyDisbursement', href: 'accounting/summary.html', order: 40, paths: ['accounting/summary.html'] },
    { id: 'MENU_LEDGER', labelKey: 'nav.ledger', href: 'accounting/ledger.html', order: 50, paths: ['accounting/ledger.html'] },
    { id: 'MENU_SLIP_REVIEW', labelKey: 'nav.slipReview', href: 'accounting/bank-check.html', order: 60, paths: ['accounting/bank-check.html'] },
    { id: 'MENU_PROFILE_SETTINGS', labelKey: 'nav.profileSettings', href: 'resident/profile.html', order: 70, paths: ['resident/profile.html'] },
    { id: 'MENU_ADMIN_SETTINGS', labelKey: 'nav.adminSettings', href: 'admin/permissions.html', order: 80, paths: ['admin/permissions.html', 'admin/users.html', 'admin/roles.html', 'admin/assets.html', 'admin/queue.html', 'admin/settings.html', 'admin/about-manager.html', 'admin/audit-log.html'] },
    { id: 'MENU_RULES_FORMS', labelKey: 'nav.rulesForms', href: 'rules.html', order: 90, paths: ['rules.html', 'applicant/apply.html', 'applicant/queue-status.html'] },
    { id: 'MENU_MANUAL', labelKey: 'nav.manual', href: 'manual.html', order: 100, paths: ['manual.html'] },
    { id: 'MENU_REPORTS', labelKey: 'nav.reports', href: 'executive/dashboard.html', order: 110, paths: ['admin/reports.html', 'executive/dashboard.html', 'executive/reports.html'] }
  ],
  defaultRoleMenus: {
    admin: ['MENU_BILLING', 'MENU_WATER_ENTRY', 'MENU_ELECTRIC_ENTRY', 'MENU_MONTHLY_DISBURSEMENT', 'MENU_LEDGER', 'MENU_SLIP_REVIEW', 'MENU_PROFILE_SETTINGS', 'MENU_ADMIN_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL', 'MENU_REPORTS'],
    deputy_admin: ['MENU_BILLING', 'MENU_WATER_ENTRY', 'MENU_ELECTRIC_ENTRY', 'MENU_MONTHLY_DISBURSEMENT', 'MENU_LEDGER', 'MENU_SLIP_REVIEW', 'MENU_PROFILE_SETTINGS', 'MENU_ADMIN_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL', 'MENU_REPORTS'],
    committee: ['MENU_BILLING', 'MENU_WATER_ENTRY', 'MENU_ELECTRIC_ENTRY', 'MENU_PROFILE_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL'],
    accounting: ['MENU_MONTHLY_DISBURSEMENT', 'MENU_LEDGER', 'MENU_SLIP_REVIEW', 'MENU_REPORTS', 'MENU_PROFILE_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL'],
    resident: ['MENU_BILLING', 'MENU_PROFILE_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL'],
    executive: ['MENU_REPORTS', 'MENU_PROFILE_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL'],
    applicant: ['MENU_RULES_FORMS', 'MENU_MANUAL'],
    water_staff: ['MENU_WATER_ENTRY', 'MENU_PROFILE_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL'],
    electric_staff: ['MENU_ELECTRIC_ENTRY', 'MENU_PROFILE_SETTINGS', 'MENU_RULES_FORMS', 'MENU_MANUAL'],
    external: ['MENU_RULES_FORMS', 'MENU_MANUAL']
  },
  
  // Mock responses สำหรับแต่ละ API action
  responses: {
    login: function(params) {
      if (params.email === 'admin@test.com' && params.password === 'admin123') {
        return {
          success: true,
          sessionId: 'mock_admin_' + Date.now(),
          userId: 'admin_001',
          role: 'admin',
          unitId: null,
          allowedMenus: getMockAllowedMenus('admin'),
          menuRegistry: MOCK_DATA.menuRegistry,
          rolePreset: 'ADMIN',
          message: 'เข้าสู่ระบบสำเร็จ'
        };
      }
      if (params.email === 'resident@test.com' && params.password === 'res123') {
        return {
          success: true,
          sessionId: 'mock_res_' + Date.now(),
          userId: 'res_001',
          role: 'resident',
          unitId: '5',
          allowedMenus: getMockAllowedMenus('resident'),
          menuRegistry: MOCK_DATA.menuRegistry,
          rolePreset: 'RESIDENT',
          message: 'เข้าสู่ระบบสำเร็จ'
        };
      }
      return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    },
    
    getSession: function(params) {
      var stored = localStorage.getItem('mock_session');
      if (stored) return JSON.parse(stored);
      return null;
    },

    getMenuRegistry: function() {
      return { success: true, menus: MOCK_DATA.menuRegistry };
    },

    getMyPermissions: function() {
      var role = MOCK_DATA.session.role || 'resident';
      return {
        success: true,
        allowedMenus: getMockAllowedMenus(role),
        menuRegistry: MOCK_DATA.menuRegistry,
        rolePreset: role.toUpperCase()
      };
    },

    getUserMenuPermissions: function(params) {
      var role = (params && params.role) || 'resident';
      return {
        success: true,
        user: {
          userId: params.userId || 'res_001',
          email: 'resident@test.com',
          fullName: 'ผู้ทดสอบระบบ',
          role: role
        },
        rolePreset: role.toUpperCase(),
        menus: buildMockMenuPermissions(role)
      };
    },

    updateUserMenuPermissions: function(params) {
      return { success: true, changes: [], rolePreset: 'RESIDENT' };
    },

    resetUserMenuPermissions: function(params) {
      return { success: true, removed: [] };
    },

    getPermissionAudit: function(params) {
      return {
        success: true,
        rows: [
          {
            when: new Date().toISOString(),
            actorUserId: 'admin_001',
            action: 'permission_update',
            detail: { targetUserId: params.targetUserId || 'res_001', changes: [] }
          }
        ]
      };
    },
    
    getBillingForUnit: function(params) {
      return {
        success: true,
        round: { id: 'round_202501', month: 1, year: 2025, status: 'open' },
        items: [
          { type: 'water', amount: 450 },
          { type: 'electric', amount: 1200 },
          { type: 'common', amount: 200 }
        ],
        total: 1850,
        status: 'unpaid',
        payment: null
      };
    },
    
    getMyPaymentStatusList: function(params) {
      return {
        success: true,
        items: [
          {
            roundId: 'round_202501',
            round_month: 1,
            round_year: 2025,
            billing_date: '2025-01-01',
            due_date: '2025-01-06',
            payment_date: null,
            payment_status: 'UNPAID',
            late_days: 0
          },
          {
            roundId: 'round_202412',
            round_month: 12,
            round_year: 2024,
            billing_date: '2024-12-01',
            due_date: '2024-12-06',
            payment_date: '2024-12-10',
            payment_status: 'PAID_LATE',
            late_days: 4
          },
          {
            roundId: 'round_202411',
            round_month: 11,
            round_year: 2024,
            billing_date: '2024-11-01',
            due_date: '2024-11-06',
            payment_date: '2024-11-05',
            payment_status: 'PAID_ON_TIME',
            late_days: 0
          }
        ]
      };
    },
    
    getAboutContent: function(params) {
      return {
        success: true,
        sections: [
          {
            sectionId: 'about_1',
            title: 'เกี่ยวกับบ้านพักครู',
            body: 'บ้านพักครูเป็นที่พักอาศัยสำหรับบุคลากรทางการศึกษา จำนวน 17 หลัง และแฟลต 16 ยูนิต',
            visible: true,
            order: 1
          }
        ]
      };
    },
    
    getMyProfile: function(params) {
      return {
        success: true,
        profile: {
          userId: 'res_001',
          email: 'resident@test.com',
          fullName: 'ผู้ทดสอบระบบ',
          phone: '0812345678',
          role: 'resident',
          unitId: '5',
          status: 'active'
        }
      };
    },
    
    listUsers: function(params) {
      return {
        success: true,
        users: [
          {
            userId: 'res_001',
            email: 'resident@test.com',
            fullName: 'ผู้ทดสอบระบบ',
            role: 'resident',
            unitId: '5',
            status: 'active'
          }
        ]
      };
    },
    
    getPaymentHistory: function(params) {
      return {
        success: true,
        rows: [
          {
            roundId: 'round_202412',
            unitId: '5',
            amount: 1850,
            date: '2024-12-10',
            verified: true
          }
        ]
      };
    },
    
    getExecutiveDashboard: function(params) {
      return {
        success: true,
        totalUnits: 33,
        occupied: 28,
        vacant: 5,
        paymentRate: 85,
        overdueCount: 4,
        centralBalance: 125000,
        applicationsTotal: 12,
        applicationsInQueue: 8
      };
    },
    
    getAuditLog: function(params) {
      return {
        success: true,
        rows: [
          {
            timestamp: new Date().toISOString(),
            userId: 'admin_001',
            action: 'user_status',
            details: { target: 'res_001', value: 'active' }
          }
        ]
      };
    },
    
    getWaterFormData: function(params) {
      return {
        success: true,
        unitId: params.unitId || '1',
        prevReading: 150,
        prevDate: '2024-12-01',
        ratePerUnit: 9
      };
    },
    
    submitWaterReading: function(params) {
      return {
        success: true,
        message: 'บันทึกเรียบร้อย',
        units: 10,
        amount: 90
      };
    },
    
    getElectricFormData: function(params) {
      return {
        success: true,
        roundId: params.roundId || 'R202501',
        units: [
          { unitId: '1', type: 'house' },
          { unitId: 'F1', type: 'flat' }
        ]
      };
    },
    
    submitElectricReadings: function(params) {
      return {
        success: true,
        message: 'บันทึกเรียบร้อย'
      };
    },
    
    getRoundSummary: function(params) {
      return {
        success: true,
        roundId: params.roundId || 'R202501',
        depositWater: 1530,
        depositElectric: 19200,
        depositTotal: 20730,
        commonFeeTotal: 5600,
        vacantMeterFee: 9
      };
    },
    
    getCentralLedger: function(params) {
      return {
        success: true,
        income: [
          { desc: 'ค่าส่วนกลาง', amount: 5600 },
          { desc: 'ส่วนต่างปัดเศษ', amount: 50 }
        ],
        expense: [
          { desc: 'ค่าขยะ', amount: 500 },
          { desc: 'ค่าไฟสูญเสีย', amount: 200 }
        ],
        balance: 4950
      };
    },
    
    verifyBankBalance: function(params) {
      return {
        success: true,
        systemBalance: 20730,
        bankBalance: Number(params.bankBalance) || 20730,
        difference: 0,
        match: true,
        message: 'ตรงกัน'
      };
    },
    
    listApplicationsAndQueue: function(params) {
      return {
        success: true,
        items: [
          {
            applicationId: 'app_001',
            fullName: 'ผู้ทดสอบ',
            email: 'test@example.com',
            status: 'in_queue',
            order: 1
          }
        ]
      };
    },
    
    reorderQueue: function(params) {
      return {
        success: true,
        message: 'จัดลำดับคิวเรียบร้อย'
      };
    },
    
    getAboutContent: function(params) {
      return {
        success: true,
        sections: [
          {
            sectionId: 'about_1',
            title: 'เกี่ยวกับบ้านพักครู',
            body: 'บ้านพักครูเป็นที่พักอาศัยสำหรับบุคลากรทางการศึกษา จำนวน 17 หลัง และแฟลต 16 ยูนิต',
            visible: true,
            order: 1
          }
        ]
      };
    },
    
    submitApplication: function(params) {
      var payload = typeof params.payload === 'string' ? JSON.parse(params.payload) : params.payload;
      return {
        success: true,
        applicationId: 'app_' + Date.now(),
        message: 'ยื่นคำร้องเรียบร้อย'
      };
    },
    
    getMyQueueStatus: function(params) {
      return {
        success: true,
        position: 5,
        ahead: 4,
        status: 'in_queue',
        expiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString()
      };
    },
    
    submitPayment: function(params) {
      return {
        success: true,
        message: 'ส่งหลักฐานเรียบร้อย รอการตรวจสอบ'
      };
    },
    
    updateMyProfile: function(params) {
      return {
        success: true,
        message: 'บันทึกเรียบร้อย'
      };
    },
    
    changePassword: function(params) {
      return {
        success: true,
        message: 'เปลี่ยนรหัสผ่านเรียบร้อย'
      };
    },
    
    requestPasswordReset: function(params) {
      return {
        success: true,
        message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว'
      };
    },
    
    resetPasswordWithToken: function(params) {
      return {
        success: true,
        message: 'ตั้งรหัสผ่านใหม่เรียบร้อย'
      };
    },
    
    registerRequest: function(params) {
      return {
        success: true,
        message: 'ส่งคำขอลงทะเบียนเรียบร้อย เจ้าหน้าที่จะตรวจสอบและแจ้งผลทางอีเมล'
      };
    },
    
    getReportByPeriod: function(params) {
      return {
        success: true,
        report: {
          from: params.fromDate || '2025-01-01',
          to: params.toDate || '2025-01-31',
          paymentCount: 25,
          totalAmount: 46250
        }
      };
    }
  }
};

function getMockAllowedMenus(role) {
  return (MOCK_DATA.defaultRoleMenus[role] || []).slice();
}

function buildMockMenuPermissions(role) {
  var allowed = getMockAllowedMenus(role);
  return MOCK_DATA.menuRegistry.map(function(menu) {
    var isAllowed = allowed.indexOf(menu.id) >= 0;
    return {
      id: menu.id,
      labelKey: menu.labelKey,
      href: menu.href,
      defaultAllowed: isAllowed,
      allowed: isAllowed,
      overridden: false
    };
  });
}

// Helper: ตรวจสอบว่าเป็น offline mode หรือไม่
function isOfflineMode() {
  return window.location.protocol === 'file:' || 
         window.location.hostname === '' ||
         window.location.hostname === 'localhost';
}

// Helper: ดึง mock response
function getMockResponse(action, params) {
  if (MOCK_DATA.responses[action]) {
    var response = MOCK_DATA.responses[action](params);
    // Simulate async delay
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve(response);
      }, 100);
    });
  }
  return Promise.resolve({ 
    success: false, 
    message: 'Mock data not available for: ' + action 
  });
}
