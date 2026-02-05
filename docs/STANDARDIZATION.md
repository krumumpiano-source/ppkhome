# Frontend Standardization - Complete

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. API.js - เสริมความปลอดภัย
- ✅ เพิ่ม try-catch ทุกจุด
- ✅ Validate inputs (action, callback)
- ✅ Error handling ที่ครอบคลุม
- ✅ รองรับทั้ง GAS และ Fetch mode
- ✅ Fallback ไป Mock Data เมื่อ offline

### 2. Auth.js - รวม Redirect Logic
- ✅ เพิ่ม `Auth.requireLogin(redirect)` function
- ✅ Auto-resolve relative paths
- ✅ เพิ่ม `Auth.getUser()` helper
- ✅ ลบ hardcode redirect ออกจาก HTML

### 3. HTML Template มาตรฐาน
- ✅ สร้าง `template-standard.html`
- ✅ ลำดับ JS ที่ถูกต้อง (utils → auth → mock-data → api → role-guard → layout → ui-components)
- ✅ ใช้ Tailwind inline CSS + CDN fallback
- ✅ ใช้ `Auth.requireLogin()` แทน hardcode redirect

### 4. Migrate Pages
- ✅ `resident/dashboard.html` - ใช้ template มาตรฐาน
- ✅ `executive/dashboard.html` - ใช้ template มาตรฐาน, ไม่ hardcode role

### 5. GAS Router กลาง
- ✅ `Code.gs` - รวม router เป็นจุดเดียวใน `doPost()`
- ✅ `handleApi()` - **Deprecated (Legacy Only)**
  - ⚠️ มีไว้รองรับ legacy code เท่านั้น
  - ⚠️ **หน้าใหม่ทั้งหมด "ห้าม" เรียกใช้**
  - ⚠️ หน้าใหม่ต้องเรียกผ่าน `doPost()` router กลางเท่านั้น
- ✅ Error handling ที่ดีขึ้น

### 6. Tailwind CSS Offline Support
- ✅ สร้าง `tailwind-inline.css` สำหรับ offline mode
- ✅ CDN fallback เมื่อ online

## 📋 Template มาตรฐาน

```html
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{PAGE_TITLE}}</title>

  <!-- Tailwind (Offline-first) -->
  <link rel="stylesheet" href="../assets/css/tailwind-inline.css" />
  <script>
    if (window.location.protocol !== 'file:' && navigator.onLine) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.tailwindcss.com';
      document.head.appendChild(link);
    }
  </script>

  <!-- Core JS (ห้ามเปลี่ยนลำดับ) -->
  <script src="../assets/js/utils.js"></script>
  <script src="../assets/js/auth.js"></script>
  <script src="../assets/js/mock-data.js"></script>
  <script src="../assets/js/api.js"></script>
  <script src="../assets/js/role-guard.js"></script>
  <script src="../assets/js/layout.js"></script>
  <script src="../assets/js/ui-components.js"></script>
</head>

<body class="bg-gray-50 text-gray-900">
  <div id="app-header"></div>
  <div id="app-nav"></div>

  <main class="max-w-7xl mx-auto px-4 py-6">
    <!-- PAGE CONTENT -->
  </main>

  <script>
    if (!Auth.requireLogin()) return;
    Layout.init('{{PAGE_PATH}}');
  </script>
</body>
</html>
```

## 🔒 Security Rules

### ✅ ห้าม Hardcode Role
```javascript
// ❌ WRONG
if (Auth.getRole() !== 'admin') { ... }

// ✅ CORRECT
const role = Auth.getRole();
const allowedRoles = ['admin', 'deputy_admin'];
if (allowedRoles.indexOf(role) < 0) { ... }
```

### ✅ ใช้ Auth.requireLogin() เท่านั้น
```javascript
// ❌ WRONG
if (!Auth.isLoggedIn()) {
  location.href = '../login.html';
}

// ✅ CORRECT
if (!Auth.requireLogin()) return;
```

## 📁 File Structure

```
assets/
├── css/
│   └── tailwind-inline.css    ✅ NEW - Offline Tailwind
├── js/
│   ├── api.js                 ✅ UPDATED - Enhanced security
│   ├── auth.js                ✅ UPDATED - Added requireLogin()
│   ├── layout.js              ✅ EXISTS - No changes needed
│   ├── role-guard.js          ✅ EXISTS - No changes needed
│   └── template-standard.html ✅ NEW - Standard template

gas/
└── Code.gs                    ✅ UPDATED - Central router

public/
├── resident/
│   └── dashboard.html         ✅ MIGRATED - Uses standard template
└── executive/
    └── dashboard.html         ✅ MIGRATED - Uses standard template
```

