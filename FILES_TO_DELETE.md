# ⚠️ ไฟล์ที่ต้องลบด้วยตนเอง

## โฟลเดอร์ `gas/`

โฟลเดอร์ `gas/` ไม่ใช้แล้ว (ใช้ Node.js backend แทน) แต่ไฟล์ถูก lock อยู่

**วิธีลบ:**
1. ปิดไฟล์ `.gs` ทั้งหมดที่เปิดอยู่
2. ปิดโปรแกรมที่ใช้ไฟล์เหล่านี้ (เช่น Google Apps Script Editor)
3. ลบโฟลเดอร์ `gas/` ด้วยตนเอง

หรือ ignore ใน git (ทำแล้วใน `.gitignore`)

---

## ไฟล์ที่ลบแล้ว

✅ ลบไฟล์เหล่านี้แล้ว:
- `docs/GLITCH_DEPLOYMENT.md` - ไม่ใช้แล้ว (ใช้ Render)
- `docs/REPLIT_DEPLOYMENT.md` - ไม่ใช้แล้ว (ใช้ Render)
- `docs/DEPLOYMENT_OPTIONS.md` - ซ้ำซ้อน
- `docs/FRONTEND_ARCHITECTURE.md` - ซ้ำซ้อน
- `docs/ROADMAP.md` - ไม่จำเป็น
- `docs/REQUIREMENTS.md` - ไม่จำเป็น
- `docs/VERIFICATION_CHECKLIST.md` - ไม่จำเป็น
- `docs/QUICK_START.md` - ซ้ำซ้อนกับ SETUP.md
- `assets/js/i18n.js` - มี i18n-modern.js แล้ว
- `assets/js/css-loader.js` - มี css-fix.js แล้ว
- `assets/js/page-template.js` - ไม่ใช้แล้ว

---

## ไฟล์ที่ยังคงไว้

✅ ไฟล์เหล่านี้ยังจำเป็น:
- `index.html` (root) - หน้าเมนู/โครงสร้าง (ใช้ถ้า deploy จาก root)
- `public/index.html` - หน้าหลัก
- `docs/ARCHITECTURE.md` - สถาปัตยกรรมระบบ
- `docs/BACKEND_SETUP.md` - Backend setup
- `docs/RENDER_DEPLOYMENT.md` - Render deployment
- `docs/FRONTEND_API_SETUP.md` - Frontend API setup
- `docs/SHEETS_STRUCTURE.md` - Google Sheets structure
- `docs/DRIVE_SETUP.md` - Google Drive setup
- `docs/STANDARDIZATION.md` - Frontend standards
