const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    location: {
      state: {
        type: String,
        required: true,
      },
      lga: String,
      community: String,
      address: String,
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    capacity: {
      total: {
        type: Number, // in metric tons
        required: true,
      },
      used: {
        type: Number,
        default: 0,
      },
      unit: {
        type: String,
        default: 'metric_ton',
      },
    },
    security: {
      hasSecurityPersonnel: { type: Boolean, default: false },
      hasCCTV: { type: Boolean, default: false },
      hasFencing: { type: Boolean, default: false },
      hasInsurance: { type: Boolean, default: false },
      insuranceProvider: String,
      insuranceExpiry: Date,
    },
    services: [
      {
        type: String,
        enum: [
          'storage',
          'grading',
          'bagging',
          'fumigation',
          'quality_testing',
          'transport_arrangement',
          'receipt_issuance',
        ],
      },
    ],
    manager: {
      name: String,
      phone: String,
      email: String,
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active',
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    warehouseLayout: {
      sections: [
        {
          sectionId: String,
          sectionName: String,
          capacity: Number,
          currentOccupancy: Number,
          commodities: [String],
        },
      ],
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    operatingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
    },
    proximityToTransport: {
      nearestHighway: String,
      distanceToHighwayKm: Number,
      nearestRailStation: String,
      distanceToRailKm: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for available capacity
warehouseSchema.virtual('availableCapacity').get(function () {
  return this.capacity.total - this.capacity.used;
});

// Virtual for capacity utilization percentage
warehouseSchema.virtual('capacityUtilization').get(function () {
  if (!this.capacity.total || this.capacity.total === 0) return 0;
  return Math.round((this.capacity.used / this.capacity.total) * 100);
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;