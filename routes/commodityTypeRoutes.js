const express = require('express');
const router = express.Router();
const { getCommodityTypes, getAllCommodityTypes, createCommodityType, updateCommodityType, toggleCommodityType } = require('../controllers/commodityTypeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/', getCommodityTypes);
router.get('/admin', protect, authorize('admin', 'super_admin'), getAllCommodityTypes);
router.post('/', protect, authorize('admin', 'super_admin'), createCommodityType);
router.put('/:id', protect, authorize('admin', 'super_admin'), updateCommodityType);
router.put('/:id/toggle', protect, authorize('admin', 'super_admin'), toggleCommodityType);

module.exports = router;