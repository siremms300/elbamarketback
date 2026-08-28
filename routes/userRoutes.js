// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const User = require('../models/User');
const Warehouse = require('../models/Warehouse');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (admin)
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { role, search, limit = 50 } = req.query;
    const queryObj = {};
    
    if (role) queryObj.role = role;
    if (search) {
      queryObj.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(queryObj)
      .select('-password')
      .populate('warehouseOperatorProfile', 'name code location')
      .populate('farmerProfile', 'farmDetails')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Assign warehouse to warehouse operator
// @route   PUT /api/users/:id/assign-warehouse
// @access  Private (admin)
router.put('/:id/assign-warehouse', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { warehouseId } = req.body;
    
    if (!warehouseId) {
      return res.status(400).json({ success: false, message: 'Warehouse ID is required' });
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'warehouse_operator') {
      return res.status(400).json({ success: false, message: 'User is not a warehouse operator' });
    }

    user.warehouseOperatorProfile = warehouseId;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Warehouse assigned successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;