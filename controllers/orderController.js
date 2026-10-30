const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  const { orderItems, shippingAddress, paymentInfo, notes } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return next(new AppError('No order items provided', 400));
  }

  // Validate products and calculate prices
  let itemsPrice = 0;
  const validatedItems = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      return next(new AppError(`Product not found: ${item.product}`, 404));
    }

    if (!product.isActive) {
      return next(new AppError(`Product '${product.name}' is not available`, 400));
    }

    if (product.stock < item.quantity) {
      return next(
        new AppError(
          `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`,
          400
        )
      );
    }

    const price = product.discountPrice || product.price;
    itemsPrice += price * item.quantity;

    validatedItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      price,
      quantity: item.quantity,
    });
  }

  // Calculate tax (18% GST)
  const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;

  // Calculate shipping (free above ₹500)
  const shippingPrice = itemsPrice >= 500 ? 0 : 50;

  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  // Create order
  const order = await Order.create({
    user: req.user.id,
    orderItems: validatedItems,
    shippingAddress,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    notes,
    statusHistory: [{ status: 'pending', note: 'Order placed successfully' }],
  });

  // Update product stock (deduct)
  for (const item of validatedItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }

  // Clear cart
  await Cart.findOneAndDelete({ user: req.user.id });

  // Send confirmation email
  sendEmail({
    email: req.user.email,
    ...emailTemplates.orderConfirmation(req.user.name, order),
  }).catch(console.error);

  await order.populate('user', 'name email');

  res.status(201).json({
    success: true,
    message: 'Order placed successfully!',
    order,
  });
};

// @desc    Get my orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.status) filter.orderStatus = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('orderItems.product', 'name slug'),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      itemsPerPage: limit,
    },
    orders,
  });
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name slug images');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Users can only see their own orders
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to view this order', 403));
  }

  res.status(200).json({
    success: true,
    order,
  });
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to cancel this order', 403));
  }

  if (['delivered', 'cancelled', 'refunded'].includes(order.orderStatus)) {
    return next(new AppError(`Cannot cancel order with status: ${order.orderStatus}`, 400));
  }

  if (order.orderStatus === 'shipped') {
    return next(new AppError('Cannot cancel a shipped order. Please contact support.', 400));
  }

  // Restore stock
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sold: -item.quantity },
    });
  }

  order.orderStatus = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user' });
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    order,
  });
};

// ========== ADMIN ROUTES ==========

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.userId) filter.user = req.query.userId;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .select('-statusHistory'),
    Order.countDocuments(filter),
  ]);

  // Calculate total revenue
  const revenueResult = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      itemsPerPage: limit,
    },
    totalRevenue: revenueResult[0]?.totalRevenue || 0,
    orders,
  });
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  const { status, trackingNumber, note } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  order.orderStatus = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  if (status === 'confirmed' && req.body.paidAt) {
    order.isPaid = true;
    order.paidAt = new Date();
  }

  order.statusHistory.push({
    status,
    note: note || `Status updated to ${status}`,
    timestamp: new Date(),
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: `Order status updated to '${status}'`,
    order,
  });
};

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
  ]);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
        orderStatus: { $nin: ['cancelled', 'refunded'] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.status(200).json({
    success: true,
    stats,
    monthlyRevenue,
  });
};
