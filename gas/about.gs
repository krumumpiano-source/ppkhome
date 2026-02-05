/**
 * about.gs — หน้าเกี่ยวกับบ้านพักครู (ข้อมูลจาก Sheet/Drive ไม่ hardcode)
 */

/**
 * ดึงเนื้อหาหน้าเกี่ยวกับ (ทุก role ที่อนุญาต = Read Only)
 */
function getAboutContent(sessionId) {
  var s = sessionId ? getSession(sessionId) : null;
  var sheet = getSheet('ABOUT_CONTENT');
  if (!sheet) {
    return {
      success: true,
      sections: [
        { id: 'basic', title: 'ข้อมูลพื้นฐาน', visible: true, order: 1, body: 'จำนวนบ้านพัก 17 หลัง (เลข 1–17) จำนวนแฟลต 16 ยูนิต (F1–F16) หน่วยงานที่กำกับดูแลตามที่ตั้งค่าในระบบ' },
        { id: 'policy', title: 'ขอบเขตการใช้บ้านพัก', visible: true, order: 2, body: 'ใช้เพื่อการบริหารจัดการที่พักอาศัยของบุคลากรตามนโยบายหน่วยงาน' }
      ],
      images: []
    };
  }
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, sections: [], images: [] };
  var sections = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === false || data[i][4] === 'FALSE') continue;
    sections.push({
      id: data[i][0],
      title: data[i][1],
      body: data[i][2],
      imageUrl: data[i][3],
      visible: data[i][4] !== false,
      order: Number(data[i][5]) || i
    });
  }
  sections.sort(function (a, b) { return a.order - b.order; });
  return { success: true, sections: sections, images: [] };
}

/**
 * บันทึก/แก้ไขเนื้อหาหน้าเกี่ยวกับ (Admin เท่านั้น)
 */
function saveAboutSection(sessionId, sectionId, title, body, imageUrl, visible, order) {
  var s = getSession(sessionId);
  if (!s) return { success: false, message: 'Unauthorized' };
  if (s.role !== CONFIG.ROLES.ADMIN && s.role !== CONFIG.ROLES.DEPUTY_ADMIN) {
    return { success: false, message: 'ไม่มีสิทธิ์แก้ไขหน้าเกี่ยวกับ' };
  }
  // ถ้า imageUrl เป็น Base64 ให้อัปโหลดไปยัง Google Drive
  var finalImageUrl = imageUrl;
  if (imageUrl && imageUrl.indexOf('data:image/') === 0) {
    try {
      finalImageUrl = uploadAboutImage(imageUrl, sectionId);
    } catch (e) {
      return { success: false, message: 'ไม่สามารถอัปโหลดรูปภาพได้: ' + e.message };
    }
  }
  
  var sheet = getSheet('ABOUT_CONTENT');
  if (!sheet) return { success: false, message: 'ระบบยังไม่พร้อม' };
  var data = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === sectionId) {
      sheet.getRange(i + 1, 2).setValue(title || '');
      sheet.getRange(i + 1, 3).setValue(body || '');
      if (sheet.getLastColumn() >= 4) sheet.getRange(i + 1, 4).setValue(finalImageUrl || '');
      if (sheet.getLastColumn() >= 5) sheet.getRange(i + 1, 5).setValue(visible !== false);
      if (sheet.getLastColumn() >= 6) sheet.getRange(i + 1, 6).setValue(Number(order) || 0);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([sectionId || ('s' + Date.now()), title || '', body || '', finalImageUrl || '', visible !== false, Number(order) || 0]);
  }
  auditLog('about_save', s.userId, { sectionId: sectionId, imageUploaded: !!finalImageUrl });
  return { success: true, message: 'บันทึกเรียบร้อย' };
}
