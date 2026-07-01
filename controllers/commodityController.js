const Commodity = require('../models/Commodity');

// @desc    Get all commodities with filtering
// @route   GET /api/commodities
// @access  Public
const getCommodities = async (req, res) => {
  try {
    const {
      name,
      grade,
      state,
      lga,
      locationType,
      minQuantity,
      maxQuantity,
      minPrice,
      maxPrice,
      harvestDays,
      verifiedOnly,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      search,
    } = req.query;

    // Build query object
    const queryObj = { status: 'active' };

    // Filter by commodity name (supports comma-separated multiple values)
    // if (name) {
    //   const names = name.split(',').map(n => n.trim());
    //   queryObj.name = { $in: names };
    // }

    // With commodityType filter
    if (req.query.commodityType) {
    queryObj.commodityType = req.query.commodityType;
    }

    // Filter by grade
    if (grade) {
      const grades = grade.split(',').map(g => g.trim());
      queryObj.grade = { $in: grades };
    }

    // Filter by state
    if (state) {
      queryObj['location.state'] = state;
    }

    // Filter by LGA
    if (lga) {
      queryObj['location.lga'] = lga;
    }

    // Filter by location type
    if (locationType) {
      queryObj['location.locationType'] = locationType;
    }

    // Filter by quantity range
    if (minQuantity || maxQuantity) {
      queryObj['quantity.amount'] = {};
      if (minQuantity) queryObj['quantity.amount'].$gte = Number(minQuantity);
      if (maxQuantity) queryObj['quantity.amount'].$lte = Number(maxQuantity);
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      queryObj['price.amount'] = {};
      if (minPrice) queryObj['price.amount'].$gte = Number(minPrice);
      if (maxPrice) queryObj['price.amount'].$lte = Number(maxPrice);
    }

    // Filter by harvest date freshness
    if (harvestDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(harvestDays));
      queryObj.harvestDate = { $gte: cutoffDate };
    }

    // Filter only verified/trusted sellers
    if (verifiedOnly === 'true') {
      queryObj['seller.verificationTier'] = { $in: ['verified', 'trusted'] };
    }

    // Search across multiple fields
    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'seller.name': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } },
        { 'location.lga': { $regex: search, $options: 'i' } },
        { 'location.community': { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    let sort = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'price':
        sort['price.amount'] = order;
        break;
      case 'quantity':
        sort['quantity.amount'] = order;
        break;
      case 'rating':
        sort['seller.rating'] = order;
        break;
      case 'date':
      default:
        sort.createdAt = order;
        break;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Cap between 1-100
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel for performance
    const [commodities, total] = await Promise.all([
      Commodity.find(queryObj)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('location.warehouseId', 'name code location security')
        .lean(),
      Commodity.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: commodities.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: commodities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single commodity by ID
// @route   GET /api/commodities/:id
// @access  Public
const getCommodityById = async (req, res) => {
  try {
    const commodity = await Commodity.findById(req.params.id)
      .populate('location.warehouseId', 'name code location capacity services security ratings operatingHours')
      .lean();

    if (!commodity) {
      return res.status(404).json({
        success: false,
        message: 'Commodity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: commodity,
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid commodity ID format',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new commodity listing
// @route   POST /api/commodities
// @access  Private (auth middleware will be added)
const createCommodity = async (req, res) => {
  try {
    const commodity = await Commodity.create(req.body);
    
    res.status(201).json({
      success: true,
      data: commodity,
    });
  } catch (error) {
    // Handle validation errors
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

// @desc    Update commodity listing
// @route   PUT /api/commodities/:id
// @access  Private
const updateCommodity = async (req, res) => {
  try {
    const commodity = await Commodity.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!commodity) {
      return res.status(404).json({
        success: false,
        message: 'Commodity not found',
      });
    }

    res.status(200).json({
      success: true,
      data: commodity,
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

// @desc    Get commodity statistics
// @route   GET /api/commodities/stats
// @access  Public
const getCommodityStats = async (req, res) => {
  try {
    const [commodityStats, stateStats, locationTypeStats] = await Promise.all([
      // Aggregate by commodity type
      Commodity.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$name',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price.amount' },
            totalQuantity: { $sum: '$quantity.amount' },
            avgRating: { $avg: '$seller.rating' },
          },
        },
        { $sort: { count: -1 } },
      ]),
      
      // Aggregate by state
      Commodity.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$location.state',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price.amount' },
            totalQuantity: { $sum: '$quantity.amount' },
          },
        },
        { $sort: { count: -1 } },
      ]),
      
      // Aggregate by location type
      Commodity.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$location.locationType',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price.amount' },
            totalQuantity: { $sum: '$quantity.amount' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byCommodity: commodityStats,
        byState: stateStats,
        byLocationType: locationTypeStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCommodities,
  getCommodityById,
  createCommodity,
  updateCommodity,
  getCommodityStats,
};