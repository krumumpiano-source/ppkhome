# 🎨 Render Deployment Guide (ฟรี 100%)

## ขั้นตอนการ Deploy บน Render

### 1. Push Code ไป GitHub

```bash
cd "D:\AI CURSER\teacher-housing"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. สร้างบัญชี Render

1. ไปที่ [render.com](https://render.com/)
2. คลิก **Get Started for Free**
3. เลือก **Sign up with GitHub**
4. Authorize Render

### 3. สร้าง Web Service

1. คลิก **New +** → **Web Service**
2. เลือก **Connect GitHub**
3. เลือก Repository ของคุณ
4. ตั้งค่า:

#### Basic Settings:
- **Name**: `teacher-housing-backend` (หรือชื่อที่ต้องการ)
- **Region**: `Singapore` (ใกล้ไทยที่สุด)
- **Branch**: `main` (หรือ branch ที่ต้องการ)

#### Build & Deploy:
- **Root Directory**: `backend` (สำคัญ!)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. ตั้งค่า Environment Variables

1. ไปที่ **Environment** tab
2. เพิ่ม Variables:

```
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
SPREADSHEET_ID=1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY
DRIVE_FOLDER_PAYMENT_SLIPS=1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF
DRIVE_FOLDER_ABOUT_IMAGES=1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ
DRIVE_FOLDER_EXPORTS=1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg
PASSWORD_SALT=THR_DEFAULT_SALT
```

**หมายเหตุ**: `GOOGLE_CREDENTIALS` ต้องเป็น JSON string ทั้งหมด

### 5. Deploy

1. คลิก **Create Web Service**
2. Render จะ build และ deploy อัตโนมัติ
3. รอจนกว่า Status เป็น **Live** (ประมาณ 2-5 นาที)

### 6. ตรวจสอบ Deployment

1. ดู **Logs** tab - ควรเห็น `Server running on port XXXX`
2. คลิก URL ที่ Render ให้ (เช่น `https://your-app.onrender.com`)
3. ทดสอบ: `https://your-app.onrender.com/health`

---

## 🔧 การตั้งค่า Google Cloud Service Account

### 1. สร้าง Service Account

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ (หรือใช้ Project เดิม)
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
4. IAM & Admin → Service Accounts → Create Service Account
5. ตั้งชื่อ: `teacher-housing-backend`
6. Create Key → JSON → Download

### 2. Share Spreadsheet และ Folders

1. **Spreadsheet**:
   - เปิด: https://docs.google.com/spreadsheets/d/1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY/edit
   - Share → เพิ่ม Service Account email (จาก JSON: `client_email`)
   - ให้สิทธิ์: **Editor**

2. **Google Drive Folders**:
   - PaymentSlips: Share → เพิ่ม Service Account email → **Editor**
   - AboutImages: Share → เพิ่ม Service Account email → **Editor**
   - Exports: Share → เพิ่ม Service Account email → **Editor**

### 3. Copy Credentials

1. เปิด JSON file ที่ download
2. Copy ทั้งหมด (Ctrl+A, Ctrl+C)
3. Paste ใน Render Environment Variable: `GOOGLE_CREDENTIALS`

---

## 📝 Render Configuration

### Root Directory

**สำคัญมาก!** ต้องตั้งค่า:
- **Root Directory**: `backend`

เพราะโปรเจกต์มี frontend และ backend ใน repo เดียวกัน

### Build & Start Commands

- **Build Command**: `npm install`
- **Start Command**: `npm start`

Render จะ detect จาก `backend/package.json` อัตโนมัติ

### Port

Render จะตั้ง `PORT` environment variable อัตโนมัติ
- Backend ใช้ `process.env.PORT` (ตั้งไว้แล้วใน `index.js`)

---

## 🔍 Troubleshooting

### ปัญหา: Cannot find module 'googleapis'

**แก้ไข**: 
- ตรวจสอบว่า `backend/package.json` มี `googleapis` แล้ว
- ตรวจสอบว่า **Root Directory** ตั้งเป็น `backend` แล้ว

### ปัญหา: GOOGLE_CREDENTIALS is required

**แก้ไข**:
- ตรวจสอบว่า Environment Variable `GOOGLE_CREDENTIALS` ตั้งค่าแล้ว
- ต้องเป็น JSON string ทั้งหมด (ไม่ใช่ file path)

### ปัญหา: Permission denied on Spreadsheet

**แก้ไข**:
- ตรวจสอบว่า Share Spreadsheet กับ Service Account email แล้ว
- ให้สิทธิ์: **Editor**

### ปัญหา: Service account does not have access

**แก้ไข**:
- ตรวจสอบว่า Share Google Drive Folders กับ Service Account email แล้ว
- ให้สิทธิ์: **Editor**

### ปัญหา: Service sleep เมื่อ request แรก

**แก้ไข**:
- Free tier จะ sleep เมื่อไม่ใช้งาน
- Request แรกจะใช้เวลา 30-60 วินาที (cold start)
- Request ถัดไปจะเร็วปกติ
- ถ้าต้องการไม่ sleep → Upgrade เป็น Paid ($7/เดือน)

---

## 💰 ราคา

### Free Tier
- **ฟรี 100%** - ไม่มี trial, ไม่มี credit limit
- Sleep เมื่อไม่ใช้งาน (cold start 30-60 วินาที)
- Unlimited deployments
- Custom domain (ฟรี)

### Paid
- **$7/เดือน** - ไม่ sleep, เร็วกว่า
- Better performance
- Priority support

---

## 🎯 Best Practices

1. **ใช้ GitHub** - Auto-deploy เมื่อ push code
2. **Root Directory** - ตั้งเป็น `backend` (สำคัญ!)
3. **Environment Variables** - ตั้งค่าผ่าน Render Dashboard
4. **Logs** - ดู logs ใน Render Dashboard
5. **Custom Domain** - ตั้งค่าใน Settings → Custom Domain (ฟรี)
6. **Monitor** - ดู metrics ใน Dashboard

---

## 🔗 Links

- **Render Dashboard**: https://dashboard.render.com/
- **Render Docs**: https://render.com/docs/
- **Google Cloud Console**: https://console.cloud.google.com/

---

## ✅ Checklist

- [ ] Push code ไป GitHub
- [ ] สร้างบัญชี Render
- [ ] สร้าง Google Cloud Service Account
- [ ] Share Spreadsheet และ Folders
- [ ] สร้าง Web Service บน Render
- [ ] ตั้งค่า Root Directory: `backend`
- [ ] ตั้งค่า Environment Variables
- [ ] Deploy
- [ ] ทดสอบ `/health` endpoint
- [ ] ทดสอบ Login API

---

**แนะนำ: ใช้ Render เพราะฟรี 100% และใช้งานง่าย**
