const Category = require('../models/Category');
const AppError = require('../utils/AppError');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.parent === 'null') filter.parent = null;
  if (req.query.parent && req.query.parent !== 'null') filter.parent = req.query.parent;

  const categories = await Category.find(filter)
    .populate('parent', 'name slug')
    .sort('order name');

  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  const category = await Category.findOne({
    $or: [
      { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      { slug: req.params.id },
    ],
  }).populate('parent', 'name slug');

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({ success: true, category });
};

// @desc    Create category (Admin)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  if (req.body.parent) {
    const parent = await Category.findById(req.body.parent);
    if (!parent) return next(new AppError('Parent category not found', 404));
  }

  // Handle image upload
  if (req.file) {
    req.body.image = { public_id: req.file.filename, url: req.file.path };
  }

  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category,
  });
};

// @desc    Update category (Admin)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  if (req.file) {
    req.body.image = { public_id: req.file.filename, url: req.file.path };
  }

  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) return next(new AppError('Category not found', 404));

  res.status(200).json({ success: true, message: 'Category updated', category });
};

// @desc    Delete category (Admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  const Product = require('../models/Product');

  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    return next(
      new AppError(
        `Cannot delete category with ${productCount} products. Move products first.`,
        400
      )
    );
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));

  res.status(200).json({ success: true, message: 'Category deleted successfully' });
};
