require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/roles');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/uploads');
const artistRoutes = require('./routes/artist');
const artistExtraRoutes = require('./routes/artistExtra');
const listenerRoutes = require('./routes/listener');

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'https://melody-fe.vercel.app';
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

const parseOrigins = (raw) => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const allowedOrigins = parseOrigins(CLIENT_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow tools like curl/postman
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Melody backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api', roleRoutes);
app.use('/api', adminRoutes);
app.use('/api', uploadRoutes);
app.use('/api', artistRoutes);
app.use('/api', artistExtraRoutes);
app.use('/api', listenerRoutes);

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Please set it in environment variables.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
