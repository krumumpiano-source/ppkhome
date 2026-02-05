# Backend Setup Guide - GitHub + Render

## สถาปัตยกรรมใหม่

ระบบเปลี่ยนจาก Google Apps Script (GAS) เป็น:
- **Backend**: Node.js + Express.js
- **Deployment**: Render (ฟรี 100%)
- **Database**: Google Sheets (เดิม)
- **File Storage**: Google Drive (เดิม)

## สิ่งที่ถูกลบออก

- ✅ โฟลเดอร์ `gas/` ทั้งหมด (18 ไฟล์ .gs)
- ✅ เอกสาร GAS Setup (`GAS_SETUP_INSTRUCTIONS.md`, `GAS_FILES_LIST.md`, `QUICK_START.md`)

## สิ่งที่ยังใช้อยู่

- ✅ Google Sheets (เก็บข้อมูล)
- ✅ Google Drive (เก็บไฟล์)
- ✅ Frontend (HTML/JS/CSS)

## การ Setup Backend

### 1. สร้าง Google Cloud Service Account

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ (หรือใช้ Project เดิม)
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. สร้าง Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - ตั้งชื่อ: `teacher-housing-backend`
   - Grant roles: (ไม่ต้องให้ role พิเศษ)
5. สร้าง Key:
   - คลิก Service Account → Keys → Add Key → JSON
   - Download JSON file

### 2. Share Spreadsheet และ Folders

1. **Spreadsheet**:
   - เปิด Spreadsheet: https://docs.google.com/spreadsheets/d/1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY/edit
   - Share → เพิ่ม Service Account email (จาก JSON file: `client_email`)
   - ให้สิทธิ์: **Editor**

2. **Google Drive Folders**:
   - PaymentSlips: Share → เพิ่ม Service Account email → **Editor**
   - AboutImages: Share → เพิ่ม Service Account email → **Editor**
   - Exports: Share → เพิ่ม Service Account email → **Editor**

### 3. ตั้งค่า Environment Variables

ใน Render หรือ `.env`:

```env
PORT=3000
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
SPREADSHEET_ID=1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY
DRIVE_FOLDER_PAYMENT_SLIPS=1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF
DRIVE_FOLDER_ABOUT_IMAGES=1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ
DRIVE_FOLDER_EXPORTS=1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg
PASSWORD_SALT=THR_DEFAULT_SALT
NOTIFICATION_WEBHOOK_URL=
```

**หมายเหตุ**: `GOOGLE_CREDENTIALS` ต้องเป็น JSON string ทั้งหมด (ไม่ใช่ file path)

### 4. Deploy บน Render

1. Push code ไป GitHub
2. ไปที่ [Render](https://render.com/)
3. New → Web Service → Connect GitHub
4. เลือก Repository
5. ตั้งค่า:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. ตั้งค่า Environment Variables (จากขั้นตอนที่ 3)
7. Deploy

### 5. ทดสอบ

```bash
curl https://your-app.onrender.com/health
```

ควรได้: `{"status":"ok","timestamp":"..."}`

ดูรายละเอียดเพิ่มเติมใน `docs/RENDER_DEPLOYMENT.md`

## API Endpoints

ดูรายละเอียดใน `backend/README.md`

## หมายเหตุสำคัญ

- **ไม่ต้องใช้ Google Apps Script อีกต่อไป**
- **Backend ใหม่ใช้ Google Sheets API โดยตรง**
- **Frontend ต้องตั้งค่า API endpoint เป็น Render URL** (ดู `docs/FRONTEND_API_SETUP.md`)
