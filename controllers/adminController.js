const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.keyword) {
    filter.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { email: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit).select('-password'),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
    },
    users,
  });
};

// @desc    Get single user (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({ success: true, user });
};

// @desc    Update user role/status (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  // Only allow updating role and isActive
  const allowedFields = { role: req.body.role, isActive: req.body.isActive };
  Object.keys(allowedFields).forEach(
    (key) => allowedFields[key] === undefined && delete allowedFields[key]
  );

  const user = await User.findByIdAndUpdate(req.params.id, allowedFields, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({ success: true, message: 'User updated', user });
};

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));

  // Prevent deleting self
  if (user._id.toString() === req.user.id) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'User deleted successfully' });
};

// @desc    Get dashboard stats (Admin)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueResult,
    recentOrders,
    topProducts,
    orderStatusStats,
    newUsersThisMonth,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.find().sort('-createdAt').limit(5).populate('user', 'name email'),
    Product.find({ isActive: true }).sort('-sold').limit(5).select('name sold price images'),
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    User.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }, // This month
      role: 'user',
    }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      newUsersThisMonth,
    },
    recentOrders,
    topProducts,
    orderStatusStats,
  });
};
