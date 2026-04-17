const express = require('express');
const router = express.Router();
const { getPosts, createPost, reactToPost } = require('../controllers/ghostWallController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, getPosts);
router.post('/', protect, upload.single('media'), createPost);
router.post('/:id/react', protect, reactToPost);

module.exports = router;
