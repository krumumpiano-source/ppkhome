/**
 * water-report.js - สร้างรายงานน้ำ (เอกสารราชการ)
 */

var WaterReport = {
  /**
   * สร้างรายงานน้ำ
   * @param {string} roundId - รอบการเรียกเก็บ (เช่น R202401)
   * @param {function} callback - callback function
   */
  generate: function(roundId, callback) {
    API.run('getWaterReport', { sessionId: Auth.getSessionId(), roundId: roundId }, function(res) {
      if (!res.success) {
        if (callback) callback({ success: false, message: res.message });
        return;
      }
      
      var html = WaterReport.createReportHTML(res);
      WaterReport.openReportWindow(html);
      
      if (callback) callback({ success: true, html: html });
    });
  },
  
  /**
   * สร้าง HTML รายงาน
   */
  createReportHTML: function(data) {
    var round = data.round;
    var monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    var monthName = round ? monthNames[round.month - 1] : '';
    var year = round ? round.year : '';
    var reportDate = new Date(data.reportDate);
    var reportDateStr = reportDate.getDate() + ' ' + monthNames[reportDate.getMonth()] + ' ' + (reportDate.getFullYear() + 543);
    
    // ถ้าไม่มี round ให้ parse จาก roundId (R202401 -> มกราคม 2024)
    if (!round && data.roundId) {
      var roundIdMatch = data.roundId.match(/R(\d{4})(\d{2})/);
      if (roundIdMatch) {
        year = parseInt(roundIdMatch[1]);
        var month = parseInt(roundIdMatch[2]);
        monthName = monthNames[month - 1];
      }
    }
    
    var html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายงานการใช้น้ำ - รอบ ${data.roundId}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Sarabun', 'TH Sarabun New', 'Angsana New', 'Cordia New', sans-serif;
      font-size: 16pt;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 10px 0;
    }
    .header h2 {
      font-size: 18pt;
      font-weight: bold;
      margin: 10px 0;
    }
    .info-section {
      margin-bottom: 20px;
    }
    .info-row {
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14pt;
    }
    table th, table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
    }
    table th {
      background-color: #e0e0e0;
      font-weight: bold;
    }
    table td {
      text-align: left;
    }
    table td:nth-child(1),
    table td:nth-child(3),
    table td:nth-child(4),
    table td:nth-child(5),
    table td:nth-child(6) {
      text-align: center;
    }
    .summary {
      margin-top: 20px;
      font-weight: bold;
    }
    .signature-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 60px;
      padding-top: 5px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>รายงานการใช้น้ำ</h1>
    <h2>รอบการเรียกเก็บ ${monthName} ${year}</h2>
  </div>
  
  <div class="info-section">
    <div class="info-row"><strong>รอบการเรียกเก็บ:</strong> ${data.roundId}</div>
    <div class="info-row"><strong>ราคาน้ำต่อหน่วย:</strong> ${formatNumber(data.waterRate)} บาท</div>
    <div class="info-row"><strong>วันที่สร้างรายงาน:</strong> ${reportDateStr}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 8%;">ลำดับ</th>
        <th style="width: 12%;">หน่วย</th>
        <th style="width: 20%;">ชื่อผู้พักอาศัย</th>
        <th style="width: 12%;">เลขก่อนหน้า</th>
        <th style="width: 12%;">เลขล่าสุด</th>
        <th style="width: 10%;">หน่วยที่ใช้</th>
        <th style="width: 12%;">จำนวนเงิน (บาท)</th>
        <th style="width: 14%;">สถานะการชำระ</th>
      </tr>
    </thead>
    <tbody>
`;
    
    var totalAmount = 0;
    var totalUnits = 0;
    data.items.forEach(function(item, index) {
      var paidStatus = item.paid ? (item.paymentVerified ? 'ชำระแล้ว' : 'รอตรวจสอบ') : 'ยังไม่ชำระ';
      totalAmount += item.amount;
      totalUnits += item.unitsUsed;
      
      html += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.unitId}</td>
        <td>${item.residentName}</td>
        <td>${item.prevReading === '-' ? '-' : formatNumber(item.prevReading)}</td>
        <td style="text-align: center;">${formatNumber(item.currentReading)}</td>
        <td style="text-align: center;">${formatNumber(item.unitsUsed)}</td>
        <td style="text-align: right;">${formatNumber(item.amount)}</td>
        <td style="text-align: center;">${paidStatus}</td>
      </tr>
`;
    });
    
    html += `
    </tbody>
    <tfoot>
      <tr style="font-weight: bold; background-color: #f0f0f0;">
        <td colspan="5" style="text-align: right;">รวมทั้งสิ้น</td>
        <td>${formatNumber(totalUnits)}</td>
        <td>${formatNumber(totalAmount)}</td>
        <td>-</td>
      </tr>
    </tfoot>
  </table>
  
  <div class="summary">
    <p><strong>สรุป:</strong></p>
    <p>จำนวนหน่วยที่ใช้รวมทั้งสิ้น: ${formatNumber(totalUnits)} หน่วย</p>
    <p>จำนวนเงินรวมทั้งสิ้น: ${formatNumber(totalAmount)} บาท</p>
  </div>
  
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">
        <div>(${data.recorder ? data.recorder.name : '-'})</div>
        <div>${data.recorder ? (data.recorder.role === 'committee' ? 'ผู้บันทึก' : 'ผู้บันทึก') : 'ผู้บันทึก'}</div>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <div>(${data.supervisor ? data.supervisor.name : '-'})</div>
        <div>หัวหน้างาน</div>
      </div>
    </div>
  </div>
  
  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14pt; cursor: pointer;">พิมพ์รายงาน</button>
    <button onclick="window.close()" style="padding: 10px 20px; font-size: 14pt; cursor: pointer; margin-left: 10px;">ปิดหน้าต่าง</button>
  </div>
</body>
</html>
`;
    
    return html;
  },
  
  /**
   * เปิดหน้าต่างรายงาน
   */
  openReportWindow: function(html) {
    var newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    } else {
      alert('กรุณาอนุญาตให้เปิดหน้าต่างป๊อปอัพเพื่อดูรายงาน');
    }
  }
};
