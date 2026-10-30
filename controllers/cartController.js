const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate(
    'items.product',
    'name price discountPrice images stock isActive slug'
  );

  if (!cart) {
    return res.status(200).json({
      success: true,
      cart: { items: [], totalItems: 0, subtotal: 0, total: 0 },
    });
  }

  // Filter out unavailable products
  const validItems = cart.items.filter(
    (item) => item.product && item.product.isActive && item.product.stock > 0
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    cart,
  });
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return next(new AppError('Product not found or unavailable', 404));
  }

  if (product.stock < quantity) {
    return next(new AppError(`Only ${product.stock} items available in stock`, 400));
  }

  const price = product.discountPrice || product.price;

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: [{ product: productId, quantity, price }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      if (newQuantity > product.stock) {
        return next(new AppError(`Cannot add more. Only ${product.stock} available.`, 400));
      }

      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].price = price; // Update price in case it changed
    } else {
      cart.items.push({ product: productId, quantity, price });
    }

    await cart.save();
  }

  await cart.populate('items.product', 'name price discountPrice images stock slug');

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    cart,
  });
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );

  if (itemIndex === -1) {
    return next(new AppError('Item not found in cart', 404));
  }

  // Check stock
  const product = await Product.findById(cart.items[itemIndex].product);
  if (quantity > product.stock) {
    return next(new AppError(`Only ${product.stock} items available`, 400));
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  await cart.populate('items.product', 'name price discountPrice images stock slug');

  res.status(200).json({
    success: true,
    message: 'Cart updated',
    cart,
  });
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== req.params.itemId
  );

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    cart,
  });
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
  });
};
