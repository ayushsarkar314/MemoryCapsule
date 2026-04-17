const cron = require('node-cron');
const Capsule = require('../models/Capsule');
const GhostWallPost = require('../models/GhostWallPost');
const cloudinary = require('../config/cloudinary');

/**
 * Delete media from Cloudinary by public_id
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`[Lifecycle] Deleted from Cloudinary: ${publicId}`);
  } catch (err) {
    console.error(`[Lifecycle] Cloudinary delete error: ${err.message}`);
  }
};

/**
 * Determine Cloudinary resource type from mediaUrl or publicId
 */
const getResourceType = (publicId = '') => {
  if (!publicId) return 'image';
  if (publicId.includes('/voices/') || publicId.includes('/videos/')) return 'video';
  return 'image';
};

/**
 * TASK 1: Unlock capsules whose unlockAt time has passed
 */
const unlockDueCapsules = async () => {
  const now = new Date();
  const result = await Capsule.updateMany(
    {
      status: 'LOCKED',
      'rules.unlockAt': { $ne: null, $lte: now },
    },
    { $set: { status: 'UNLOCKED' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[Lifecycle] Unlocked ${result.modifiedCount} capsule(s)`);
  }
};

/**
 * TASK 2: Expire capsules whose expireAt date has passed
 */
const expireDueCapsules = async () => {
  const now = new Date();
  const capsulesToExpire = await Capsule.find({
    status: { $in: ['LOCKED', 'UNLOCKED'] },
    'rules.expireAt': { $ne: null, $lte: now },
  });

  for (const capsule of capsulesToExpire) {
    if (capsule.mediaPublicId) {
      await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
    }
    capsule.status = 'EXPIRED';
    capsule.mediaUrl = '';
    capsule.mediaPublicId = '';
    await capsule.save();
  }

  if (capsulesToExpire.length > 0) {
    console.log(`[Lifecycle] Expired ${capsulesToExpire.length} capsule(s)`);
  }
};

/**
 * TASK 3: Expire Ghost Wall posts whose expiresAt has passed
 */
const expireGhostWallPosts = async () => {
  const now = new Date();
  const expiredPosts = await GhostWallPost.find({
    isExpired: false,
    expiresAt: { $lte: now },
  });

  for (const post of expiredPosts) {
    if (post.mediaPublicId) {
      await deleteFromCloudinary(post.mediaPublicId, 'image');
    }
    post.isExpired = true;
    post.mediaUrl = '';
    post.mediaPublicId = '';
    await post.save();
  }

  if (expiredPosts.length > 0) {
    console.log(`[Lifecycle] Expired ${expiredPosts.length} Ghost Wall post(s)`);
  }
};

/**
 * Start the Lifecycle Engine — runs every minute
 */
const startLifecycleEngine = () => {
  console.log('[Lifecycle] Engine started — running every minute');

  cron.schedule('* * * * *', async () => {
    try {
      await unlockDueCapsules();
      await expireDueCapsules();
      await expireGhostWallPosts();
    } catch (err) {
      console.error('[Lifecycle] Error during cron run:', err.message);
    }
  });
};

module.exports = { startLifecycleEngine, deleteFromCloudinary, getResourceType, unlockDueCapsules, expireDueCapsules, expireGhostWallPosts };
