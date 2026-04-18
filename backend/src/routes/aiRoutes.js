const express = require('express');
const router = express.Router();
const { getSuggestions } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/ai/suggest  —  body: { hint?: string }
router.post('/suggest', protect, getSuggestions);

module.exports = router;
