# 🚀 คู่มือ Setup ระบบ (GitHub ตัวเดียวครบจบ)

## ✅ ระบบเป็น GitHub Repo เดียวที่ครบจบ

- ✅ **Frontend** → GitHub Pages (ใน repo เดียว)
- ✅ **Backend** → Render (เชื่อมต่อกับ GitHub repo เดียว)
- ✅ **Database** → Google Sheets (ใช้ Google Drive เหมือนเดิม)
- ✅ **File Storage** → Google Drive (ใช้ Google Drive เหมือนเดิม)

---

## 📋 ขั้นตอนการ Setup

### 1. Push Code ไป GitHub

```bash
cd "D:\AI CURSER\teacher-housing"

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Teacher Housing Management System"

# Add remote (แทน YOUR_USERNAME และ YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git branch -M main
git push -u origin main
```

### 2. Setup Google Cloud Service Account

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ (หรือใช้ Project เดิม)
3. Enable APIs:
   - **Google Sheets API**
   - **Google Drive API**
4. สร้าง Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - ตั้งชื่อ: `teacher-housing-backend`
5. สร้าง Key:
   - คลิก Service Account → Keys → Add Key → JSON
   - **Download JSON file** (เก็บไว้ปลอดภัย)

### 3. Share Google Drive Resources

#### 3.1 Share Spreadsheet

1. เปิด Spreadsheet: https://docs.google.com/spreadsheets/d/1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY/edit
2. คลิก **Share** (มุมขวาบน)
3. เพิ่ม Service Account email (จาก JSON file: `client_email`)
4. ให้สิทธิ์: **Editor**
5. คลิก **Send**

#### 3.2 Share Drive Folders

ทำเหมือนกันสำหรับ 3 folders:

1. **PaymentSlips** (ID: `1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF`)
   - Share → เพิ่ม Service Account email → **Editor**

2. **AboutImages** (ID: `1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ`)
   - Share → เพิ่ม Service Account email → **Editor**

3. **Exports** (ID: `1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg`)
   - Share → เพิ่ม Service Account email → **Editor**

### 4. Deploy Frontend (GitHub Pages)

1. ไปที่ GitHub Repository → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main`
4. **Folder**: `/ (root)` 
   - หรือ `/public` ถ้าต้องการให้หน้าแรกอยู่ที่ `public/index.html`
5. **Save**

**Frontend URL**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### 5. Deploy Backend (Render)

1. ไปที่ [Render](https://render.com/)
2. Sign up/Sign in ด้วย GitHub
3. **New** → **Web Service**
4. **Connect GitHub** → เลือก Repository
5. ตั้งค่า:
   - **Name**: `teacher-housing-backend`
   - **Root Directory**: `backend` ⚠️ **สำคัญมาก!**
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. ตั้งค่า **Environment Variables**:
   
   | Key | Value |
   |-----|-------|
   | `GOOGLE_CREDENTIALS` | Copy ทั้ง JSON file แล้ว paste (เป็น string) |
   | `SPREADSHEET_ID` | `1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY` |
   | `DRIVE_FOLDER_PAYMENT_SLIPS` | `1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF` |
   | `DRIVE_FOLDER_ABOUT_IMAGES` | `1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ` |
   | `DRIVE_FOLDER_EXPORTS` | `1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg` |
   | `PASSWORD_SALT` | ตั้งค่าตัวเอง (เช่น `YOUR_SECRET_SALT_123`) |

7. **Create Web Service**
8. รอจนกว่า Status เป็น **Live** (ประมาณ 2-5 นาที)

**Backend URL**: `https://your-app.onrender.com`

### 6. อัปเดต Frontend API URL

หลังจากได้ Render URL แล้ว:

#### วิธีที่ 1: แก้ไขใน HTML files (แนะนำ)

แก้ไขไฟล์เหล่านี้:
- `public/login.html`
- `public/index.html`
- `public/register.html`
- `public/resident/dashboard.html`
- `public/executive/dashboard.html`
- และไฟล์อื่นๆ ที่มี `<script>window.API_BASE_URL = ...</script>`

เปลี่ยนจาก:
```javascript
window.API_BASE_URL = 'https://your-app.onrender.com';
```

