const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  forgotPasswordValidator,
  updateProfileValidator,
} = require('../validators/authValidator');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  addAddress,
  deleteAddress,
  toggleWishlist,
} = require('../controllers/authController');
const { uploadAvatar } = require('../config/cloudinary');

// Public routes
router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);
router.post('/forgot-password', validate(forgotPasswordValidator), forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/update-profile', uploadAvatar, validate(updateProfileValidator), updateProfile);
router.put('/update-password', validate(updatePasswordValidator), updatePassword);

// Address management
router.post('/address', addAddress);
router.delete('/address/:addressId', deleteAddress);

// Wishlist
router.post('/wishlist/:productId', toggleWishlist);

module.exports = router;
