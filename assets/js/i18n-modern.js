/**
 * i18n-modern.js — Modern Internationalization System
 * Full bilingual support: Thai (TH) and English (EN)
 * Every visible text comes from this dictionary
 */

const I18N = {
  currentLang: localStorage.getItem('app_lang') || 'th',
  
  // Complete translation dictionary
  translations: {
    th: {
      // Common
      appName: 'ระบบบริหารจัดการบ้านพักครู',
      appNameShort: 'บ้านพักครู',
      loading: 'กำลังโหลด...',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      delete: 'ลบ',
      edit: 'แก้ไข',
      search: 'ค้นหา',
      filter: 'กรอง',
      export: 'ส่งออก',
      import: 'นำเข้า',
      submit: 'ส่ง',
      back: 'กลับ',
      next: 'ถัดไป',
      previous: 'ก่อนหน้า',
      close: 'ปิด',
      confirm: 'ยืนยัน',
      success: 'สำเร็จ',
      error: 'เกิดข้อผิดพลาด',
      warning: 'คำเตือน',
      info: 'ข้อมูล',
      
      // Navigation
      nav: {
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
        logout: 'ออกจากระบบ',
        login: 'เข้าสู่ระบบ',
        register: 'ลงทะเบียน'
      },
      
      // Auth
      auth: {
        login: 'เข้าสู่ระบบ',
        logout: 'ออกจากระบบ',
        register: 'ลงทะเบียน',
        email: 'อีเมล',
        password: 'รหัสผ่าน',
        confirmPassword: 'ยืนยันรหัสผ่าน',
        forgotPassword: 'ลืมรหัสผ่าน',
        resetPassword: 'รีเซ็ตรหัสผ่าน',
        loginSuccess: 'เข้าสู่ระบบสำเร็จ',
        loginError: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        registerSuccess: 'ลงทะเบียนสำเร็จ',
        registerError: 'เกิดข้อผิดพลาดในการลงทะเบียน',
        mustChangePassword: 'กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน'
      },
      
      // Dashboard
      dashboard: {
        title: 'แดชบอร์ด',
        welcome: 'ยินดีต้อนรับ',
        currentBill: 'ยอดเดือนปัจจุบัน',
        paymentStatus: 'สถานะการชำระ',
        recentActivity: 'กิจกรรมล่าสุด',
        quickActions: 'เมนูด่วน',
        unpaid: 'ยังไม่ชำระ',
        paid: 'ชำระแล้ว',
        overdue: 'ค้างชำระ',
        onTime: 'ชำระตรงเวลา',
        late: 'ชำระล่าช้า'
      },
      
      // Billing
      billing: {
        title: 'แจ้งยอด & ส่งสลิป',
        currentRound: 'รอบเดือนปัจจุบัน',
        amount: 'จำนวนเงิน',
        submitPayment: 'ส่งสลิปการชำระ',
        uploadSlip: 'อัปโหลดสลิป',
        paymentDate: 'วันที่ชำระ',
        note: 'หมายเหตุ',
        submitSuccess: 'ส่งสลิปสำเร็จ',
        submitError: 'เกิดข้อผิดพลาด'
      },
      
      // Profile
      profile: {
        title: 'ข้อมูลส่วนตัว',
        personalInfo: 'ข้อมูลส่วนบุคคล',
        contactInfo: 'ข้อมูลติดต่อ',
        changePassword: 'เปลี่ยนรหัสผ่าน',
        currentPassword: 'รหัสผ่านปัจจุบัน',
        newPassword: 'รหัสผ่านใหม่',
        confirmNewPassword: 'ยืนยันรหัสผ่านใหม่',
        updateSuccess: 'อัปเดตข้อมูลสำเร็จ',
        updateError: 'เกิดข้อผิดพลาด'
      },
      
      // Admin
      admin: {
        title: 'จัดการระบบ',
        users: 'จัดการผู้ใช้',
        roles: 'จัดการบทบาท',
        assets: 'จัดการบ้านพัก/แฟลต',
        settings: 'ตั้งค่าระบบ',
        reports: 'รายงาน',
        auditLog: 'Audit Log'
      },
      
      // Common messages
      messages: {
        noData: 'ไม่มีข้อมูล',
        loading: 'กำลังโหลดข้อมูล...',
        saveSuccess: 'บันทึกข้อมูลสำเร็จ',
        saveError: 'เกิดข้อผิดพลาดในการบันทึก',
        deleteConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบ?',
        deleteSuccess: 'ลบข้อมูลสำเร็จ',
        deleteError: 'เกิดข้อผิดพลาดในการลบ',
        noAccount: 'ยังไม่มีบัญชี?'
      }
    },
    
    en: {
      // Common
      appName: 'Teacher Housing Management System',
      appNameShort: 'Teacher Housing',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      submit: 'Submit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      
      // Navigation
      nav: {
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
        logout: 'Logout',
        login: 'Login',
        register: 'Register'
      },
      
      // Auth
      auth: {
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot Password',
        resetPassword: 'Reset Password',
        loginSuccess: 'Login successful',
        loginError: 'Invalid email or password',
        registerSuccess: 'Registration successful',
        registerError: 'Registration failed',
        mustChangePassword: 'Please change your password before using the system'
      },
      
      // Dashboard
      dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome',
        currentBill: 'Current Month Bill',
        paymentStatus: 'Payment Status',
        recentActivity: 'Recent Activity',
        quickActions: 'Quick Actions',
        unpaid: 'Unpaid',
        paid: 'Paid',
        overdue: 'Overdue',
        onTime: 'On Time',
        late: 'Late'
      },
      
      // Billing
      billing: {
        title: 'Submit Payment',
        currentRound: 'Current Round',
        amount: 'Amount',
        submitPayment: 'Submit Payment Slip',
        uploadSlip: 'Upload Slip',
        paymentDate: 'Payment Date',
        note: 'Note',
        submitSuccess: 'Payment slip submitted successfully',
        submitError: 'Submission failed'
      },
      
      // Profile
      profile: {
        title: 'Profile',
        personalInfo: 'Personal Information',
        contactInfo: 'Contact Information',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        updateSuccess: 'Profile updated successfully',
        updateError: 'Update failed'
      },
      
      // Admin
      admin: {
        title: 'System Management',
        users: 'Manage Users',
        roles: 'Manage Roles',
        assets: 'Manage Housing/Flats',
        settings: 'System Settings',
        reports: 'Reports',
        auditLog: 'Audit Log'
      },
      
      // Common messages
      messages: {
        noData: 'No data available',
        loading: 'Loading data...',
        saveSuccess: 'Data saved successfully',
        saveError: 'Failed to save data',
        deleteConfirm: 'Are you sure you want to delete?',
        deleteSuccess: 'Data deleted successfully',
        deleteError: 'Failed to delete data',
        noAccount: 'Don\'t have an account?'
      }
    }
  },
  
  // Get translation
  t: function(key, params) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
    for (let k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback to Thai
        value = this.translations.th;
        for (let k2 of keys) {
          value = value && value[k2];
        }
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }
    
    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
    }
    
    return value;
  },
  
  // Set language
  setLang: function(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('app_lang', lang);
      this.applyTranslations();
      return true;
    }
    return false;
  },
  
  // Apply translations to all elements with data-i18n attribute
  applyTranslations: function() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });
    
    // Update page title
    const titleEl = document.querySelector('[data-i18n-title]');
    if (titleEl) {
      document.title = this.t(titleEl.getAttribute('data-i18n-title'));
    }
  },
  
  // Initialize
  init: function() {
    this.applyTranslations();
    
    // Create language switcher if not exists
    if (!document.getElementById('lang-switcher')) {
      const switcher = document.createElement('div');
      switcher.id = 'lang-switcher';
      switcher.className = 'fixed bottom-4 right-4 z-50';
      switcher.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-2 flex gap-2">
          <button onclick="I18N.setLang('th')" class="px-3 py-1 rounded ${this.currentLang === 'th' ? 'bg-blue-500 text-white' : 'bg-gray-100'}">TH</button>
          <button onclick="I18N.setLang('en')" class="px-3 py-1 rounded ${this.currentLang === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-100'}">EN</button>
        </div>
      `;
      document.body.appendChild(switcher);
    }
    
    // Trigger layout re-render if Layout exists
    if (typeof Layout !== 'undefined' && typeof Layout.init === 'function') {
      // Get current path from window location
      var currentPath = window.location.pathname;
      Layout.init(currentPath);
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18N.init());
} else {
  I18N.init();
}
