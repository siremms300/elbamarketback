// server/models/WarehouseInventory.js
const mongoose = require('mongoose');

const warehouseInventorySchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    commodity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commodity',
      required: true,
      index: true,
    },
    commodityName: String,
    grade: String,
    sectionId: String,
    sectionName: String,
    quantityReceived: {
      amount: Number,
      unit: String,
    },
    quantityReleased: {
      type: Number,
      default: 0,
    },
    quantityAvailable: Number,
    owner: {
      ownerType: {
        type: String,
        enum: ['farmer', 'cooperative', 'aggregator', 'elba_market'],
      },
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'owner.ownerType',
      },
      ownerName: String,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow null values while maintaining uniqueness
    },
    qualityCheck: {
      inspectedBy: String,
      inspectionDate: Date,
      moistureContent: Number,
      foreignMatter: Number,
      pestInfestation: Boolean,
      notes: String,
      gradeAssigned: String,
      passed: Boolean,
    },
    transactionHistory: [
      {
        type: {
          type: String,
          enum: ['received', 'released', 'transferred', 'adjusted'],
        },
        quantity: Number,
        date: { type: Date, default: Date.now },
        reference: String,
        performedBy: String,
        notes: String,
      },
    ],
    status: {
      type: String,
      enum: ['in_storage', 'partially_released', 'fully_released', 'quarantined'],
      default: 'in_storage',
    },
    storageStartDate: {
      type: Date,
      default: Date.now,
    },
    storageFee: {
      ratePerDay: Number,
      currency: { type: String, default: 'NGN' },
    }, 
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate available quantity
warehouseInventorySchema.pre('save', function () {
  if (this.quantityReceived && this.quantityReceived.amount) {
    this.quantityAvailable = this.quantityReceived.amount - (this.quantityReleased || 0);
  }
});

// Index for common warehouse queries
warehouseInventorySchema.index({ warehouse: 1, status: 1 });
// warehouseInventorySchema.index({ receiptNumber: 1 }, { sparse: true });
warehouseInventorySchema.index({ commodity: 1, status: 1 });

const WarehouseInventory = mongoose.model('WarehouseInventory', warehouseInventorySchema);

module.exports = WarehouseInventory;