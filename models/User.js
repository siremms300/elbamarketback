// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: [
        'farmer',
        'buyer',
        'warehouse_operator',
        'logistics_partner',
        'admin',
        'super_admin',
      ],
      required: [true, 'User role is required'],
    },

    // Profile
    avatar: {
      url: String,
      publicId: String,
    },
    location: {
      state: String,
      lga: String,
      community: String,
    },

    // Role-specific linked profiles
    farmerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
    },
    warehouseOperatorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },

    // Business info
    companyName: String,
    businessType: String,

    // Verification
    verificationTier: {
      type: String,
      enum: ['unverified', 'phone_verified', 'id_verified', 'fully_verified'],
      default: 'unverified',
    },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    idDocument: { url: String, publicId: String },

    // Status
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,

    // Admin-specific
    adminLevel: {
      type: Number,
      enum: [1, 2, 3], // 1 = listing reviewer, 2 = operations manager, 3 = super admin
    },
    adminPermissions: {
      canReviewListings: { type: Boolean, default: false },
      canManageWarehouses: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canProcessPayments: { type: Boolean, default: false },
      canResolveDisputes: { type: Boolean, default: false },
      canManageAdmins: { type: Boolean, default: false },
    },

    // Ratings
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalTransactions: { type: Number, default: 0 },
    successfulTransactions: { type: Number, default: 0 },

    // Wallet (Elba holds funds)
    walletBalance: { type: Number, default: 0 },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
    },

    // Login tracking
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Full name virtual
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Check if admin
userSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin' || this.role === 'super_admin';
});

// Check if can review listings
userSchema.virtual('canReviewListings').get(function () {
  return this.isAdmin && (this.adminPermissions?.canReviewListings || this.adminLevel >= 1);
});

module.exports = mongoose.model('User', userSchema);