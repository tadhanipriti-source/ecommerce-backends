const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Admin routes
router.post('/', protect, authorize('admin'), uploadAvatar, createCategory);
router.put('/:id', protect, authorize('admin'), uploadAvatar, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
