# สถาปัตยกรรมระบบ - GitHub + Render

## ภาพรวม

ระบบบริหารจัดการบ้านพักครูใช้สถาปัตยกรรมแบบแยก Frontend และ Backend:

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend      │ ──────> │   Backend    │ ──────> │ Google Drive  │
│  (GitHub Pages) │         │   (Render)   │         │  / Sheets     │
└─────────────────┘         └──────────────┘         └──────────────┘
```

## Components

### 1. Frontend (GitHub Pages)
- **Location**: `public/`, `assets/`
- **Technology**: HTML, CSS (Tailwind), JavaScript
- **Deployment**: GitHub Pages
- **API**: เรียก Backend ผ่าน Fetch API

### 2. Backend (Render)
- **Location**: `backend/`
- **Technology**: Node.js, Express.js
- **Deployment**: Render (ฟรี 100%)
- **API**: REST API (`/api/*`)

### 3. Database (Google Sheets)
- **Location**: Google Spreadsheet
- **ID**: `1X_I7Yj1xm8IOszkD37MvVG8WUGbBrxdK6Os9nyc3UmY`
- **Sheets**: 14 sheets (Users, Units, Payments, etc.)
- **Access**: Service Account

### 4. File Storage (Google Drive)
- **Payment Slips**: Folder ID `1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF`
- **About Images**: Folder ID `1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ`
- **Exports**: Folder ID `1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg`
- **Access**: Service Account

## Data Flow

### Login Flow:
```
Frontend → POST /api/auth/login → Render Backend → Google Sheets API → Response
```

### Payment Flow:
```
Frontend → POST /api/housing/payment → Render Backend → Google Drive API (upload slip) → Google Sheets API (save payment) → Response
```

### Data Reading Flow:
```
Frontend → GET /api/housing/billing/:unitId → Render Backend → Google Sheets API → Response
```

## API Communication

### Frontend → Backend
- **Method**: Fetch API
- **Base URL**: `window.API_BASE_URL` (ตั้งค่าใน HTML)
- **Authentication**: `X-Session-Id` header
- **Format**: JSON

### Backend → Google Sheets/Drive
- **Method**: Google APIs (googleapis npm package)
- **Authentication**: Service Account JWT
- **Format**: Google Sheets/Drive API format

## Session Management

- **Storage**: In-memory (backend)
- **Expiry**: 24 hours
- **Header**: `X-Session-Id`

## Offline Mode

Frontend รองรับ Offline Mode:
- เปิดไฟล์ HTML โดยตรง (`file://`) → ใช้ Mock Data
- ไม่มี `API_BASE_URL` → ใช้ Mock Data
- `localhost` โดยไม่มี base URL → ใช้ Mock Data

## Security

- **Authentication**: Session-based (in-memory)
- **Authorization**: Role-based (RBAC)
- **Data Access**: Service Account (Google APIs)
- **CORS**: Enabled (backend)

---

**สถาปัตยกรรมนี้ใช้ GitHub + Render โดยเก็บข้อมูลที่ Google Drive/Sheets เหมือนเดิม**
