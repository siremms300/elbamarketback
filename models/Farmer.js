// server/models/Farmer.js
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      sparse: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    location: {
      state: String,
      lga: String,
      community: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    farmDetails: {
      size: Number, // in hectares
      primaryCrops: [String],
      secondaryCrops: [String],
      yearsOfExperience: Number,
      farmType: {
        type: String,
        enum: ['crop', 'livestock', 'mixed', 'aquaculture'],
        default: 'crop',
      },
    },
    cooperative: {
      name: String,
      membershipId: String,
      verified: { type: Boolean, default: false },
    },
    verificationTier: {
      type: String,
      enum: ['registered', 'verified', 'trusted'],
      default: 'registered',
    },
    verificationHistory: [
      {
        from: String,
        to: String,
        date: { type: Date, default: Date.now },
        verifiedBy: String,
        notes: String,
      },
    ],
    documents: {
      idCard: { url: String, publicId: String },
      farmPhoto: { url: String, publicId: String },
      cooperativeLetter: { url: String, publicId: String },
    },
    profilePhoto: {
      url: String,
      publicId: String,
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      bankCode: String,
    },
    registrationMethod: {
      type: String,
      enum: ['self', 'cooperative_bulk', 'field_agent'],
      default: 'self',
    },
    registeredBy: {
      type: String, // agent ID if registered by field agent
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for phone number lookups 
// farmerSchema.index({ 'location.state': 1 });
// farmerSchema.index({ verificationTier: 1 });

// Indexes (phone already indexed via unique: true on the field)
farmerSchema.index({ 'location.state': 1 });
farmerSchema.index({ verificationTier: 1 });
farmerSchema.index({ fullName: 'text', 'location.state': 'text' }); // Text search index

const Farmer = mongoose.model('Farmer', farmerSchema);

module.exports = Farmer;