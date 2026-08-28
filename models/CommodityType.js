// server/models/CommodityType.js
const mongoose = require('mongoose');

const commodityTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Commodity name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ['grains', 'legumes', 'tubers', 'vegetables', 'fruits', 'oil_seeds', 'spices', 'cash_crops', 'other'],
      required: true,
    },
    defaultUnit: {
      type: String,
      enum: ['kg', 'bag', 'ton', 'crate', 'basket', 'litre', 'head', 'carton'],
      default: 'bag',
    },
    emoji: {
      type: String,
      default: '📦',
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

commodityTypeSchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
});

module.exports = mongoose.model('CommodityType', commodityTypeSchema);