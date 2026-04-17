const express = require('express');
const router = express.Router();
const {
  createCapsule,
  getVault,
  getSentCapsules,
  getReceivedCapsules,
  viewCapsule,
  deleteCapsule,
} = require('../controllers/capsuleController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/vault', protect, getVault);
router.get('/sent', protect, getSentCapsules);
router.get('/received', protect, getReceivedCapsules);
router.post('/', protect, upload.single('media'), createCapsule);
router.get('/:id', protect, viewCapsule);
router.delete('/:id', protect, deleteCapsule);

module.exports = router;
