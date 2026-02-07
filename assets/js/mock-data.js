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
    
    getBillingForUnit: function(params) {
      var roundId = params.roundId || 'round_202501';
      var isPrevious = roundId === 'round_202412';
      var total = isPrevious ? 1600 : 1850;
      return {
        success: true,
        round: { id: roundId, month: isPrevious ? 12 : 1, year: isPrevious ? 2024 : 2025, status: 'open' },
        items: [
          { type: 'water', amount: isPrevious ? 400 : 450 },
          { type: 'electric', amount: isPrevious ? 1000 : 1200 },
          { type: 'common', amount: 200 }
        ],
        total: total,
        status: isPrevious ? 'paid' : 'unpaid',
        payment: isPrevious ? { amount: total, date: '2024-12-10', verified: true } : null,
        billingDate: isPrevious ? '2024-12-01' : '2025-01-01',
        dueDate: isPrevious ? '2024-12-06' : '2025-01-06'
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
          status: 'active',
          householdMembers: 'คู่สมรส 1 คน',
          birthDate: '1990-01-01',
          subjectGroup: 'คณิตศาสตร์',
          houseRegNo: '123456789',
          houseNo: '99/9',
          villageName: 'บ้านพักครู',
          moo: '5',
          soi: 'สุขสันต์',
          road: 'การศึกษา',
          subdistrict: 'ในเมือง',
          district: 'เมือง',
          province: 'ขอนแก่น',
          postalCode: '40000',
          pdpaConsent: true,
          pdpaConsentAt: '2025-01-01'
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

    submitResidentRequest: function(params) {
      return {
        success: true,
        message: 'ส่งคำร้องเรียบร้อย'
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
