// server/controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    // Validate role
    const allowedRoles = ['farmer', 'buyer', 'warehouse_operator', 'logistics_partner'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${allowedRoles.join(', ')}`,
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Phone number already registered',
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verificationTier: user.verificationTier,
          isAdmin: user.isAdmin,
        },
        token,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate email or phone number',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked. Try again later.',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;

      // Lock after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await user.save({ validateBeforeSave: false });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Contact support.',
      });
    }

    // Check if suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${user.suspensionReason || 'Contact support'}`,
      });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verificationTier: user.verificationTier,
          isAdmin: user.isAdmin,
          adminLevel: user.adminLevel,
          adminPermissions: user.adminPermissions,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('farmerProfile', 'farmDetails verificationTier ratings')
//       .populate('warehouseOperatorProfile', 'name code location');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// @desc    Create admin (super_admin only)
// @route   POST /api/auth/create-admin
// @access  Private (super_admin)





// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     // Only populate if the field exists
//     if (user.farmerProfile) {
//       await user.populate('farmerProfile', 'farmDetails verificationTier ratings');
//     }
//     if (user.warehouseOperatorProfile) {
//       await user.populate('warehouseOperatorProfile', 'name code location');
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     console.error('getMe error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch user',
//     });
//   }
// };




// server/controllers/authController.js

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only populate if the field exists
    if (user.farmerProfile) {
      await user.populate('farmerProfile', 'farmDetails verificationTier ratings');
    }
    if (user.warehouseOperatorProfile) {
      await user.populate('warehouseOperatorProfile', 'name code location');
    }

    // Return consistent structure - same as login
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          verificationTier: user.verificationTier,
          isAdmin: user.isAdmin,
          adminLevel: user.adminLevel,
          adminPermissions: user.adminPermissions,
          warehouseOperatorProfile: user.warehouseOperatorProfile,
          farmerProfile: user.farmerProfile,
        },
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};





const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, adminLevel, adminPermissions } = req.body;

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'admin',
      adminLevel: adminLevel || 1,
      adminPermissions: adminPermissions || {
        canReviewListings: true,
        canManageWarehouses: false,
        canManageUsers: false,
        canProcessPayments: false,
        canResolveDisputes: false,
        canManageAdmins: false,
      },
      verificationTier: 'fully_verified',
      emailVerified: true,
      phoneVerified: true,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          adminLevel: user.adminLevel,
          adminPermissions: user.adminPermissions,
        },
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  createAdmin,
};