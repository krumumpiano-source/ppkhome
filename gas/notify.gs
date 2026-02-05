/**
 * notify.gs — แจ้งเตือนแต่ละเหตุการณ์ ผ่าน sendTelegram เท่านั้น
 * เนื้อหาสั้น ไม่ส่งข้อมูลส่วนบุคคลละเอียด/สลิป/ยอดเงินรายบุคคล
 */

/**
 * [1] มีการแจ้งชำระค่าใช้จ่าย
 * data: { houseNo, month, year }
 */
function notifyPaymentSubmitted(data) {
  var houseNo = (data && data.houseNo) ? data.houseNo : '-';
  var month = (data && data.month) ? data.month : '';
  var year = (data && data.year) ? data.year : '';
  var msg = '🏡 มีการแจ้งชำระค่าใช้จ่ายบ้านพักครู\n• บ้าน/แฟลต: ' + houseNo + '\n• เดือน: ' + month + ' ' + year + '\nกรุณาตรวจสอบในระบบ';
  sendTelegram(msg);
}

/**
 * [2] มีคำร้องขอเข้าพัก
 * data: { name, date }
 */
function notifyNewApplication(data) {
  var name = (data && data.name) ? data.name : 'ผู้ยื่นคำร้อง';
  var date = (data && data.date) ? data.date : '';
  var msg = '📥 มีคำร้องขอเข้าพักบ้านพักครู\n• ผู้ยื่นคำร้อง: ' + name + '\n• วันที่ยื่น: ' + date;
  sendTelegram(msg);
}

/**
 * [3] มีคำร้องแจ้งซ่อม / ปรับปรุง / ต่อเติม
 * data: { houseNo, type }
 */
function notifyRepairRequest(data) {
  var houseNo = (data && data.houseNo) ? data.houseNo : '-';
  var type = (data && data.type) ? data.type : 'แจ้งซ่อม';
  var msg = '🛠 มีคำร้องแจ้งซ่อมบ้านพักครู\n• บ้าน/แฟลต: ' + houseNo + '\n• ประเภท: ' + type;
  sendTelegram(msg);
}

/**
 * [4] บันทึกมิเตอร์น้ำเสร็จ
 * data: { month, year }
 */
function notifyWaterRecorded(data) {
  var month = (data && data.month) ? data.month : '';
  var year = (data && data.year) ? data.year : '';
  var msg = '💧 บันทึกมิเตอร์น้ำเสร็จสิ้น\n• รอบเดือน: ' + month + ' ' + year;
  sendTelegram(msg);
}

/**
 * [5] บันทึกค่าไฟเสร็จ
 * data: { month, year }
 */
function notifyElectricRecorded(data) {
  var month = (data && data.month) ? data.month : '';
  var year = (data && data.year) ? data.year : '';
  var msg = '⚡ บันทึกค่าไฟเสร็จสิ้น\n• รอบเดือน: ' + month + ' ' + year;
  sendTelegram(msg);
}

/**
 * [6] ปิดรอบบัญชี
 * data: { month, year }
 */
function notifyAccountingClosed(data) {
  var month = (data && data.month) ? data.month : '';
  var year = (data && data.year) ? data.year : '';
  var msg = '📊 ปิดรอบบัญชีกองกลางเรียบร้อย\n• รอบเดือน: ' + month + ' ' + year;
  sendTelegram(msg);
}

/**
 * [7] พบรายการค้างชำระ
 * data: { count }
 */
function notifyOutstandingFound(data) {
  var count = (data && data.count !== undefined) ? data.count : 0;
  var msg = '⏰ พบรายการค้างชำระ\n• จำนวนรายการ: ' + count + '\nกรุณาตรวจสอบในระบบ';
  sendTelegram(msg);
}
