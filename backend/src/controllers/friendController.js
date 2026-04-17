const User = require('../models/User');

// @desc    Search users by username
// @route   GET /api/friends/search?q=username
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user._id },
    }).select('username displayName avatar bio').limit(10);

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Send a friend request
// @route   POST /api/friends/request/:userId
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't send a friend request to yourself" });
    }

    // Already friends?
    if (req.user.friends.includes(targetUser._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Already requested?
    const alreadyRequested = targetUser.friendRequests.find(
      (r) => r.from.toString() === req.user._id.toString() && r.status === 'pending'
    );
    if (alreadyRequested) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    targetUser.friendRequests.push({ from: req.user._id, status: 'pending' });
    await targetUser.save();

    res.status(200).json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Accept or reject a friend request
// @route   PUT /api/friends/request/:requesterId/respond
// @access  Private
const respondToFriendRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const currentUser = await User.findById(req.user._id);

    const requestIndex = currentUser.friendRequests.findIndex(
      (r) => r.from.toString() === req.params.requesterId && r.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (action === 'accept') {
      currentUser.friendRequests[requestIndex].status = 'accepted';
      currentUser.friends.push(req.params.requesterId);
      await currentUser.save();

      // Add reverse friendship
      await User.findByIdAndUpdate(req.params.requesterId, {
        $addToSet: { friends: req.user._id },
      });

      return res.status(200).json({ message: 'Friend request accepted' });
    } else if (action === 'reject') {
      currentUser.friendRequests[requestIndex].status = 'rejected';
      await currentUser.save();
      return res.status(200).json({ message: 'Friend request rejected' });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use accept or reject' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get friend requests (pending)
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friendRequests.from',
      'username displayName avatar'
    );
    const pending = user.friendRequests.filter((r) => r.status === 'pending');
    res.status(200).json({ requests: pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friends',
      'username displayName avatar bio'
    );
    res.status(200).json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Remove a friend
// @route   DELETE /api/friends/:friendId
// @access  Private
const removeFriend = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: req.params.friendId } });
    await User.findByIdAndUpdate(req.params.friendId, { $pull: { friends: req.user._id } });
    res.status(200).json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { searchUsers, sendFriendRequest, respondToFriendRequest, getFriendRequests, getFriends, removeFriend };
