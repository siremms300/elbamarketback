// server/models/Commodity.js
const mongoose = require('mongoose');

const commoditySchema = new mongoose.Schema(
  {
    // Reference to the listing that created this
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing', 
    },

    // Commodity type from our dynamic collection
    commodityType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommodityType',
      required: true,
      index: true,
    },
    // Denormalized name for search/display
    name: {
      type: String,
      required: true,
      index: true,
    },

    // Quality grade
    grade: {
      type: String,
      default: 'B',
    },

    // Quantity
    quantity: {
      amount: { type: Number, required: true, min: 0 },
      unit: { type: String, required: true },
    },
    availableQuantity: { type: Number },

    // Price
    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'NGN' },
      perUnit: { type: String, required: true },
      negotiable: { type: Boolean, default: true },
    },

    // Location
    location: {
      state: { type: String, required: true, index: true },
      lga: String,
      community: String,
      locationType: {
        type: String,
        default: 'warehouse',
      },
      warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        default: null,
      },
    },

    // Harvest info
    harvestDate: Date,
    moistureContent: Number,

    // Images
    images: [{ url: String, publicId: String }],

    // Seller info
    seller: {
      sellerType: { type: String, required: true },
      sellerId: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      verificationTier: { type: String, default: 'verified' },
      rating: { type: Number, default: 0 },
      totalTransactions: { type: Number, default: 0 },
    },

    // Status
    status: {
      type: String,
      default: 'active',
      index: true,
    },

    // Quality certification
    qualityCertification: {
      hasCertification: { type: Boolean, default: false },
      certifyingBody: String,
      warehouseReceiptNumber: String,
    },

    // Order constraints
    minimumOrder: { type: Number, default: 1 },

    // Source info
    sourceType: String,
    sourceListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save
commoditySchema.pre('save', function () {
  if (this.isNew) {
    this.availableQuantity = this.quantity.amount;
  }
});

// Virtuals
commoditySchema.virtual('displayPrice').get(function () {
  return `₦${this.price.amount.toLocaleString()}/${this.price.perUnit}`;
});

commoditySchema.virtual('percentageRemaining').get(function () {
  if (!this.quantity.amount || this.quantity.amount === 0) return 0;
  return Math.round((this.availableQuantity / this.quantity.amount) * 100);
});

// Indexes
commoditySchema.index({ 'location.state': 1, commodityType: 1, grade: 1 });
commoditySchema.index({ 'price.amount': 1 });
commoditySchema.index({ status: 1, 'location.locationType': 1 });
commoditySchema.index({ commodityType: 1, status: 1 });
commoditySchema.index({ name: 'text', 'location.state': 'text', 'seller.name': 'text' });

module.exports = mongoose.model('Commodity', commoditySchema);