# 🚀 คู่มือ Deploy ระบบบน GitHub (Repo เดียว)

## ✅ ระบบเป็น GitHub Repo เดียวที่ครบจบ

**ระบบเป็น GitHub Repository เดียว** ที่สามารถ deploy ทั้ง Frontend และ Backend ได้:

- ✅ **Frontend** → GitHub Pages (ฟรี, ใน repo เดียว)
- ✅ **Backend** → Render (ฟรี, เชื่อมต่อกับ GitHub repo เดียว)
- ✅ **Database** → Google Sheets (ใช้ Google Drive เหมือนเดิม)
- ✅ **File Storage** → Google Drive (ใช้ Google Drive เหมือนเดิม)

**ทุกอย่างอยู่ใน repo เดียว และ deploy แยกกันตาม platform ที่เหมาะสม!**

> 💡 **หมายเหตุ**: ดูคู่มือ Setup แบบละเอียดใน [`SETUP.md`](./SETUP.md)

---

## 🎯 ขั้นตอนการ Deploy

### 1. สร้าง GitHub Repository

1. ไปที่ [GitHub](https://github.com/)
2. สร้าง Repository ใหม่
3. คัดลอก Repository URL

### 2. Push Code ไป GitHub

```bash
cd "D:\AI CURSER\teacher-housing"

# Initialize git (ถ้ายังไม่มี)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Teacher Housing Management System"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git branch -M main
git push -u origin main
```

### 3. Deploy Frontend บน GitHub Pages

1. ไปที่ Repository → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main`
4. **Folder**: `/ (root)` หรือ `/public`
   - ถ้าใช้ `/ (root)` → หน้าแรก: `index.html` (root)
   - ถ้าใช้ `/public` → หน้าแรก: `public/index.html`
5. **Save**

**URL ที่ได้**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### 4. Deploy Backend บน Render

1. ไปที่ [Render](https://render.com/)
2. **New** → **Web Service**
3. **Connect GitHub** → เลือก Repository
4. ตั้งค่า:
   - **Name**: `teacher-housing-backend`
   - **Root Directory**: `backend` ⚠️ **สำคัญมาก!**
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. ตั้งค่า **Environment Variables**:
   ```
   GOOGLE_CREDENTIALS={"type":"service_account",...}
   SPREADSHEET_ID=1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY
   DRIVE_FOLDER_PAYMENT_SLIPS=1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF
   DRIVE_FOLDER_ABOUT_IMAGES=1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ
   DRIVE_FOLDER_EXPORTS=1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg
   PASSWORD_SALT=YOUR_SECRET_SALT
   ```
6. **Create Web Service**

**URL ที่ได้**: `https://your-app.onrender.com`

### 5. อัปเดต Frontend API URL

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

### 6. ทดสอบ

1. **Frontend**: เปิด `https://YOUR_USERNAME.github.io/YOUR_REPO/`
2. **Backend**: ทดสอบ `https://your-app.onrender.com/health`
3. **Login**: ทดสอบ Login และ API calls

---

## 📁 โครงสร้างโปรเจกต์

```
teacher-housing/
├── index.html              # หน้าเมนู (root)
├── public/                 # Frontend HTML Files
│   ├── index.html         # หน้าหลัก
│   ├── login.html
│   ├── admin/
│   ├── resident/
│   └── ...
├── assets/                 # CSS, JS, Images
│   ├── css/
│   └── js/
├── backend/                # Node.js Backend
│   ├── index.js
│   ├── routes/
│   ├── services/
│   └── package.json
├── docs/                   # Documentation
├── gas/                    # GAS files (deprecated, ไม่ใช้แล้ว)
├── .gitignore             # Git ignore rules
├── render.yaml            # Render config (optional)
└── README.md
```

---

## ⚠️ สิ่งที่ต้องระวัง

### 1. ไฟล์ที่ห้าม Commit

`.gitignore` ครอบคลุมแล้ว:
- ✅ `.env` files
- ✅ `credentials.json` (Google Service Account keys)
- ✅ `node_modules/`
- ✅ Log files

### 2. Environment Variables

- ❌ **ห้าม** commit `.env` files
- ✅ ใช้ `backend/.env.example` เป็น template
- ✅ ตั้งค่า Environment Variables บน Render

### 3. Google Credentials

- ❌ **ห้าม** commit `credentials.json`
- ✅ ตั้งค่าเป็น Environment Variable `GOOGLE_CREDENTIALS` บน Render
- ✅ Copy JSON content แล้ว paste เป็น string

---

## 🔗 URLs หลัง Deploy

- **Frontend**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- **Backend**: `https://your-app.onrender.com`

---

## 📝 Checklist

- [ ] สร้าง GitHub Repository
- [ ] Push code ไป GitHub
- [ ] ตั้งค่า GitHub Pages
- [ ] สร้าง Google Cloud Service Account
- [ ] Enable Google Sheets API และ Google Drive API
- [ ] Share Spreadsheet กับ Service Account email
- [ ] Share Drive Folders กับ Service Account email
- [ ] Deploy Backend บน Render
- [ ] ตั้งค่า Environment Variables บน Render
- [ ] อัปเดต `window.API_BASE_URL` ใน Frontend
- [ ] ทดสอบ Frontend (GitHub Pages)
- [ ] ทดสอบ Backend (Render `/health`)
- [ ] ทดสอบ Login และ API calls

---

## 🎯 สรุป

**ใช่! ระบบนี้สามารถลากทุกไฟล์ลง GitHub บน repo เดียวแล้วทำงานได้**

- ✅ Frontend → GitHub Pages (ฟรี)
- ✅ Backend → Render (ฟรี)
- ✅ Database → Google Sheets (ฟรี)
- ✅ File Storage → Google Drive (ฟรี)

**ทุกอย่างอยู่ใน repo เดียว และ deploy แยกกันตาม platform ที่เหมาะสม!**

---

ดูรายละเอียดเพิ่มเติม:
- [`docs/RENDER_DEPLOYMENT.md`](./docs/RENDER_DEPLOYMENT.md) - คู่มือ Render แบบละเอียด
- [`docs/FRONTEND_API_SETUP.md`](./docs/FRONTEND_API_SETUP.md) - คู่มือตั้งค่า Frontend API
- [`docs/BACKEND_SETUP.md`](./docs/BACKEND_SETUP.md) - คู่มือ Backend Setup
