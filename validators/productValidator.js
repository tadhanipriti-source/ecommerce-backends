const { body, query } = require('express-validator');

exports.createProductValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Name must be between 3-200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10-5000 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('discountPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number')
    .custom((value, { req }) => {
      if (parseFloat(value) >= parseFloat(req.body.price)) {
        throw new Error('Discount price must be less than original price');
      }
      return true;
    }),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),

  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Brand name cannot exceed 100 characters'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
];

exports.updateProductValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Name must be between 3-200 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

exports.reviewValidator = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('comment')
    .trim()
    .notEmpty().withMessage('Review comment is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10-1000 characters'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Review title cannot exceed 100 characters'),
];