เป็น Render URL จริงของคุณ:
```javascript
window.API_BASE_URL = 'https://your-actual-app.onrender.com';
```

#### วิธีที่ 2: แก้ไขใน api.js (ครั้งเดียว)

แก้ไข `assets/js/api.js`:
```javascript
var API = {
  base: 'https://your-actual-app.onrender.com', // ตั้งค่าที่นี่
  // ...
};
```

### 7. Commit และ Push การเปลี่ยนแปลง

```bash
git add .
git commit -m "Update API_BASE_URL to Render URL"
git push origin main
```

---

## ✅ ทดสอบระบบ

### 1. ทดสอบ Backend

เปิดเบราว์เซอร์ไปที่:
```
https://your-app.onrender.com/health
```

ควรได้:
```json
{"status":"ok","timestamp":"..."}
```

### 2. ทดสอบ Frontend

เปิดเบราว์เซอร์ไปที่:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

### 3. ทดสอบ Login

1. เปิดหน้า Login
2. ทดสอบ Login ด้วยบัญชีที่สร้างไว้
3. ตรวจสอบว่า API calls ทำงานได้

---

## 📁 โครงสร้าง Repo

```
teacher-housing/
├── .github/
│   └── workflows/          # GitHub Actions (optional)
├── backend/                # Node.js Backend
│   ├── index.js
│   ├── routes/
│   ├── services/
│   └── package.json
├── public/                 # Frontend HTML Files
│   ├── index.html
│   ├── login.html
│   └── ...
├── assets/                 # CSS, JS
│   ├── css/
│   └── js/
├── docs/                   # Documentation
├── _config.yml             # GitHub Pages config (optional)
├── .gitignore             # Git ignore rules
├── render.yaml            # Render config (optional)
├── README.md
├── DEPLOYMENT.md
└── SETUP.md               # ไฟล์นี้
```

---

## 🔗 URLs หลัง Setup

- **Frontend**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- **Backend**: `https://your-app.onrender.com`
- **Spreadsheet**: https://docs.google.com/spreadsheets/d/1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY/edit

---

## 📝 Checklist

- [ ] Push code ไป GitHub
- [ ] สร้าง Google Cloud Service Account
- [ ] Enable Google Sheets API และ Google Drive API
- [ ] Download JSON credentials
- [ ] Share Spreadsheet กับ Service Account email
- [ ] Share Drive Folders (3 folders) กับ Service Account email
- [ ] Deploy Frontend บน GitHub Pages
- [ ] Deploy Backend บน Render
- [ ] ตั้งค่า Environment Variables บน Render
- [ ] อัปเดต `window.API_BASE_URL` ใน Frontend
- [ ] Commit และ Push การเปลี่ยนแปลง
- [ ] ทดสอบ Backend (`/health`)
- [ ] ทดสอบ Frontend (GitHub Pages)
- [ ] ทดสอบ Login และ API calls

---

## 🎯 สรุป

**ระบบเป็น GitHub Repo เดียวที่ครบจบ:**

- ✅ Frontend → GitHub Pages (ใน repo เดียว)
- ✅ Backend → Render (เชื่อมต่อกับ GitHub repo เดียว)
- ✅ Database → Google Sheets (ใช้ Google Drive เหมือนเดิม)
- ✅ File Storage → Google Drive (ใช้ Google Drive เหมือนเดิม)

**ทุกอย่างอยู่ใน repo เดียว และ deploy แยกกันตาม platform ที่เหมาะสม!**

---

## 📚 เอกสารเพิ่มเติม

- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - คู่มือ Deploy แบบละเอียด
- [`docs/BACKEND_SETUP.md`](./docs/BACKEND_SETUP.md) - Backend Setup Guide
- [`docs/RENDER_DEPLOYMENT.md`](./docs/RENDER_DEPLOYMENT.md) - Render Deployment Guide
- [`docs/FRONTEND_API_SETUP.md`](./docs/FRONTEND_API_SETUP.md) - Frontend API Setup
- [`docs/SHEETS_STRUCTURE.md`](./docs/SHEETS_STRUCTURE.md) - Google Sheets Structure
