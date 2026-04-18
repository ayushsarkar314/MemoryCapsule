const Capsule = require('../models/Capsule');
const cloudinary = require('../config/cloudinary');
const { deleteFromCloudinary, getResourceType } = require('../utils/lifecycleEngine');
const { getIo } = require('../config/socket');

/**
 * HELPER: Sync a capsule's status on-the-fly based on current time
 */
const syncCapsuleStatus = async (capsule) => {
  if (!capsule) return capsule;
  const now = new Date();
  let changed = false;

  // 1. LOCKED -> UNLOCKED (Time-based unlock)
  if (capsule.status === 'LOCKED' && capsule.rules.unlockAt && capsule.rules.unlockAt <= now) {
    capsule.status = 'UNLOCKED';
    changed = true;
  }

  // 2. LOCKED/UNLOCKED -> EXPIRED (Expiration date)
  if (['LOCKED', 'UNLOCKED'].includes(capsule.status) && capsule.rules.expireAt && capsule.rules.expireAt <= now) {
    if (capsule.mediaPublicId) {
      await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
    }
    capsule.status = 'EXPIRED';
    capsule.mediaUrl = '';
    capsule.mediaPublicId = '';
    changed = true;
  }

  // 3. ANY -> DESTROYED (Single-view timer)
  if (capsule.status !== 'DESTROYED' && capsule.destroyAt && capsule.destroyAt <= now) {
    if (capsule.mediaPublicId) {
      await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
    }
    capsule.status = 'DESTROYED';
    capsule.mediaUrl = '';
    capsule.mediaPublicId = '';
    changed = true;
  }

  if (changed) {
    await capsule.save();
    // Emit real-time change
    const io = getIo();
    if (io) {
      io.to(capsule.creator.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: capsule.status });
      if (capsule.recipient) {
        io.to(capsule.recipient.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: capsule.status });
      }
    }
  }

  return capsule;
};

