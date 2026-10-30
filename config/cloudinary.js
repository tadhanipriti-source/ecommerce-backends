const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── In-memory storage (works with multer v2) ───────────────────────────────
const memoryStorage = multer.memoryStorage();

// File filter - only images allowed
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WebP) are allowed!'), false);
  }
};

// Product upload middleware (up to 5 images)
const uploadProductImages = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).array('images', 5);

// Avatar upload middleware (single image)
const uploadAvatar = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('avatar');

// ─── Upload buffer to Cloudinary ─────────────────────────────────────────────
const uploadBufferToCloudinary = (buffer, folder, transformations = []) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: transformations,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ─── Upload product image buffer ─────────────────────────────────────────────
const uploadProductImageBuffer = (buffer) =>
  uploadBufferToCloudinary(buffer, 'ecommerce/products', [
    { width: 800, height: 800, crop: 'limit', quality: 'auto' },
  ]);

// ─── Upload avatar buffer ─────────────────────────────────────────────────────
const uploadAvatarBuffer = (buffer) =>
  uploadBufferToCloudinary(buffer, 'ecommerce/avatars', [
    { width: 200, height: 200, crop: 'fill', quality: 'auto' },
  ]);

// ─── Delete image from Cloudinary ────────────────────────────────────────────
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// ─── Middleware: upload product files then push to Cloudinary ────────────────
const handleProductImages = (req, res, next) => {
  uploadProductImages(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || req.files.length === 0) return next();

    try {
      const uploadResults = await Promise.all(
        req.files.map((file) => uploadProductImageBuffer(file.buffer))
      );
      req.uploadedImages = uploadResults.map((r) => ({
        public_id: r.public_id,
        url: r.secure_url,
      }));
      next();
    } catch (uploadError) {
      next(uploadError);
    }
  });
};

// ─── Middleware: upload avatar then push to Cloudinary ───────────────────────
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      const result = await uploadAvatarBuffer(req.file.buffer);
      req.uploadedAvatar = { public_id: result.public_id, url: result.secure_url };
      next();
    } catch (uploadError) {
      next(uploadError);
    }
  });
};

module.exports = {
  cloudinary,
  uploadProductImages: handleProductImages,
  uploadAvatar: handleAvatarUpload,
  deleteImage,
};
