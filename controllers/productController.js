const Product = require('../models/Product');
const Category = require('../models/Category');
const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/AppError');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get all products (Search, Filter, Sort, Pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  const filter = { isActive: true };

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Brand filter
  if (req.query.brand) {
    filter.brand = { $regex: req.query.brand, $options: 'i' };
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
  }

  // Rating filter
  if (req.query.minRating) {
    filter.ratings = { $gte: parseFloat(req.query.minRating) };
  }

  // In stock filter
  if (req.query.inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // Featured filter
  if (req.query.featured === 'true') {
    filter.isFeatured = true;
  }

  // Keyword search
  let baseQuery;
  if (req.query.keyword) {
    baseQuery = Product.find({
      ...filter,
      $or: [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { description: { $regex: req.query.keyword, $options: 'i' } },
        { brand: { $regex: req.query.keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.keyword, 'i')] } },
      ],
    });
  } else {
    baseQuery = Product.find(filter);
  }

  // Build query with APIFeatures
  const features = new APIFeatures(baseQuery, req.query).sort().paginate();

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 12, 100);

  // Get total count
  const totalProducts = await Product.countDocuments(
    req.query.keyword
      ? {
          ...filter,
          $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { description: { $regex: req.query.keyword, $options: 'i' } },
          ],
        }
      : filter
  );

  const products = await features.query
    .populate('category', 'name slug')
    .select('-reviews');

  res.status(200).json({
    success: true,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(totalProducts / limit),
      hasPrevPage: page > 1,
    },
    products,
  });
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  const product = await Product.findOne({
    $or: [
      { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      { slug: req.params.id },
    ],
    isActive: true,
  })
    .populate('category', 'name slug')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  // Check if category exists
  const category = await Category.findById(req.body.category);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Handle uploaded images (set by handleProductImages middleware)
  let images = req.uploadedImages || [];

  if (images.length === 0) {
    return next(new AppError('At least one product image is required', 400));
  }

  const product = await Product.create({
    ...req.body,
    images,
    createdBy: req.user.id,
  });

  await product.populate('category', 'name slug');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product,
  });
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Handle new images upload (set by handleProductImages middleware)
  if (req.uploadedImages && req.uploadedImages.length > 0) {
    if (req.body.replaceImages === 'true') {
      // Delete old images from Cloudinary
      for (const img of product.images) {
        await deleteImage(img.public_id).catch(console.error);
      }
      req.body.images = req.uploadedImages;
    } else {
      // Append new images
      req.body.images = [...product.images, ...req.uploadedImages];
    }
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    product,
  });
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Delete images from Cloudinary
  for (const img of product.images) {
    await deleteImage(img.public_id).catch(console.error);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
};

// @desc    Add/Update review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  const { rating, comment, title } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user already reviewed this product
  const existingReviewIndex = product.reviews.findIndex(
    (r) => r.user.toString() === req.user.id.toString()
  );

  if (existingReviewIndex !== -1) {
    // Update existing review
    product.reviews[existingReviewIndex] = {
      ...product.reviews[existingReviewIndex].toObject(),
      rating: Number(rating),
      comment,
      title,
    };
  } else {
    // Add new review
    product.reviews.push({
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
      title,
    });
  }

  // Recalculate average rating
  product.calculateAverageRating();
  await product.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    message: existingReviewIndex !== -1 ? 'Review updated successfully' : 'Review added successfully',
    ratings: product.ratings,
    numReviews: product.numReviews,
  });
};

// @desc    Delete review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const review = product.reviews.id(req.params.reviewId);

  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Allow only the review author or admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this review', 403));
  }

  review.deleteOne();
  product.calculateAverageRating();
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .select('-reviews')
    .limit(8);

  res.status(200).json({
    success: true,
    products,
  });
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .select('reviews ratings numReviews')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Pagination for reviews
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const reviews = product.reviews.slice(startIndex, endIndex);
  const totalReviews = product.reviews.length;

  res.status(200).json({
    success: true,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalReviews / limit),
      totalReviews,
    },
    reviews,
    ratings: product.ratings,
    numReviews: product.numReviews,
  });
};
