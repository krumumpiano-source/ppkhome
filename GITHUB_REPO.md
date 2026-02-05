# 📦 GitHub Repository Structure

## ✅ ระบบเป็น GitHub Repo เดียวที่ครบจบ

ระบบนี้ถูกออกแบบให้เป็น **GitHub Repository เดียว** ที่สามารถ deploy ทั้ง Frontend และ Backend ได้ โดย:

- ✅ **Frontend** → Deploy บน GitHub Pages (ฟรี)
- ✅ **Backend** → Deploy บน Render (ฟรี, เชื่อมต่อกับ GitHub)
- ✅ **Database** → Google Sheets (ใช้ Google Drive เหมือนเดิม)
- ✅ **File Storage** → Google Drive (ใช้ Google Drive เหมือนเดิม)

---

## 📁 โครงสร้าง Repository

```
teacher-housing/
├── .github/
│   └── workflows/
│       └── deploy-backend.yml    # GitHub Actions (optional)
├── backend/                      # Node.js Backend
│   ├── index.js                  # Express app entry point
│   ├── package.json              # Dependencies
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   ├── middleware/               # Express middleware
│   ├── .env.example              # Environment variables template
│   └── .gitignore                # Backend-specific ignores
├── public/                       # Frontend HTML Files
│   ├── index.html                # หน้าหลัก
│   ├── login.html                # หน้า Login
│   ├── admin/                    # หน้า Admin
│   ├── resident/                 # หน้า Resident
│   ├── executive/                # หน้า Executive
│   └── ...
├── assets/                       # CSS, JS, Images
│   ├── css/
│   └── js/
├── docs/                         # Documentation
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   └── ...
├── gas/                          # GAS files (deprecated, ไม่ใช้แล้ว)
├── _config.yml                   # GitHub Pages config (optional)
├── .gitignore                    # Git ignore rules
├── render.yaml                   # Render config (optional)
├── README.md                     # Main README
├── SETUP.md                      # Setup guide
└── DEPLOYMENT.md                 # Deployment guide
```

---

## 🎯 การ Deploy

### Frontend (GitHub Pages)

1. **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main`
4. **Folder**: `/ (root)` หรือ `/public`
5. **Save**

**URL**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### Backend (Render)

1. **New** → **Web Service**
2. **Connect GitHub** → เลือก Repository
3. **Root Directory**: `backend`
4. **Environment Variables**: ตั้งค่าตาม `backend/.env.example`
5. **Deploy**

**URL**: `https://your-app.onrender.com`

---

## 🔐 ไฟล์ที่ห้าม Commit

`.gitignore` ครอบคลุมแล้ว:
- ✅ `.env` files
- ✅ `credentials.json` (Google Service Account keys)
- ✅ `node_modules/`
- ✅ Log files
- ✅ `gas/` folder (deprecated)

---

## 📝 Environment Variables

ตั้งค่าบน Render (ไม่ commit `.env` files):

| Variable | Description |
|----------|-------------|
| `GOOGLE_CREDENTIALS` | Service Account JSON (as string) |
| `SPREADSHEET_ID` | Google Spreadsheet ID |
| `DRIVE_FOLDER_PAYMENT_SLIPS` | Payment Slips Folder ID |
| `DRIVE_FOLDER_ABOUT_IMAGES` | About Images Folder ID |
| `DRIVE_FOLDER_EXPORTS` | Exports Folder ID |
| `PASSWORD_SALT` | Password hashing salt |

ดูรายละเอียดใน `backend/.env.example`

---

## 🔗 URLs หลัง Deploy

- **Frontend**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- **Backend**: `https://your-app.onrender.com`
- **Spreadsheet**: https://docs.google.com/spreadsheets/d/1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY/edit

---

## 📚 เอกสาร

- [`SETUP.md`](./SETUP.md) - คู่มือ Setup แบบละเอียด
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - คู่มือ Deploy
- [`README.md`](./README.md) - Main README

---

## ✅ สรุป

**ระบบเป็น GitHub Repo เดียวที่ครบจบ:**
- ✅ Frontend → GitHub Pages (ใน repo เดียว)
- ✅ Backend → Render (เชื่อมต่อกับ GitHub repo เดียว)
- ✅ Database → Google Sheets (ใช้ Google Drive เหมือนเดิม)
- ✅ File Storage → Google Drive (ใช้ Google Drive เหมือนเดิม)

**ทุกอย่างอยู่ใน repo เดียว และ deploy แยกกันตาม platform ที่เหมาะสม!**
