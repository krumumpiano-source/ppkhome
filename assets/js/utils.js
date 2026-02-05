/**
 * utils.js — ฟังก์ชันช่วย (รูปแบบวันที่ จำนวน escapeHtml)
 */
function formatDate(d) {
  if (!d) return '-';
  var x = new Date(d);
  if (isNaN(x.getTime())) return '-';
  return x.getDate() + '/' + (x.getMonth() + 1) + '/' + (x.getFullYear() + 543);
}
function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('th-TH');
}
function escapeHtml(s) {
  if (s == null) return '';
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function getQueryParam(name) {
  var m = new URLSearchParams(window.location.search).get(name);
  return m;
}
