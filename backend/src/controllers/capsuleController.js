const Capsule = require('../models/Capsule');
const cloudinary = require('../config/cloudinary');
const { deleteFromCloudinary, getResourceType } = require('../utils/lifecycleEngine');

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
    if (!ruleType || !['unlockAt', 'destroyAfterView', 'expireAt'].includes(ruleType)) {
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
      rules.unlockAt = new Date(ruleValue);
    } else if (ruleType === 'destroyAfterView') {
      rules.destroyAfterView = true;
    } else if (ruleType === 'expireAt') {
      if (!ruleValue) return res.status(400).json({ message: 'Expiry date is required' });
      rules.expireAt = new Date(ruleValue);
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
      capsuleType: 'personal',
    }).sort({ createdAt: -1 });

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
    const capsule = await Capsule.findById(req.params.id)
      .populate('creator', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar');

    if (!capsule) return res.status(404).json({ message: 'Capsule not found' });

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
      await capsule.save();

      const responseData = { capsule };

      // Destroy after sending response
      res.status(200).json(responseData);

      // Clean up after response
      if (capsule.mediaPublicId) {
        await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
      }
      capsule.status = 'DESTROYED';
      capsule.mediaUrl = '';
      capsule.mediaPublicId = '';
      capsule.textContent = ''; // wipe text too
      await capsule.save();

      return;
    }

    // For personal destroy-after-view capsules: destroy on view
    if (capsule.rules.destroyAfterView && isCreator && capsule.capsuleType === 'personal') {
      const responseData = { capsule };
      res.status(200).json(responseData);

      if (capsule.mediaPublicId) {
        await deleteFromCloudinary(capsule.mediaPublicId, getResourceType(capsule.mediaPublicId));
      }
      capsule.status = 'DESTROYED';
      capsule.mediaUrl = '';
      capsule.mediaPublicId = '';
      capsule.textContent = '';
      await capsule.save();
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
    res.status(200).json({ message: 'Capsule deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createCapsule, getVault, getSentCapsules, getReceivedCapsules, viewCapsule, deleteCapsule };
