// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Buyer
router.post('/', protect, authorize('buyer', 'admin', 'super_admin'), createOrder);
router.get('/my-orders', protect, getMyOrders);

// Seller
router.get('/seller-orders', protect, getSellerOrders);

// Shared
router.get('/:id', protect, getOrderById);

// Admin
router.get('/admin/all', protect, authorize('admin', 'super_admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin', 'super_admin', 'warehouse_operator'), updateOrderStatus);

module.exports = router;