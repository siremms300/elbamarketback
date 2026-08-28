// server/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // Buyer info
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // What was purchased
    commodity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commodity',
      required: true,
    },
    commoditySnapshot: {
      name: String,
      grade: String,
      emoji: String,
      unit: String,
    },

    // Order details
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    // Seller info (who gets paid)
    seller: {
      sellerType: String,
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      sellerName: String,
    },

    // Warehouse handling this order
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },

    // Logistics
    logisticsPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    logisticsStatus: {
      type: String,
      enum: ['pending', 'assigned', 'in_transit', 'delivered'],
      default: 'pending',
    },
    trackingNumber: String,

    // Delivery
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      contactName: String,
      contactPhone: String,
    },

    // Order status
    status: {
      type: String,
      enum: [
        'pending_payment',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'completed',
        'cancelled',
        'disputed',
      ],
      default: 'pending_payment',
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'held', 'released', 'refunded'],
      default: 'pending',
    },
    paymentReference: String,
    paymentMethod: String,
    paidAt: Date,
    fundsReleasedAt: Date,

    // Elba's role in the transaction
    elbaEscrow: {
      fundsHeld: { type: Boolean, default: false },
      fundsReleased: { type: Boolean, default: false },
      releasedTo: String,
      releasedAt: Date,
    },

    // Timeline
    statusHistory: [
      {
        status: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        notes: String,
      },
    ],

    // Notes
    buyerNotes: String,
    adminNotes: String,

    // Dispute
    disputeReason: String,
    disputeStatus: {
      type: String,
      enum: ['none', 'open', 'resolved_buyer', 'resolved_seller'],
      default: 'none',
    },
    disputeResolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    disputeResolvedAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ commodity: 1 });

module.exports = mongoose.model('Order', orderSchema);