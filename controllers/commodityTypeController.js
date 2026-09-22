// server/controllers/commodityTypeConntroller.js
const CommodityType = require('../models/CommodityType');

// @desc    Get all active commodity types (public)
// @route   GET /api/commodity-types
// @access  Public  
const getCommodityTypes = async (req, res) => {
  try {
    const { category } = req.query;
    const queryObj = { isActive: true };
    if (category) queryObj.category = category;

    const types = await CommodityType.find(queryObj).sort({ sortOrder: 1, name: 1 });

    res.status(200).json({ success: true, count: types.length, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all commodity types (including inactive)
// @route   GET /api/commodity-types/admin
// @access  Private (admin)
const getAllCommodityTypes = async (req, res) => {
  try {
    const types = await CommodityType.find().sort({ category: 1, sortOrder: 1, name: 1 });
    res.status(200).json({ success: true, count: types.length, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Create commodity type
// @route   POST /api/commodity-types
// @access  Private (admin)
const createCommodityType = async (req, res) => {
  try {
    const type = await CommodityType.create(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Commodity type already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Update commodity type
// @route   PUT /api/commodity-types/:id
// @access  Private (admin)
const updateCommodityType = async (req, res) => {
  try {
    const type = await CommodityType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!type) {
      return res.status(404).json({ success: false, message: 'Commodity type not found' });
    }

    res.status(200).json({ success: true, data: type });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Commodity type with that name already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Toggle commodity type active/inactive
// @route   PUT /api/commodity-types/:id/toggle
// @access  Private (admin)
const toggleCommodityType = async (req, res) => {
  try {
    const type = await CommodityType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({ success: false, message: 'Commodity type not found' });
    }

    type.isActive = !type.isActive;
    await type.save();

    res.status(200).json({
      success: true,
      data: type,
      message: type.isActive ? 'Commodity type activated' : 'Commodity type deactivated',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Delete commodity type
// @route   DELETE /api/commodity-types/:id
// @access  Private (admin)
const deleteCommodityType = async (req, res) => {
  try {
    const type = await CommodityType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({ success: false, message: 'Commodity type not found' });
    }

    await CommodityType.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Commodity type deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCommodityTypes,
  getAllCommodityTypes,
  createCommodityType,
  updateCommodityType,
  toggleCommodityType,
  deleteCommodityType,
};