const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');
const {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
} = require('../controllers/orderController');

// Protected user routes
router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.get('/admin/all', authorize('admin'), getAllOrders);
router.get('/admin/stats', authorize('admin'), getOrderStats);
router.put('/admin/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
