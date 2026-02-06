# ระบบบริหารจัดการบ้านพักครู

Teacher Housing Management System - GitHub + Render Backend

## 🏗️ สถาปัตยกรรม

- **Frontend**: HTML/CSS/JavaScript (GitHub Pages)
- **Backend**: Node.js + Express.js (Render)
- **Database**: Google Sheets
- **File Storage**: Google Drive

## 📁 โครงสร้างโปรเจกต์

```
teacher-housing/
├── backend/          # Node.js + Express.js Backend
├── public/           # Frontend HTML Files
├── assets/           # CSS, JS, Images
├── docs/             # Documentation
├── SETUP.md          # ⭐ คู่มือ Setup ระบบ
├── DEPLOYMENT.md     # คู่มือ Deploy
└── README.md
```

ดูรายละเอียดโครงสร้างใน [`GITHUB_REPO.md`](./GITHUB_REPO.md)

## 🚀 Quick Start

### ✅ GitHub ตัวเดียวครบจบ

**ระบบเป็น GitHub Repo เดียวที่ครบจบ:**
- ✅ Frontend → GitHub Pages (ใน repo เดียว)
- ✅ Backend → Render (เชื่อมต่อกับ GitHub repo เดียว)
- ✅ Database → Google Sheets (ใช้ Google Drive เหมือนเดิม)
- ✅ File Storage → Google Drive (ใช้ Google Drive เหมือนเดิม)

### ขั้นตอนการ Setup

ดูคู่มือละเอียดใน **[`SETUP.md`](./SETUP.md)** ⭐

**สรุปขั้นตอน:**
1. Push code ไป GitHub
2. Setup Google Cloud Service Account
3. Share Spreadsheet และ Drive Folders
4. Deploy Frontend (GitHub Pages)
5. Deploy Backend (Render)
6. อัปเดต API URL

ดูรายละเอียดเพิ่มเติม:
- **[`SETUP.md`](./SETUP.md)** - คู่มือ Setup แบบละเอียด
- **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** - คู่มือ Deploy

## 🌐 Web App Mode (Single Server)

สามารถรันแบบ **Web App** ได้ทันที โดยให้ Backend เสิร์ฟหน้าเว็บจาก `/public` และ `/assets`:

```bash
cd backend
npm install
npm start
```

จากนั้นเปิดเบราว์เซอร์ที่ `http://localhost:3000`

> ค่า `API_BASE_URL` สามารถเว้นว่าง (`''`) เพื่อใช้ same-origin  
> หากแยก Frontend/Backend ให้ตั้งค่าเป็น Render URL ตามคู่มือใน `docs/FRONTEND_API_SETUP.md`

## 📚 Documentation

- **[`SETUP.md`](./SETUP.md)** - ⭐ **คู่มือ Setup ระบบ (GitHub ตัวเดียวครบจบ)** ⭐
- **[`QUICK_DEPLOY.md`](./QUICK_DEPLOY.md)** - ⚡ Quick Deploy Guide (3 ขั้นตอน)
- **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** - คู่มือ Deploy บน GitHub (Repo เดียว)
- **[`GITHUB_REPO.md`](./GITHUB_REPO.md)** - โครงสร้าง Repository
- `docs/BACKEND_SETUP.md` - Backend setup guide
- `docs/RENDER_DEPLOYMENT.md` - Render deployment guide
- `docs/FRONTEND_API_SETUP.md` - Frontend API setup guide
- `docs/ARCHITECTURE.md` - System architecture
- `docs/SHEETS_STRUCTURE.md` - Google Sheets structure
- `docs/DRIVE_SETUP.md` - Google Drive setup
- `docs/STANDARDIZATION.md` - Frontend standards

## 🔧 Environment Variables

ดูรายละเอียดใน `backend/.env.example`

## 📝 License

ISC