## 🚀 Deployment Ready

### Local Preview (UI Inspection Only)
- ✅ Works with `file://` protocol (offline mode)
- ✅ Uses inline Tailwind CSS
- ✅ Mock data available
- ⚠️ **หมายเหตุ**: `file://` ไม่ใช่ server และไม่ควรถูกเรียกว่า runtime
- ⚠️ **วัตถุประสงค์**: สำหรับตรวจสอบ UI เท่านั้น ไม่ใช่การรันระบบจริง

### Local Server (Runtime Simulation)
- ✅ ใช้ `http://localhost` สำหรับรันระบบจริง
- ✅ จำลอง runtime environment
- ✅ Test API calls และ backend integration

### GitHub Pages
- ✅ Uses Tailwind CDN when online
- ✅ No hardcoded paths
- ✅ Relative paths work correctly

### Google Apps Script
- ✅ Central router in `doPost()`
- ✅ Backward compatible with `handleApi()` (legacy only)
- ✅ Proper error handling

## ⚠️ หน้าที่ยังต้อง Migrate

หน้าต่อไปนี้ยังใช้โครงสร้างเก่า (แต่ยังใช้งานได้):
- `admin/*.html` - ใช้ legacy CSS (ชั่วคราว)
- `accounting/*.html` - ใช้ legacy CSS (ชั่วคราว)
- `committee/*.html` - ควร migrate เป็น Tailwind
- `applicant/*.html` - ควร migrate เป็น Tailwind
- `resident/billing.html`, `history.html`, `profile.html` - ควร migrate

## 🚫 Must Not / 禁止事項 (ห้ามทำ)

### ⛔ ห้ามสร้างหน้าใหม่โดยไม่ใช้ template-standard.html
- ทุกหน้าต้องใช้โครงสร้างมาตรฐานเดียวกัน
- ห้ามสร้าง HTML structure เอง
- Copy จาก `template-standard.html` แล้วแก้ไขเท่านั้น

### ⛔ ห้ามเรียก handleApi() ในหน้าใหม่
- `handleApi()` เป็น legacy function เท่านั้น
- หน้าใหม่ทั้งหมดต้องเรียกผ่าน `doPost()` router กลางเท่านั้น
- Frontend เรียก `API.run()` ซึ่งจะไปที่ `doPost()` อัตโนมัติ

### ⛔ ห้ามเปลี่ยนลำดับโหลด JS มาตรฐาน
ลำดับที่ถูกต้อง (ห้ามสลับ):
1. `utils.js`
2. `auth.js`
3. `mock-data.js`
4. `api.js`
5. `role-guard.js`
6. `layout.js`
7. `ui-components.js`

### ⛔ ห้าม hardcode role หรือ redirect ใน HTML
```javascript
// ❌ WRONG - ห้ามทำ
if (Auth.getRole() !== 'admin') {
  location.href = '../login.html';
}

// ✅ CORRECT - ต้องทำแบบนี้
if (!Auth.requireLogin()) return;
const role = Auth.getRole();
const allowedRoles = ['admin', 'deputy_admin'];
if (allowedRoles.indexOf(role) < 0) {
  window.location.href = '../../index.html';
  return;
}
```

### ⛔ ห้ามใช้ CSS แบบเก่าในหน้าใหม่
- Resident / Executive / Applicant → Tailwind เท่านั้น
- Admin / Accounting → Legacy ได้ชั่วคราว (แต่หน้าใหม่ต้อง Tailwind)

## 📝 Checklist สำหรับหน้าใหม่

- [ ] ใช้ template-standard.html
- [ ] ลำดับ JS ถูกต้อง (7 ไฟล์)
- [ ] ใช้ `Auth.requireLogin()` ไม่ hardcode redirect
- [ ] ใช้ `Auth.getRole()` ไม่ hardcode role
- [ ] ใช้ Tailwind CSS เท่านั้น
- [ ] ใช้ `Layout.init('path/to/page.html')`
- [ ] **ไม่เรียก `handleApi()` โดยตรง**
- [ ] Test ทั้ง offline preview และ local server

## 🎯 Next Steps

1. Migrate หน้าที่ยังเหลือ (resident, committee, applicant)
2. Update admin/accounting pages (optional - legacy OK)
3. Test deployment ทั้ง 3 modes (local, GitHub Pages, GAS)
4. Document API endpoints