// @desc    Create a new capsule
// @route   POST /api/capsules
// @access  Private
const createCapsule = async (req, res) => {
  try {
    const { title, contentType, textContent, ruleType, ruleValue, recipientId } = req.body;

    if (!contentType) {
      return res.status(400).json({ message: 'Content type is required' });
    }

    // Validate rule
    if (!ruleType || !['unlockAt', 'destroyAfterView', 'expireAt', 'eventName'].includes(ruleType)) {
      return res.status(400).json({ message: 'A valid rule type is required' });
    }

    // Build rules object
    const rules = {
      unlockAt: null,
      destroyAfterView: false,
      expireAt: null,
    };

    if (ruleType === 'unlockAt') {
      if (!ruleValue) return res.status(400).json({ message: 'Unlock date is required' });
      const unlockDate = new Date(ruleValue);
      if (unlockDate <= new Date()) return res.status(400).json({ message: 'Unlock date must be in the future' });
      rules.unlockAt = unlockDate;
    } else if (ruleType === 'destroyAfterView') {
      rules.destroyAfterView = true;
    } else if (ruleType === 'expireAt') {
      if (!ruleValue) return res.status(400).json({ message: 'Expiry date is required' });
      const expireDate = new Date(ruleValue);
      if (expireDate <= new Date()) return res.status(400).json({ message: 'Expiry date must be in the future' });
      rules.expireAt = expireDate;
    }

    // Handle media
    let mediaUrl = '';
    let mediaPublicId = '';
    if (req.file) {
      mediaUrl = req.file.path;
      mediaPublicId = req.file.filename;
    }

    // Shared or personal
    const capsuleType = recipientId ? 'shared' : 'personal';

    // For unlockAt: start as LOCKED; for destroyAfterView: start as UNLOCKED (immediately viewable once)
    let initialStatus = 'LOCKED';
    if (ruleType === 'destroyAfterView') initialStatus = 'UNLOCKED';
    if (ruleType === 'expireAt') initialStatus = 'UNLOCKED';

    const capsule = await Capsule.create({
      creator: req.user._id,
      title: title || 'Untitled Capsule',
      contentType,
      textContent: textContent || '',
      mediaUrl,
      mediaPublicId,
      rules,
      status: initialStatus,
      recipient: recipientId || null,
      capsuleType,
    });

    res.status(201).json({ message: 'Capsule created successfully', capsule });
  } catch (err) {
    console.error('[Capsule] Create error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user's personal vault
// @route   GET /api/capsules/vault
// @access  Private
const getVault = async (req, res) => {
  try {
    const capsules = await Capsule.find({
      creator: req.user._id,
      // Removed capsuleType: 'personal' to include all created capsules in Vault stats
    }).sort({ createdAt: -1 });

    // Sync all statuses before grouping
    await Promise.all(capsules.map(c => syncCapsuleStatus(c)));

    const vault = {
      locked: capsules.filter((c) => c.status === 'LOCKED'),
      unlocked: capsules.filter((c) => c.status === 'UNLOCKED'),
      expired: capsules.filter((c) => c.status === 'EXPIRED'),
      destroyed: capsules.filter((c) => c.status === 'DESTROYED'),
    };

    res.status(200).json({ vault });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get sent shared capsules
// @route   GET /api/capsules/sent
// @access  Private
const getSentCapsules = async (req, res) => {
  try {
    const capsules = await Capsule.find({
      creator: req.user._id,
      capsuleType: 'shared',
    })
      .populate('recipient', 'username displayName avatar')
      .sort({ createdAt: -1 });

    // Sync statuses
    await Promise.all(capsules.map(c => syncCapsuleStatus(c)));

    res.status(200).json({ capsules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get received shared capsules
// @route   GET /api/capsules/received
// @access  Private
const getReceivedCapsules = async (req, res) => {
  try {
    const capsules = await Capsule.find({
      recipient: req.user._id,
    })
      .populate('creator', 'username displayName avatar')
      .sort({ createdAt: -1 });

    // Sync statuses
    await Promise.all(capsules.map(c => syncCapsuleStatus(c)));

    res.status(200).json({ capsules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    View / open a specific capsule
// @route   GET /api/capsules/:id
// @access  Private
const viewCapsule = async (req, res) => {
  try {
    let capsule = await Capsule.findById(req.params.id)
      .populate('creator', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar');

    if (!capsule) return res.status(404).json({ message: 'Capsule not found' });

    // Sync status before checking authorization
    capsule = await syncCapsuleStatus(capsule);

    // Authorization: only creator or recipient can view
    const isCreator = capsule.creator._id.toString() === req.user._id.toString();
    const isRecipient = capsule.recipient && capsule.recipient._id.toString() === req.user._id.toString();

    if (!isCreator && !isRecipient) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can't view locked capsules
    if (capsule.status === 'LOCKED') {
      return res.status(403).json({
        message: 'This capsule is still locked',
        unlocksAt: capsule.rules.unlockAt,
      });
    }

    // Can't view expired or destroyed capsules
    if (['EXPIRED', 'DESTROYED'].includes(capsule.status)) {
      return res.status(403).json({ message: `This capsule has been ${capsule.status.toLowerCase()}` });
    }

    // Handle "destroy after view" for recipient
    if (capsule.rules.destroyAfterView && isRecipient && !capsule.seenByRecipient) {
      // Mark as seen first, then schedule destruction
      capsule.seenByRecipient = true;
      capsule.seenAt = new Date();
      capsule.destroyAt = new Date(Date.now() + 30000); // Destroy in 30 seconds
      await capsule.save();

      const responseData = { capsule };

      // Send response immediately
      res.status(200).json(responseData);

      console.log(`[Capsule] Scheduled destruction for capsule ${capsule._id} at ${capsule.destroyAt} (in ${(capsule.destroyAt - Date.now()) / 1000} seconds)`);

      return;
    }

    // For personal destroy-after-view capsules: destroy on view
    if (capsule.rules.destroyAfterView && isCreator && capsule.capsuleType === 'personal' && !capsule.destroyAt) {
      capsule.destroyAt = new Date(Date.now() + 30000); // Destroy in 30 seconds
      await capsule.save();

      const responseData = { capsule };
      res.status(200).json(responseData);

      console.log(`[Capsule] Scheduled destruction for personal capsule ${capsule._id} at ${capsule.destroyAt}`);

      return;
    }

    // Mark seen for regular shared capsules
    if (isRecipient && !capsule.seenByRecipient) {
      capsule.seenByRecipient = true;
      capsule.seenAt = new Date();
      await capsule.save();
    }

    res.status(200).json({ capsule });
  } catch (err) {
    console.error('[Capsule] View error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete a capsule (creator only, if not yet destroyed/expired)
// @route   DELETE /api/capsules/:id
// @access  Private
const deleteCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);
    if (!capsule) return res.status(404).json({ message: 'Capsule not found' });

    if (capsule.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this capsule' });
    }

    if (capsule.mediaPublicId) {
      await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
    }

    await capsule.deleteOne();
    
    // Emit event
    const io = getIo();
    if (io) {
      io.to(req.user._id.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'DELETED' });
      if (capsule.recipient) {
        io.to(capsule.recipient.toString()).emit('capsule_status_changed', { capsuleId: capsule._id, status: 'DELETED' });
      }
    }

    res.status(200).json({ message: 'Capsule deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createCapsule, getVault, getSentCapsules, getReceivedCapsules, viewCapsule, deleteCapsule };
