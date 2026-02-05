const { google } = require('googleapis');

const DRIVE_FOLDERS = {
  PAYMENT_SLIPS: process.env.DRIVE_FOLDER_PAYMENT_SLIPS || '1RK8PFdrFFGw_6gsmUxDrUqtCWZYuhUJF',
  ABOUT_IMAGES: process.env.DRIVE_FOLDER_ABOUT_IMAGES || '1wVbFJ90GOoxM0FHe8ks8ddpRdw3OCrwQ',
  EXPORTS: process.env.DRIVE_FOLDER_EXPORTS || '1JCt9ooyxkGvvKyhG-HuEysqf0ghKbgsg'
};

let authClient = null;

function initAuth() {
  if (authClient) return authClient;
  
  const credentials = process.env.GOOGLE_CREDENTIALS;
  if (!credentials) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is required');
  }
  
  const key = JSON.parse(credentials);
  authClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/drive']
  );
  
  return authClient;
}

async function uploadPaymentSlip(base64Data, roundId, unitId, userId) {
  try {
    const auth = initAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const folderId = DRIVE_FOLDERS.PAYMENT_SLIPS;
    const base64Content = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const contentType = base64Data.indexOf('data:image/png') === 0 ? 'image/png' : 'image/jpeg';
    const buffer = Buffer.from(base64Content, 'base64');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `slip_${roundId}_${unitId}_${timestamp}.${contentType === 'image/png' ? 'png' : 'jpg'}`;
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    const media = {
      mimeType: contentType,
      body: buffer
    };
    
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });
    
    await drive.permissions.create({
      fileId: file.data.id,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    return file.data.webViewLink;
  } catch (err) {
    console.error('uploadPaymentSlip error:', err.message);
    throw new Error('ไม่สามารถอัปโหลดสลิปได้: ' + err.message);
  }
}

async function uploadAboutImage(base64Data, sectionId) {
  try {
    const auth = initAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const folderId = DRIVE_FOLDERS.ABOUT_IMAGES;
    const base64Content = base64Data.replace(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, '');
    let contentType = 'image/jpeg';
    if (base64Data.indexOf('data:image/png') === 0) contentType = 'image/png';
    else if (base64Data.indexOf('data:image/gif') === 0) contentType = 'image/gif';
    else if (base64Data.indexOf('data:image/webp') === 0) contentType = 'image/webp';
    
    const buffer = Buffer.from(base64Content, 'base64');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const ext = contentType.split('/')[1];
    const fileName = `about_${sectionId || 'img'}_${timestamp}.${ext}`;
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    
    const media = {
      mimeType: contentType,
      body: buffer
    };
    
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });
    
    await drive.permissions.create({
      fileId: file.data.id,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    return file.data.webViewLink;
  } catch (err) {
    console.error('uploadAboutImage error:', err.message);
    throw new Error('ไม่สามารถอัปโหลดรูปภาพได้: ' + err.message);
  }
}

async function saveExportFile(spreadsheetId, exportName) {
  try {
    const auth = initAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const folderId = DRIVE_FOLDERS.EXPORTS;
    
    const copiedFile = await drive.files.copy({
      fileId: spreadsheetId,
      resource: {
        name: exportName,
        parents: [folderId]
      }
    });
    
    return `https://docs.google.com/spreadsheets/d/${copiedFile.data.id}/edit`;
  } catch (err) {
    console.error('saveExportFile error:', err.message);
    throw new Error('ไม่สามารถบันทึกไฟล์ Export ได้: ' + err.message);
  }
}

module.exports = {
  uploadPaymentSlip,
  uploadAboutImage,
  saveExportFile
};
