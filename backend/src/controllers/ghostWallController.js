const GhostWallPost = require('../models/GhostWallPost');

// @desc    Get all active Ghost Wall posts (not expired)
// @route   GET /api/ghost
// @access  Private
const getPosts = async (req, res) => {
  try {
    const posts = await GhostWallPost.find({ isExpired: false })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new Ghost Wall post
// @route   POST /api/ghost
// @access  Private
const createPost = async (req, res) => {
  try {
    const { contentType, textContent, expiryHours } = req.body;

    if (!contentType) {
      return res.status(400).json({ message: 'Content type is required' });
    }

    if (!expiryHours || isNaN(expiryHours) || expiryHours < 1 || expiryHours > 168) {
      return res.status(400).json({ message: 'Expiry hours must be between 1 and 168 (7 days)' });
    }

    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    let mediaUrl = '';
    let mediaPublicId = '';
    if (req.file) {
      mediaUrl = req.file.path;
      mediaPublicId = req.file.filename;
    }

    if (contentType === 'text' && !textContent) {
      return res.status(400).json({ message: 'Text content is required for text posts' });
    }

    const post = await GhostWallPost.create({
      contentType,
      textContent: textContent || '',
      mediaUrl,
      mediaPublicId,
      expiresAt,
    });

    res.status(201).json({ message: 'Ghost Wall post created', post });
  } catch (err) {
    console.error('[GhostWall] Create error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    React to a Ghost Wall post
// @route   POST /api/ghost/:id/react
// @access  Private
const reactToPost = async (req, res) => {
  try {
    const { reaction } = req.body; // 'heart' | 'ghost' | 'fire'
    const validReactions = ['heart', 'ghost', 'fire'];

    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await GhostWallPost.findById(req.params.id);
    if (!post || post.isExpired) {
      return res.status(404).json({ message: 'Post not found or already expired' });
    }

    post.reactions[reaction] += 1;
    await post.save();

    res.status(200).json({ message: 'Reaction added', reactions: post.reactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPosts, createPost, reactToPost };
