// server/models/Listing.js
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    // Who created it
    sourceType: {
      type: String,
      enum: ['farmer', 'warehouse', 'admin', 'super_admin'],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },

    // What's being listed
    commodityType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommodityType',
      required: true,
    },
    quantity: {
      amount: { type: Number, required: true, min: 1 },
      unit: { type: String, required: true },
    },
    expectedPrice: {
      amount: { type: Number, required: true },
      perUnit: { type: String, required: true },
      negotiable: { type: Boolean, default: true },
    },

    // Where the goods are
    currentLocation: {
      state: { type: String, required: true },
      lga: String,
      community: String,
    },

    // Farm details (only for farmers)
    farmDetails: {
      harvestDate: Date,
      moistureContent: Number,
      farmingMethod: String,
    },

    // Images
    images: [{ url: String, publicId: String }],

    // Pipeline status
    status: {
      type: String,
      enum: [
        'pending_review',       // farmer submitted → waiting for admin
        'auto_approved',        // warehouse/admin created → skip review
        'approved',             // admin approved
        'rejected',             // admin rejected
        'changes_requested',    // admin wants changes
        'assigned_to_warehouse', // assigned to a specific warehouse
        'received_at_warehouse', // warehouse confirmed receipt
        'qa_completed',         // warehouse did quality check
        'ready_for_market',     // passed QA, ready to go live
        'live',                 // live on market
        'sold',                 // fully sold
        'expired',              // listing expired
        'cancelled',            // cancelled by creator
      ],
      default: 'pending_review',
    },

    // Admin review
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewNotes: String,
    rejectionReason: String,

    // Warehouse assignment
    assignedWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    assignedAt: Date,
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Warehouse verification
    warehouseVerification: {
      receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      receivedAt: Date,
      receivedQuantity: Number,
      gradeAssigned: String,
      moistureContent: Number,
      foreignMatter: Number,
      pestInfestation: Boolean,
      qualityNotes: String,
      passed: Boolean,
      warehouseReceiptNumber: String,
    },

    // Final price set by Elba after QA (may differ from farmer's expected price)
    finalPrice: {
      amount: Number,
      perUnit: String,
    },

    // The live commodity on market
    liveCommodityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commodity',
    },

    // Notes
    notes: String,
    adminNotes: [{
      note: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now },
    }],

    // Timestamps
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
listingSchema.index({ status: 1 });
listingSchema.index({ createdBy: 1, status: 1 });
listingSchema.index({ sourceType: 1, status: 1 });
listingSchema.index({ assignedWarehouse: 1, status: 1 });
listingSchema.index({ commodityType: 1, status: 1 });

module.exports = mongoose.model('Listing', listingSchema);