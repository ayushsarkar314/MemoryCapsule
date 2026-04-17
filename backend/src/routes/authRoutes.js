const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', register);
router.post('/login', login);

// Public — only needs refresh token cookie (no access token required)
router.post('/refresh', refresh);

router.post('/logout',  protect, logout);
router.get('/me',       protect, getMe);
router.put('/profile',  protect, upload.single('avatar'), updateProfile);

module.exports = router;
