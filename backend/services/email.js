const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  if (!host || !user || !pass) return null;
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
  return cachedTransporter;
}

async function sendReceiptEmail(payload) {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, message: 'ยังไม่ได้ตั้งค่า SMTP สำหรับส่งอีเมล' };
  }
  if (!payload || !payload.to) {
    return { success: false, message: 'ไม่พบอีเมลผู้รับ' };
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });
  return { success: true, messageId: info.messageId };
}

module.exports = {
  sendReceiptEmail
};
