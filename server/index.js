require('dotenv').config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is missing or too short (use at least 32 characters). Exiting.');
  process.exit(1);
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const surveyRoutes = require('./routes/surveys');
const questionRoutes = require('./routes/questions');
const publicRoutes = require('./routes/public');

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/surveys/:surveyId/questions', questionRoutes);
app.use('/api/public', publicRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request too large' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});