const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'memory_capsule/media';
    let resourceType = 'auto';

    if (file.mimetype.startsWith('image/')) {
      folder = 'memory_capsule/images';
      resourceType = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'memory_capsule/voices';
      resourceType = 'video'; // Cloudinary uses 'video' for audio too
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'memory_capsule/videos';
      resourceType = 'video';
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'mp3', 'wav', 'm4a', 'ogg'],
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

module.exports = upload;
