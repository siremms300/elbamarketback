const express = require('express');
const router = express.Router();
const {
  createListing,
  getMyListings,
  getPendingReview,
  getAwaitingWarehouse,
  getListingById,
  approveListing,
  rejectListing,
  receiveAtWarehouse, 
  completeQA,
  getListingStats,
  getAllListings,
} = require('../controllers/listingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Any authenticated user
router.post('/', protect, createListing);
router.get('/my-listings', protect, getMyListings);

// Admin
router.get('/admin/pending-review', protect, authorize('admin', 'super_admin'), getPendingReview);
router.get('/admin/all', protect, authorize('admin', 'super_admin'), getAllListings);
router.get('/admin/stats', protect, authorize('admin', 'super_admin'), getListingStats);
router.put('/:id/approve', protect, authorize('admin', 'super_admin'), approveListing);
router.put('/:id/reject', protect, authorize('admin', 'super_admin'), rejectListing);

// Warehouse
router.get('/warehouse/awaiting', protect, authorize('admin', 'super_admin', 'warehouse_operator'), getAwaitingWarehouse);
router.put('/:id/receive', protect, authorize('admin', 'super_admin', 'warehouse_operator'), receiveAtWarehouse);
router.put('/:id/complete-qa', protect, authorize('admin', 'super_admin', 'warehouse_operator'), completeQA);
router.get('/:id', protect, getListingById);

module.exports = router;