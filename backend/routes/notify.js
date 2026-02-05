const express = require('express');
const router = express.Router();

function sendNotification(type, data) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const https = require('https');
      const url = require('url');
      const parsedUrl = url.parse(webhookUrl);
      const postData = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const req = https.request(options, () => {});
      req.on('error', (err) => {
        console.error('Notification webhook error:', err.message);
      });
      req.write(postData);
      req.end();
    } catch (err) {
      console.error('Notification error:', err.message);
    }
  }
  console.log(`[NOTIFICATION] ${type}:`, JSON.stringify(data));
}

router.post('/payment-submitted', (req, res) => {
  const { houseNo, month, year } = req.body;
  sendNotification('payment_submitted', { houseNo, month, year });
  res.json({ success: true });
});

router.post('/new-application', (req, res) => {
  const { name, date } = req.body;
  sendNotification('new_application', { name, date });
  res.json({ success: true });
});

router.post('/repair-request', (req, res) => {
  const { houseNo, type } = req.body;
  sendNotification('repair_request', { houseNo, type });
  res.json({ success: true });
});

router.post('/water-recorded', (req, res) => {
  const { month, year } = req.body;
  sendNotification('water_recorded', { month, year });
  res.json({ success: true });
});

router.post('/electric-recorded', (req, res) => {
  const { month, year } = req.body;
  sendNotification('electric_recorded', { month, year });
  res.json({ success: true });
});

router.post('/accounting-closed', (req, res) => {
  const { month, year } = req.body;
  sendNotification('accounting_closed', { month, year });
  res.json({ success: true });
});

router.post('/outstanding-found', (req, res) => {
  const { count } = req.body;
  sendNotification('outstanding_found', { count });
  res.json({ success: true });
});

module.exports = router;
