const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const housingRoutes = require('./routes/housing');
const reportRoutes = require('./routes/report');
const notifyRoutes = require('./routes/notify');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..', 'public');
const assetsDir = path.join(__dirname, '..', 'assets');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend + assets for web app mode
app.use('/assets', express.static(assetsDir));
app.use(express.static(publicDir));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/housing', housingRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/notify', notifyRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
