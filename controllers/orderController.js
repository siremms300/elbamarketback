// server/controllers/orderController.js
const Order = require('../models/Order');
const Commodity = require('../models/Commodity');

// @desc    Create order from "Buy Now"
// @route   POST /api/orders
// @access  Private (buyer)
const createOrder = async (req, res) => {
  try {
    const { commodityId, quantity, deliveryAddress, buyerNotes } = req.body;

    // Validate commodity
    const commodity = await Commodity.findById(commodityId)
      .populate('commodityType', 'name emoji');

    if (!commodity) {
      return res.status(404).json({ success: false, message: 'Commodity not found' });
    }

    if (commodity.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This listing is no longer available' });
    }

    if (quantity < commodity.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order is ${commodity.minimumOrder} ${commodity.quantity.unit}`,
      });
    }

    if (quantity > commodity.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${commodity.availableQuantity} ${commodity.quantity.unit} available`,
      });
    }

    const totalAmount = commodity.price.amount * quantity;

    const order = await Order.create({
      buyer: req.user._id,
      commodity: commodityId,
      commoditySnapshot: {
        name: commodity.name,
        grade: commodity.grade,
        emoji: commodity.commodityType?.emoji || '📦',
        unit: commodity.quantity.unit,
      },
      quantity,
      pricePerUnit: commodity.price.amount,
      totalAmount,
      seller: commodity.seller,
      warehouse: commodity.location.warehouseId,
      deliveryAddress: deliveryAddress || {
        contactName: `${req.user.firstName} ${req.user.lastName}`,
        contactPhone: req.user.phone,
        state: req.user.location?.state || '',
      },
      buyerNotes,
      status: 'pending_payment',
      paymentStatus: 'pending',
      statusHistory: [
        {
          status: 'pending_payment',
          changedBy: req.user._id,
          changedAt: new Date(),
          notes: 'Order created',
        },
      ],
    });

    // Reserve quantity from commodity
    commodity.availableQuantity -= quantity;
    await commodity.save();

    const populated = await Order.findById(order._id)
      .populate('commodity', 'name grade price images')
      .populate('buyer', 'firstName lastName email phone')
      .populate('warehouse', 'name code location');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get buyer's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const queryObj = { buyer: req.user._id };
    if (status) queryObj.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(queryObj)
        .populate('commodity', 'name grade price images')
        .populate('warehouse', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seller's orders (farmer/warehouse sees orders for their listings)
// @route   GET /api/orders/seller-orders
// @access  Private
const getSellerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const queryObj = { 'seller.sellerId': req.user._id };
    if (status) queryObj.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(queryObj)
        .populate('commodity', 'name grade price')
        .populate('buyer', 'firstName lastName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (buyer, seller, or admin)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('commodity')
      .populate('buyer', 'firstName lastName email phone')
      .populate('warehouse', 'name code location')
      .populate('logisticsPartner', 'firstName lastName phone')
      .populate('statusHistory.changedBy', 'firstName lastName');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check access
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.seller.sellerId?.toString() === req.user._id.toString();
    const isAdminUser = ['admin', 'super_admin'].includes(req.user.role);

    if (!isBuyer && !isSeller && !isAdminUser) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (admin or warehouse)
// @route   PUT /api/orders/:id/status
// @access  Private (admin, warehouse_operator)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowedStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If delivered, release payment
    if (status === 'delivered') {
      order.elbaEscrow.fundsReleased = true;
      order.elbaEscrow.releasedTo = order.seller.sellerId;
      order.elbaEscrow.releasedAt = new Date();
      order.paymentStatus = 'released';
      order.fundsReleasedAt = new Date();
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: notes || `Order ${status}`,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order marked as ${status}`,
      data: order,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Get all orders
// @route   GET /api/orders/admin/all
// @access  Private (admin)
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const queryObj = {};
    if (status) queryObj.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(queryObj)
        .populate('commodity', 'name grade')
        .populate('buyer', 'firstName lastName')
        .populate('warehouse', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
};