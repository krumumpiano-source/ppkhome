/**
 * telegram.gs — ฟังก์ชันกลางส่งข้อความแจ้งเตือนผ่าน Telegram
 * ระบบบ้านพักครู (ห้ามส่งข้อมูลส่วนบุคคลละเอียด/สลิป/ยอดเงินรายบุคคล)
 */

const TELEGRAM_BOT_TOKEN = '7940290272:AAGoQyc3Wngo1XHKQuHgkD_WKiP2w6PU43Y';
const TELEGRAM_CHAT_ID = '-4890797238';

/**
 * ส่งข้อความไปยังกลุ่ม/แชท Telegram (ฟังก์ชันกลาง ใช้จาก notify.gs เท่านั้น)
 * @param {string} message ข้อความสั้น อ่านรู้เรื่อง (ไม่ส่งข้อมูลละเอียด/สลิป/ยอดรายบุคคล)
 */
function sendTelegram(message) {
  if (!message || String(message).trim() === '') return;
  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
  var payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: String(message).trim(),
    disable_web_page_preview: true
  };
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    // ไม่ throw เพื่อไม่ให้ logic หลักล้ม
  }
}
