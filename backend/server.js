require('dotenv').config();

// ── Env guard: fail fast with a clear message rather than a silent 500 ──────
const REQUIRED_ENV = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\n❌  Missing required environment variables:\n    ${missing.join(', ')}\n`);
  process.exit(1);
}
// ────────────────────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const { startLifecycleEngine, unlockDueCapsules, unlockEventCapsulesByDate, expireDueCapsules, expireGhostWallPosts } = require('./src/utils/lifecycleEngine');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const capsuleRoutes = require('./src/routes/capsuleRoutes');
const ghostWallRoutes = require('./src/routes/ghostWallRoutes');
const friendRoutes = require('./src/routes/friendRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/capsules', capsuleRoutes);
app.use('/api/ghost', ghostWallRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Memory Capsule API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Serverless Cron Endpoint
app.post('/api/cron', async (req, res) => {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    await unlockDueCapsules();
    await unlockEventCapsulesByDate();
    await expireDueCapsules();
    await expireGhostWallPosts();
    res.status(200).json({ message: 'Lifecycle engine executed successfully' });
  } catch (err) {
    console.error('[Cron] Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    // Start Lifecycle Engine (cron jobs)
    startLifecycleEngine();
  });
}

module.exports = app;
