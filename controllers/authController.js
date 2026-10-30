const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendTokenResponse } = require('../utils/response');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered. Please login or use another email.', 400));
  }

  // Create user
  const user = await User.create({ name, email, password });

  // Generate email verification token
  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send welcome email (async, don't wait)
  sendEmail({
    email: user.email,
    ...emailTemplates.welcome(user.name),
  }).catch(console.error);

  // Send token response
  sendTokenResponse(user, 201, res, 'Registration successful! Welcome to EcommerceApp 🎉');
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Contact support.', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful');
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name price images ratings');

  res.status(200).json({
    success: true,
    user,
  });
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  const { name, phone } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  // Handle avatar upload (set by handleAvatarUpload middleware)
  if (req.uploadedAvatar) {
    const user = await User.findById(req.user.id);

    // Delete old avatar from cloudinary if exists
    if (user.avatar?.public_id) {
      const { deleteImage } = require('../config/cloudinary');
      await deleteImage(user.avatar.public_id).catch(console.error);
    }

    updateData.avatar = req.uploadedAvatar;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  });
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated successfully');
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      ...emailTemplates.passwordReset(user.name, resetUrl),
    });

    res.status(200).json({
      success: true,
      message: `Password reset email sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Email could not be sent. Please try again.', 500));
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Password reset token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
};

// @desc    Add or update address
// @route   POST /api/auth/address
// @access  Private
exports.addAddress = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // If isDefault is true, reset all other defaults
  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(req.body);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Address added successfully',
    addresses: user.addresses,
  });
};

// @desc    Delete address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  user.addresses = user.addresses.filter(
    (addr) => addr._id.toString() !== req.params.addressId
  );

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    addresses: user.addresses,
  });
};

// @desc    Toggle wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
exports.toggleWishlist = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const productId = req.params.productId;

  const index = user.wishlist.indexOf(productId);
  let message;

  if (index === -1) {
    user.wishlist.push(productId);
    message = 'Product added to wishlist';
  } else {
    user.wishlist.splice(index, 1);
    message = 'Product removed from wishlist';
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message,
    wishlist: user.wishlist,
  });
};
