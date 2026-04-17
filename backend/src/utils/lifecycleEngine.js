const cron = require('node-cron');
const Capsule = require('../models/Capsule');
const GhostWallPost = require('../models/GhostWallPost');
const cloudinary = require('../config/cloudinary');
const { getIo } = require('../config/socket');

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
  const capsulesToUnlock = await Capsule.find({
    status: 'LOCKED',
    'rules.unlockAt': { $ne: null, $lte: now },
  });

  for (const capsule of capsulesToUnlock) {
    capsule.status = 'UNLOCKED';
    await capsule.save();

    const io = getIo();
    if (io) {
      io.to(capsule.creator.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'UNLOCKED' });
      if (capsule.recipient) {
        io.to(capsule.recipient.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'UNLOCKED' });
      }
    }
  }

  if (capsulesToUnlock.length > 0) {
    console.log(`[Lifecycle] Unlocked ${capsulesToUnlock.length} capsule(s)`);
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

    const io = getIo();
    if (io) {
      io.to(capsule.creator.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'EXPIRED' });
      if (capsule.recipient) {
        io.to(capsule.recipient.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'EXPIRED' });
      }
    }
  }

  if (capsulesToExpire.length > 0) {
    console.log(`[Lifecycle] Expired ${capsulesToExpire.length} capsule(s)`);
  }
};

/**
 * TASK 3: Process pending capsule destructions
 */
const processPendingDestructions = async () => {
  const now = new Date();
  const capsulesToDestroy = await Capsule.find({
    status: { $in: ['LOCKED', 'UNLOCKED'] },
    destroyAt: { $ne: null, $lte: now },
  });

  for (const capsule of capsulesToDestroy) {
    try {
      if (capsule.mediaPublicId) {
        await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
      }
      capsule.status = 'DESTROYED';
      capsule.mediaUrl = '';
      capsule.mediaPublicId = '';
      capsule.textContent = '';
      capsule.destroyAt = null; // clear the pending destruction
      await capsule.save();
      console.log(`[Lifecycle] Destroyed capsule ${capsule._id} after scheduled time`);
    } catch (err) {
      console.error(`[Lifecycle] Error destroying capsule ${capsule._id}:`, err.message);
    }
  }

  if (capsulesToDestroy.length > 0) {
    console.log(`[Lifecycle] Processed ${capsulesToDestroy.length} pending destructions`);
  }
};

/**
 * TASK 4: Expire Ghost Wall posts whose expiresAt has passed
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
  
  // also handle "destroyAt" capsules
  const checkDestroyAt = async () => {
    const now = new Date();
    const capsulesToDestroy = await Capsule.find({
      status: { $in: ['LOCKED', 'UNLOCKED'] },
      destroyAt: { $ne: null, $lte: now } // I added this earlier to avoid destroying before response, so cron cleans it
    });

    for (const capsule of capsulesToDestroy) {
      if (capsule.mediaPublicId) {
        await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
      }
      capsule.status = 'DESTROYED';
      capsule.mediaUrl = '';
      capsule.mediaPublicId = '';
      capsule.textContent = '';
      await capsule.save();

      const io = getIo();
      if (io) {
        io.to(capsule.creator.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'DESTROYED' });
        if (capsule.recipient) {
          io.to(capsule.recipient.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'DESTROYED' });
        }
      }
    }
  };

  cron.schedule('* * * * *', async () => {
    try {
      await checkDestroyAt();
      await unlockDueCapsules();
      await expireDueCapsules();
      await processPendingDestructions();
      await expireGhostWallPosts();
    } catch (err) {
      console.error('[Lifecycle] Error during cron run:', err.message);
    }
  });
};

module.exports = { startLifecycleEngine, deleteFromCloudinary, getResourceType };
