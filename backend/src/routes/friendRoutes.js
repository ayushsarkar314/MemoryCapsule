const express = require('express');
const router = express.Router();
const {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.get('/requests', protect, getFriendRequests);
router.get('/', protect, getFriends);
router.post('/request/:userId', protect, sendFriendRequest);
router.put('/request/:requesterId/respond', protect, respondToFriendRequest);
router.delete('/:friendId', protect, removeFriend);

module.exports = router;
