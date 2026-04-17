require('dotenv').config();

// ── Env guard: fail fast with a clear message rather than a silent 500 ──────
const REQUIRED_ENV = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
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
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const limit = require('express-rate-limit');
const { createServer } = require('http');
const { initSocket } = require('./src/config/socket');
const connectDB = require('./src/config/db');
const { startLifecycleEngine } = require('./src/utils/lifecycleEngine');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const capsuleRoutes = require('./src/routes/capsuleRoutes');
const ghostWallRoutes = require('./src/routes/ghostWallRoutes');
const friendRoutes = require('./src/routes/friendRoutes');

const app = express();
const server = createServer(app);

// Init Socket.io
initSocket(server);

// Connect to MongoDB
connectDB();

// Production Middlewares
app.use(helmet({ crossOriginResourcePolicy: false })); // allow cloudinary images if we ever serve them directly
app.use(compression());
app.use(morgan('dev'));

// Rate Limiting (apply to all requests, or could be specific routes)
const apiLimiter = limit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Memory Capsule API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Start Lifecycle Engine (cron jobs)
  startLifecycleEngine();
});
