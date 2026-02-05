# Frontend API Setup Guide

## การตั้งค่า API Endpoint สำหรับ Frontend

### 1. ตั้งค่า API Base URL

#### วิธีที่ 1: ตั้งค่าใน HTML (แนะนำ)

เพิ่ม script ใน `<head>` ของทุกหน้า HTML:

```html
<script>
  window.API_BASE_URL = 'https://your-app.onrender.com';
</script>
```

#### วิธีที่ 2: ตั้งค่าใน `api.js`

แก้ไข `assets/js/api.js`:

```javascript
var API = {
  base: 'https://your-app.onrender.com', // ตั้งค่า Render URL ที่นี่
  // ...
};
```

#### วิธีที่ 3: ใช้ Environment Variable (สำหรับ GitHub Pages)

ถ้าใช้ GitHub Pages สามารถใช้ `window.location.origin` และตั้งค่า redirect:

```javascript
// ใน api.js
var apiBase = this.base || window.API_BASE_URL || 'https://your-app.onrender.com';
```

### 2. อัปเดต Frontend Files

แก้ไขไฟล์ HTML ที่ใช้ API:

#### ตัวอย่าง: `public/login.html`

```html
<head>
  <!-- ... -->
  <script>
    window.API_BASE_URL = 'https://your-app.onrender.com';
  </script>
  <script src="../assets/js/utils.js"></script>
  <script src="../assets/js/auth.js"></script>
  <!-- ... -->
</head>
```

### 3. ทดสอบ API Connection

เปิด Browser Console และทดสอบ:

```javascript
API.run('login', { email: 'test@example.com', password: 'test' }, function(response) {
  console.log('Response:', response);
});
```

---

## API Endpoints Mapping

Frontend ใช้ `API.run(action, params, callback)` ซึ่งจะ map ไปยัง Render endpoints อัตโนมัติ:

| Frontend Action | Render Endpoint | Method |
|----------------|----------------|--------|
| `login` | `/api/auth/login` | POST |
| `logout` | `/api/auth/logout` | POST |
| `getSession` | `/api/auth/session` | GET |
| `getMyProfile` | `/api/users/profile` | GET |
| `updateMyProfile` | `/api/users/profile` | POST |
| `getBillingForUnit` | `/api/housing/billing/:unitId` | GET |
| `submitPayment` | `/api/housing/payment` | POST |
| `getMyPaymentStatusList` | `/api/housing/payment-status` | GET |
| `getWaterFormData` | `/api/housing/water-form/:unitId` | GET |
| `submitWaterReading` | `/api/housing/water-reading` | POST |
| `getElectricFormData` | `/api/housing/electric-form/:roundId` | GET |
| `submitElectricReadings` | `/api/housing/electric-reading` | POST |
| `submitRepairRequest` | `/api/housing/repair-request` | POST |
| `submitApplication` | `/api/housing/application` | POST |
| `getMyQueueStatus` | `/api/housing/queue-status/:applicationId` | GET |
| `listApplicationsAndQueue` | `/api/housing/applications-queue` | GET |
| `reorderQueue` | `/api/housing/reorder-queue` | POST |
| `getRoundSummary` | `/api/report/round-summary/:roundId` | GET |
| `getCentralLedger` | `/api/report/central-ledger/:roundId` | GET |
| `verifyBankBalance` | `/api/report/verify-bank-balance` | POST |
| `getExecutiveDashboard` | `/api/report/executive-dashboard` | GET |
| `getReportByPeriod` | `/api/report/period` | GET |
| `getAuditLog` | `/api/report/audit-log` | GET |

---

## Session Management

Frontend ต้องส่ง `sessionId` ในทุก request:

### วิธีที่ 1: ใช้ Header (แนะนำ)

`api.js` จะส่ง `X-Session-Id` header อัตโนมัติถ้ามี `params.sessionId`

### วิธีที่ 2: ใช้ Query Parameter

```javascript
API.run('getMyProfile', { sessionId: Auth.getSessionId() }, callback);
```

---

## Offline Mode

Frontend ยังรองรับ Offline Mode ด้วย Mock Data:

- เปิดไฟล์ HTML โดยตรง (`file://`) → ใช้ Mock Data
- ไม่มี `API_BASE_URL` → ใช้ Mock Data
- `localhost` โดยไม่มี base URL → ใช้ Mock Data

---

## Troubleshooting

### ปัญหา: CORS Error

**แก้ไข**: 
- ตรวจสอบว่า Render backend ตั้งค่า CORS แล้ว (`cors` middleware ใน `index.js`)
- ตรวจสอบว่า API Base URL ถูกต้อง

### ปัญหา: 404 Not Found

**แก้ไข**:
- ตรวจสอบว่า API endpoint ถูกต้อง
- ตรวจสอบว่า Render service กำลังรันอยู่
- ดู Logs ใน Render Dashboard

### ปัญหา: Unauthorized

**แก้ไข**:
- ตรวจสอบว่า `sessionId` ส่งไปใน request
- ตรวจสอบว่า session ยังไม่หมดอายุ (24 ชั่วโมง)

---

## Checklist

- [ ] ตั้งค่า `API_BASE_URL` ใน HTML หรือ `api.js`
- [ ] ทดสอบ `/health` endpoint
- [ ] ทดสอบ Login API
- [ ] ตรวจสอบ CORS settings
- [ ] ตรวจสอบ Session management

---

**หมายเหตุ**: Frontend จะใช้ Render API endpoint แทน GAS Web App URL
