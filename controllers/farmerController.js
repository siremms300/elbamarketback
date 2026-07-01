const Farmer = require('../models/Farmer');

// @desc    Get all farmers with filtering
// @route   GET /api/farmers
// @access  Public
const getFarmers = async (req, res) => {
  try {
    const {
      state,
      verificationTier,
      crop,
      registrationMethod,
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const queryObj = {};

    if (state) {
      queryObj['location.state'] = state;
    }

    if (verificationTier) {
      queryObj.verificationTier = verificationTier;
    }

    if (crop) {
      queryObj['farmDetails.primaryCrops'] = crop;
    }

    if (registrationMethod) {
      queryObj.registrationMethod = registrationMethod;
    }

    if (status) {
      queryObj.status = status;
    } else {
      queryObj.status = 'active';
    }

    if (search) {
      queryObj.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } },
        { 'location.community': { $regex: search, $options: 'i' } },
        { 'cooperative.name': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [farmers, total] = await Promise.all([
      Farmer.find(queryObj)
        .select('-bankDetails -documents') // Exclude sensitive fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Farmer.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: farmers.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: farmers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single farmer by ID
// @route   GET /api/farmers/:id
// @access  Public
const getFarmerById = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id)
      .select('-bankDetails.accountNumber -bankDetails.bankCode') // Exclude sensitive financial data
      .lean();

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid farmer ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Register new farmer
// @route   POST /api/farmers
// @access  Public (verification happens later)
const registerFarmer = async (req, res) => {
  try {
    // Check if phone already exists
    const existingFarmer = await Farmer.findOne({ phone: req.body.phone });
    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: 'A farmer with this phone number already exists',
      });
    }

    const farmer = await Farmer.create({
      ...req.body,
      verificationTier: 'registered',
    });

    res.status(201).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate phone number or email',
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update farmer profile
// @route   PUT /api/farmers/:id
// @access  Private
const updateFarmer = async (req, res) => {
  try {
    // Prevent updating verification tier through this route
    delete req.body.verificationTier;

    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify farmer (upgrade verification tier)
// @route   PUT /api/farmers/:id/verify
// @access  Private (Admin/Agent only)
const verifyFarmer = async (req, res) => {
  try {
    const { newTier, verifiedBy, notes } = req.body;

    if (!['verified', 'trusted'].includes(newTier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification tier. Use "verified" or "trusted"',
      });
    }

    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    // Record the verification history
    farmer.verificationHistory.push({
      from: farmer.verificationTier,
      to: newTier,
      date: new Date(),
      verifiedBy: verifiedBy || 'System',
      notes: notes || `Upgraded from ${farmer.verificationTier} to ${newTier}`,
    });

    farmer.verificationTier = newTier;
    await farmer.save();

    res.status(200).json({
      success: true,
      data: farmer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getFarmers,
  getFarmerById,
  registerFarmer,
  updateFarmer,
  verifyFarmer,
};