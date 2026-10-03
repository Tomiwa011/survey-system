require('dotenv').config();
const pool = require('./db');
const express = require('express');

const app = express();
app.use(express.json());
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ connected: true, users: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ connected: false });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});