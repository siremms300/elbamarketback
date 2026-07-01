// server/controllers/warehouseController.js
const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');

// @desc    Get all warehouses with filtering
// @route   GET /api/warehouses
// @access  Public
const getWarehouses = async (req, res) => {
  try {
    const { state, status, services, page = 1, limit = 20 } = req.query;

    const queryObj = {};

    if (state) {
      queryObj['location.state'] = state;
    }

    if (status) {
      queryObj.status = status;
    } else {
      queryObj.status = 'active';
    }

    if (services) {
      const servicesList = services.split(',').map(s => s.trim());
      queryObj.services = { $all: servicesList };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [warehouses, total] = await Promise.all([
      Warehouse.find(queryObj)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Warehouse.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: warehouses.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: warehouses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Public
const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).lean();

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    // Get current inventory count
    const inventoryCount = await WarehouseInventory.countDocuments({
      warehouse: req.params.id,
      status: { $in: ['in_storage', 'partially_released'] },
    });

    res.status(200).json({
      success: true,
      data: {
        ...warehouse,
        activeInventoryEntries: inventoryCount,
      },
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private
const createWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);

    res.status(201).json({
      success: true,
      data: warehouse,
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

    // Handle duplicate code
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse code already exists',
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private
const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    res.status(200).json({
      success: true,
      data: warehouse,
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

// @desc    Get warehouse inventory
// @route   GET /api/warehouses/:id/inventory
// @access  Public
const getWarehouseInventory = async (req, res) => {
  try {
    const { status, commodity, page = 1, limit = 50 } = req.query;

    const queryObj = { warehouse: req.params.id };

    if (status) {
      queryObj.status = status;
    } else {
      queryObj.status = { $in: ['in_storage', 'partially_released'] };
    }

    if (commodity) {
      queryObj.commodityName = commodity;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [inventory, total, summary] = await Promise.all([
      WarehouseInventory.find(queryObj)
        .populate('commodity', 'name grade quantity price')
        .sort({ storageStartDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WarehouseInventory.countDocuments(queryObj),
      WarehouseInventory.aggregate([
        { $match: { warehouse: new (require('mongoose').Types.ObjectId)(req.params.id) } },
        {
          $group: {
            _id: '$commodityName',
            totalQuantity: { $sum: '$quantityAvailable' },
            entries: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      count: inventory.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      summary,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Receive inventory into warehouse
// @route   POST /api/warehouses/:id/inventory
// @access  Private
const receiveInventory = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const inventoryData = {
      ...req.body,
      warehouse: req.params.id,
      receiptNumber,
      status: 'in_storage',
      storageStartDate: new Date(),
    };

    const inventory = await WarehouseInventory.create(inventoryData);

    // Update warehouse used capacity
    warehouse.capacity.used += (inventory.quantityReceived.amount / 1000) || 0; // Convert to metric tons
    await warehouse.save();

    res.status(201).json({
      success: true,
      data: inventory,
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

// @desc    Release inventory from warehouse
// @route   POST /api/warehouses/:id/inventory/release
// @access  Private
const releaseInventory = async (req, res) => {
  try {
    const { inventoryId, quantity, releasedTo, reference } = req.body;

    const inventory = await WarehouseInventory.findOne({
      _id: inventoryId,
      warehouse: req.params.id,
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory record not found in this warehouse',
      });
    }

    if (inventory.status === 'fully_released') {
      return res.status(400).json({
        success: false,
        message: 'This inventory has already been fully released',
      });
    }

    if (quantity > inventory.quantityAvailable) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Available: ${inventory.quantityAvailable}`,
      });
    }

    // Update inventory
    inventory.quantityReleased += quantity;
    inventory.quantityAvailable = inventory.quantityReceived.amount - inventory.quantityReleased;

    // Update status
    if (inventory.quantityAvailable <= 0) {
      inventory.status = 'fully_released';
    } else {
      inventory.status = 'partially_released';
    }

    // Add to transaction history
    inventory.transactionHistory.push({
      type: 'released',
      quantity,
      reference: reference || `REL-${Date.now()}`,
      performedBy: releasedTo || 'System',
      notes: `Released ${quantity} ${inventory.quantityReceived.unit || 'units'}`,
    });

    await inventory.save();

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  getWarehouseInventory,
  receiveInventory,
  releaseInventory,
};