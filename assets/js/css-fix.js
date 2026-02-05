/**
 * css-fix.js — แก้ปัญหา CSS path เมื่อเปิดจาก file:// protocol
 * รันทันทีใน <head> เพื่อแก้ CSS path ก่อน browser โหลด CSS
 */

(function() {
  // รันทันที (ไม่รอ DOMContentLoaded) เพื่อแก้ path ก่อน browser โหลด CSS
  var protocol = window.location.protocol;
  
  if (protocol === 'file:') {
    var currentPath = window.location.pathname;
    var baseDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    
    // แก้ CSS path ในทุก <link rel="stylesheet"> ที่มีอยู่แล้ว
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href');
      if (!href) continue;
      
      // ถ้าเป็น relative path
      if (href.indexOf('http') !== 0 && href.indexOf('//') !== 0 && href.indexOf('file:') !== 0) {
        var newHref = '';
        
        // ถ้า href เริ่มด้วย ../
        if (href.indexOf('../') === 0) {
          // อยู่ใน subfolder เช่น admin/, resident/
          // ../assets/css/app.css -> ../../assets/css/app.css
          newHref = baseDir + '/' + href;
        } else if (href.indexOf('./') === 0) {
          newHref = baseDir + '/' + href.substring(2);
        } else if (href.indexOf('/') !== 0) {
          // relative path ไม่มี ../
          newHref = baseDir + '/' + href;
        } else {
          // absolute path - ไม่ต้องแก้
          continue;
        }
        
        // แก้ path ให้ใช้ forward slash เสมอ
        newHref = newHref.replace(/\\/g, '/');
        
        // ลบ double slashes (แต่เก็บ file://)
        newHref = newHref.replace(/([^:])\/\//g, '$1/');
        
        // Windows: ถ้า path เริ่มด้วย /D:/ หรือ /C:/ ให้แปลงเป็น file:///D:/ หรือ file:///C:/
        if (newHref.match(/^\/[A-Z]:\//)) {
          newHref = 'file://' + newHref;
        } else if (!newHref.match(/^file:\/\//)) {
          // ถ้ายังไม่มี file:// และไม่ใช่ Windows absolute path
          // ให้ใช้ path แบบ relative จาก current location
          newHref = newHref;
        }
        
        // ตั้งค่า href ใหม่
        link.href = newHref;
      }
    }
    
    // Fallback: รอ DOMContentLoaded เพื่อแก้ path อีกครั้ง
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          var links2 = document.querySelectorAll('link[rel="stylesheet"]');
          for (var j = 0; j < links2.length; j++) {
            var link2 = links2[j];
            var href2 = link2.getAttribute('href');
            if (href2 && href2.indexOf('file://') < 0 && href2.indexOf('http') < 0) {
              var baseDir2 = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
              var newHref2 = '';
              if (href2.indexOf('../') === 0) {
                newHref2 = baseDir2 + '/' + href2;
              } else if (href2.indexOf('./') === 0) {
                newHref2 = baseDir2 + '/' + href2.substring(2);
              } else if (href2.indexOf('/') !== 0) {
                newHref2 = baseDir2 + '/' + href2;
              }
              if (newHref2) {
                newHref2 = newHref2.replace(/\\/g, '/').replace(/([^:])\/\//g, '$1/');
                if (newHref2.match(/^\/[A-Z]:\//)) {
                  newHref2 = 'file://' + newHref2;
                }
                link2.href = newHref2;
              }
            }
          }
        }, 100);
      });
    }
  }
})();
