# ⚡ Quick Deploy Guide

## 🎯 GitHub ตัวเดียวครบจบ

ระบบเป็น **GitHub Repository เดียว** ที่พร้อม deploy ทันที:

- ✅ Frontend → GitHub Pages
- ✅ Backend → Render (เชื่อมต่อ GitHub)
- ✅ Database → Google Sheets (เหมือนเดิม)
- ✅ File Storage → Google Drive (เหมือนเดิม)

---

## 🚀 3 ขั้นตอนง่ายๆ

### 1️⃣ Push ไป GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2️⃣ Deploy Frontend (GitHub Pages)

1. Repository → **Settings** → **Pages**
2. Source: `main` branch
3. Folder: `/ (root)`
4. Save

**URL**: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### 3️⃣ Deploy Backend (Render)

1. [Render](https://render.com/) → **New** → **Web Service**
2. **Connect GitHub** → เลือก Repository
3. **Root Directory**: `backend`
4. ตั้งค่า Environment Variables (ดู `backend/.env.example`)
5. Deploy

**URL**: `https://your-app.onrender.com`

---

## ⚙️ Setup Google Drive (ครั้งเดียว)

1. สร้าง Google Cloud Service Account
2. Enable Google Sheets API และ Google Drive API
3. Share Spreadsheet และ Folders กับ Service Account email
4. ตั้งค่า `GOOGLE_CREDENTIALS` บน Render

ดูรายละเอียดใน [`SETUP.md`](./SETUP.md)

---

## 🔗 อัปเดต API URL

แก้ไข `window.API_BASE_URL` ใน HTML files เป็น Render URL ของคุณ

---

## ✅ เสร็จแล้ว!

- Frontend: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- Backend: `https://your-app.onrender.com`

---

ดูรายละเอียดเพิ่มเติม:
- [`SETUP.md`](./SETUP.md) - คู่มือ Setup แบบละเอียด
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - คู่มือ Deploy แบบละเอียด
