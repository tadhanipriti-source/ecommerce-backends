const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createProductValidator, updateProductValidator, reviewValidator } = require('../validators/productValidator');
const { uploadProductImages } = require('../config/cloudinary');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  deleteReview,
  getFeaturedProducts,
  getProductReviews,
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', optionalAuth, getProduct);
router.get('/:id/reviews', getProductReviews);

// Protected user routes
router.post('/:id/reviews', protect, validate(reviewValidator), addReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

// Admin routes
router.post(
  '/',
  protect,
  authorize('admin'),
  uploadProductImages,
  validate(createProductValidator),
  createProduct
);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadProductImages,
  validate(updateProductValidator),
  updateProduct
);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
