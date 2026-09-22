const Listing = require('../models/Listing');
const Commodity = require('../models/Commodity');
const CommodityType = require('../models/CommodityType');
const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');

// ============================================
// CREATE LISTING (any authenticated user)
// ============================================





const createListing = async (req, res) => {
  try {
    const user = req.user;
    const { commodityName, category, ...rest } = req.body;

    console.log('Create listing request from:', user.role, user._id);
    console.log('Request body:', req.body);

    if (!commodityName || !category) {
      return res.status(400).json({ success: false, message: 'Commodity name and category are required' });
    }

    // Find or create the commodity type
    const slug = commodityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let commodityType = await CommodityType.findOne({ slug });

    if (!commodityType) {
      commodityType = await CommodityType.create({
        name: commodityName.trim(),
        category,
        defaultUnit: req.body.quantity?.unit || 'bag',
      });
      console.log('Created new commodity type:', commodityType.name);
    }

    const isAutoApproved = ['admin', 'super_admin', 'warehouse_operator'].includes(user.role);

    const listingData = {
      ...rest, // This includes images, quantity, expectedPrice, currentLocation, farmDetails, notes, warehouseId
      sourceType: user.role === 'warehouse_operator' ? 'warehouse' : user.role,
      createdBy: user._id,
      commodityType: commodityType._id,
      status: isAutoApproved ? 'auto_approved' : 'pending_review',
      submittedAt: new Date(),
    };

    // For warehouse operator - auto-assign to their warehouse
    if (user.role === 'warehouse_operator' && user.warehouseOperatorProfile) {
      listingData.sourceWarehouse = user.warehouseOperatorProfile;
      listingData.assignedWarehouse = user.warehouseOperatorProfile;
      listingData.assignedAt = new Date();
      listingData.assignedBy = user._id;
      listingData.status = 'assigned_to_warehouse';
      console.log('Warehouse operator listing - assigned to warehouse:', user.warehouseOperatorProfile);
    }

    // For admin - assign warehouse if provided
    if (['admin', 'super_admin'].includes(user.role) && req.body.warehouseId) {
      const warehouse = await Warehouse.findById(req.body.warehouseId);
      if (warehouse) {
        listingData.assignedWarehouse = warehouse._id;
        listingData.assignedAt = new Date();
        listingData.assignedBy = user._id;
        listingData.status = 'assigned_to_warehouse';
        console.log('Admin listing - assigned to warehouse:', warehouse._id);
      }
    }

    const listing = await Listing.create(listingData);
    console.log('Created listing:', listing._id, 'with status:', listing.status);

    const populated = await Listing.findById(listing._id)
      .populate('commodityType', 'name emoji slug category defaultUnit')
      .populate('createdBy', 'firstName lastName email role')
      .populate('assignedWarehouse', 'name code location');

    res.status(201).json({
      success: true,
      message: isAutoApproved
        ? 'Listing created successfully. Awaiting warehouse verification.'
        : 'Listing submitted for review.',
      data: populated,
    });
  } catch (error) {
    console.error('Create listing error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};




// const createListing = async (req, res) => {
//   try {
//     const user = req.user;
//     const { commodityName, category, ...rest } = req.body;

//     console.log('Create listing request from:', user.role, user._id);
//     console.log('Request body:', req.body);

//     if (!commodityName || !category) {
//       return res.status(400).json({ success: false, message: 'Commodity name and category are required' });
//     }

//     // Find or create the commodity type
//     const slug = commodityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
//     let commodityType = await CommodityType.findOne({ slug });

//     if (!commodityType) {
//       commodityType = await CommodityType.create({
//         name: commodityName.trim(),
//         category,
//         defaultUnit: req.body.quantity?.unit || 'bag',
//       });
//       console.log('Created new commodity type:', commodityType.name);
//     }

//     const isAutoApproved = ['admin', 'super_admin', 'warehouse_operator'].includes(user.role);

//     const listingData = {
//       sourceType: user.role === 'warehouse_operator' ? 'warehouse' : user.role,
//       createdBy: user._id,
//       commodityType: commodityType._id,
//       quantity: req.body.quantity,
//       expectedPrice: req.body.expectedPrice,
//       currentLocation: req.body.currentLocation,
//       farmDetails: user.role === 'farmer' ? req.body.farmDetails : undefined,
//       notes: req.body.notes,
//       status: isAutoApproved ? 'auto_approved' : 'pending_review',
//       submittedAt: new Date(),
//     };

//     // For warehouse operator - auto-assign to their warehouse
//     if (user.role === 'warehouse_operator' && user.warehouseOperatorProfile) {
//       listingData.sourceWarehouse = user.warehouseOperatorProfile;
//       listingData.assignedWarehouse = user.warehouseOperatorProfile;
//       listingData.assignedAt = new Date();
//       listingData.assignedBy = user._id;
//       listingData.status = 'assigned_to_warehouse';
//       console.log('Warehouse operator listing - assigned to warehouse:', user.warehouseOperatorProfile);
//     }

//     // For admin - assign warehouse if provided
//     if (['admin', 'super_admin'].includes(user.role) && req.body.warehouseId) {
//       const warehouse = await Warehouse.findById(req.body.warehouseId);
//       if (warehouse) {
//         listingData.assignedWarehouse = warehouse._id;
//         listingData.assignedAt = new Date();
//         listingData.assignedBy = user._id;
//         listingData.status = 'assigned_to_warehouse';
//         console.log('Admin listing - assigned to warehouse:', warehouse._id);
//       }
//     }

//     const listing = await Listing.create(listingData);
//     console.log('Created listing:', listing._id, 'with status:', listing.status);

//     const populated = await Listing.findById(listing._id)
//       .populate('commodityType', 'name emoji slug category defaultUnit')
//       .populate('createdBy', 'firstName lastName email role')
//       .populate('assignedWarehouse', 'name code location');

//     res.status(201).json({
//       success: true,
//       message: isAutoApproved
//         ? 'Listing created successfully. Awaiting warehouse verification.'
//         : 'Listing submitted for review.',
//       data: populated,
//     });
//   } catch (error) {
//     console.error('Create listing error:', error);
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({ success: false, message: messages.join(', ') });
//     }
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// ============================================
// GET MY LISTINGS (any authenticated user)
// ============================================
const getMyListings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const queryObj = { createdBy: req.user._id };
    if (status) queryObj.status = status;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      Listing.find(queryObj)
        .populate('commodityType', 'name emoji slug category defaultUnit')
        .populate('assignedWarehouse', 'name code location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: listings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: GET PENDING REVIEW
// ============================================
const getPendingReview = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const queryObj = { status: 'pending_review', sourceType: 'farmer' };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      Listing.find(queryObj)
        .populate('createdBy', 'firstName lastName email phone')
        .populate('commodityType', 'name emoji slug category')
        .sort({ submittedAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: listings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET LISTINGS AWAITING WAREHOUSE
// ============================================
const getAwaitingWarehouse = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('WAREHOUSE QUEUE REQUEST');
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user._id);
    console.log('Warehouse profile:', req.user.warehouseOperatorProfile);
    console.log('='.repeat(50));

    const queryObj = {
      status: { $in: ['auto_approved', 'approved', 'assigned_to_warehouse', 'received_at_warehouse'] },
    };

    // Only filter by warehouse for warehouse_operator role
    if (req.user.role === 'warehouse_operator') {
      if (req.user.warehouseOperatorProfile) {
        queryObj.assignedWarehouse = req.user.warehouseOperatorProfile;
      } else {
        console.log('Warehouse operator has no warehouse assigned');
        return res.status(200).json({ 
          success: true, 
          count: 0, 
          data: [],
          message: 'No warehouse assigned to your account'
        });
      }
    }
    // Admin and super_admin see ALL listings awaiting warehouse

    console.log('Query:', JSON.stringify(queryObj, null, 2));

    const listings = await Listing.find(queryObj)
      .populate('commodityType', 'name emoji slug')
      .populate('createdBy', 'firstName lastName role')
      .populate('assignedWarehouse', 'name code')
      .sort({ submittedAt: 1 })
      .lean();

    console.log('Found listings:', listings.length);
    listings.forEach(l => {
      console.log(`- ${l.commodityType?.name} | Status: ${l.status} | Warehouse: ${l.assignedWarehouse?.name || 'None'}`);
    });

    res.status(200).json({ 
      success: true, 
      count: listings.length, 
      data: listings 
    });
  } catch (error) {
    console.error('getAwaitingWarehouse error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET SINGLE LISTING
// ============================================
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email phone role')
      .populate('commodityType', 'name emoji slug category defaultUnit')
      .populate('assignedWarehouse', 'name code location capacity services')
      .populate('reviewedBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .populate('warehouseVerification.receivedBy', 'firstName lastName');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: APPROVE LISTING
// ============================================
const approveListing = async (req, res) => {
  try {
    const { warehouseId, notes } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ success: false, message: 'Please assign a warehouse' });
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.status !== 'pending_review') {
      return res.status(400).json({ success: false, message: `Listing status is "${listing.status}" — cannot approve` });
    }

    listing.status = 'assigned_to_warehouse';
    listing.reviewedBy = req.user._id;
    listing.reviewedAt = new Date();
    listing.reviewNotes = notes || 'Approved';
    listing.assignedWarehouse = warehouseId;
    listing.assignedBy = req.user._id;
    listing.assignedAt = new Date();

    await listing.save();

    const populated = await Listing.findById(listing._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('commodityType', 'name emoji')
      .populate('assignedWarehouse', 'name code location');

    res.status(200).json({
      success: true,
      message: 'Listing approved and assigned to warehouse',
      data: populated,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: REJECT LISTING
// ============================================
const rejectListing = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please provide a rejection reason' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    listing.status = 'rejected';
    listing.reviewedBy = req.user._id;
    listing.reviewedAt = new Date();
    listing.rejectionReason = reason;

    await listing.save();

    res.status(200).json({ success: true, message: 'Listing rejected', data: listing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// WAREHOUSE: RECEIVE GOODS
// ============================================
const receiveAtWarehouse = async (req, res) => {
  try {
    const { receivedQuantity, notes } = req.body;

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (!['assigned_to_warehouse', 'auto_approved', 'approved'].includes(listing.status)) {
      return res.status(400).json({ success: false, message: `Cannot receive listing with status "${listing.status}"` });
    }

    listing.status = 'received_at_warehouse';
    listing.warehouseVerification = {
      ...listing.warehouseVerification,
      receivedBy: req.user._id,
      receivedAt: new Date(),
      receivedQuantity: receivedQuantity || listing.quantity.amount,
    };

    if (notes) {
      listing.adminNotes.push({
        note: `Received at warehouse: ${notes}`,
        addedBy: req.user._id,
        addedAt: new Date(),
      });
    }

    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Goods received at warehouse',
      data: listing,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================
// WAREHOUSE: COMPLETE QA & PUSH TO MARKET
// ============================================
const completeQA = async (req, res) => {
  try {
    const { gradeAssigned, moistureContent, foreignMatter, pestInfestation, qualityNotes, passed, finalPrice } = req.body;

    const listing = await Listing.findById(req.params.id)
      .populate('commodityType')
      .populate('createdBy')
      .populate('assignedWarehouse');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.status !== 'received_at_warehouse') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot QA listing with status "${listing.status}". Must be "received_at_warehouse".` 
      });
    }

    listing.warehouseVerification = {
      ...listing.warehouseVerification,
      gradeAssigned: gradeAssigned || 'B',
      moistureContent: moistureContent || undefined,
      foreignMatter: foreignMatter || undefined,
      pestInfestation: pestInfestation || false,
      qualityNotes: qualityNotes || '',
      passed: passed !== false,
    };

    if (finalPrice && finalPrice.amount) {
      listing.finalPrice = {
        amount: Number(finalPrice.amount),
        perUnit: finalPrice.perUnit || listing.expectedPrice.perUnit,
      };
    }

    if (passed !== false) {
      const commodityTypeName = listing.commodityType?.name || 'Unknown';
      const sellerName = listing.sourceType === 'warehouse' && listing.assignedWarehouse
        ? listing.assignedWarehouse.name
        : listing.createdBy
          ? `${listing.createdBy.firstName} ${listing.createdBy.lastName}`
          : 'Elber Market';

      const commodityData = {
        listingId: listing._id,
        commodityType: listing.commodityType?._id,
        name: commodityTypeName,
        grade: gradeAssigned || 'B',
        quantity: {
          amount: listing.warehouseVerification.receivedQuantity || listing.quantity.amount,
          unit: listing.quantity.unit,
        },
        price: listing.finalPrice || {
          amount: listing.expectedPrice.amount,
          perUnit: listing.expectedPrice.perUnit,
          negotiable: listing.expectedPrice.negotiable,
        },
        location: {
          state: listing.assignedWarehouse?.location?.state || listing.currentLocation.state,
          lga: listing.assignedWarehouse?.location?.lga || listing.currentLocation.lga,
          community: listing.assignedWarehouse?.location?.community || listing.currentLocation.community,
          locationType: 'warehouse',
          warehouseId: listing.assignedWarehouse?._id || null,
        },
        harvestDate: listing.farmDetails?.harvestDate || undefined,
        moistureContent: moistureContent || listing.farmDetails?.moistureContent || undefined,
        seller: {
          sellerType: listing.sourceType,
          sellerId: listing.createdBy?._id,
          name: sellerName,
          verificationTier: listing.sourceType === 'farmer' ? 'verified' : 'trusted',
        },
        qualityCertification: {
          hasCertification: true,
          certifyingBody: 'Elber Market QA',
          warehouseReceiptNumber: listing.warehouseVerification.warehouseReceiptNumber || undefined,
        },
        minimumOrder: Math.max(1, Math.floor((listing.warehouseVerification.receivedQuantity || listing.quantity.amount) * 0.01)),
        sourceType: listing.sourceType,
        sourceListing: listing._id,
        images: listing.images || [],
      };

      try {
        const commodity = await Commodity.create(commodityData);
        listing.status = 'live';
        listing.liveCommodityId = commodity._id;
        listing.wentLiveAt = new Date();

        const receivedQty = listing.warehouseVerification.receivedQuantity || listing.quantity.amount;
        await WarehouseInventory.create({
          warehouse: listing.assignedWarehouse?._id,
          commodity: commodity._id,
          commodityName: commodityTypeName,
          grade: gradeAssigned || 'B',
          sectionId: 'MAIN',
          sectionName: 'Main Storage',
          quantityReceived: {
            amount: receivedQty,
            unit: listing.quantity.unit,
          },
          quantityReleased: 0,
          quantityAvailable: receivedQty,
          owner: {
            ownerType: listing.sourceType === 'farmer' ? 'farmer' : 'elba_market',
            ownerId: listing.createdBy?._id,
            ownerName: sellerName,
          },
          receiptNumber: listing.warehouseVerification.warehouseReceiptNumber || `RCP-${Date.now()}`,
          qualityCheck: {
            inspectedBy: req.user._id,
            inspectionDate: new Date(),
            moistureContent: moistureContent || undefined,
            foreignMatter: foreignMatter || undefined,
            pestInfestation: pestInfestation || false,
            notes: qualityNotes || '',
            gradeAssigned: gradeAssigned || 'B',
            passed: true,
          },
          status: 'in_storage',
          storageStartDate: new Date(),
        });

        console.log(`Commodity created: ${commodity._id} - ${commodityData.name}`);
      } catch (commodityError) {
        console.error('Failed to create commodity:', commodityError);
        return res.status(500).json({
          success: false,
          message: 'QA passed but failed to create market listing: ' + commodityError.message,
        });
      }
    } else {
      listing.status = 'qa_completed';
    }

    listing.adminNotes.push({
      note: `QA ${passed !== false ? 'passed' : 'failed'}. Grade: ${gradeAssigned || 'B'}. ${qualityNotes || ''}`,
      addedBy: req.user._id,
      addedAt: new Date(),
    });

    await listing.save();
 
    res.status(200).json({
      success: true,
      message: passed !== false ? 'QA passed — listing is now live on market' : 'QA completed — listing did not pass',
      data: listing,
    });
  } catch (error) {
    console.error('completeQA error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: GET STATS
// ============================================
const getListingStats = async (req, res) => {
  try {
    const [
      pending, autoApproved, inProgress, rejected,
      readyForMarket, live, sold, total,
    ] = await Promise.all([
      Listing.countDocuments({ status: 'pending_review' }),
      Listing.countDocuments({ status: 'auto_approved' }),
      Listing.countDocuments({ status: { $in: ['approved', 'assigned_to_warehouse', 'received_at_warehouse', 'qa_completed'] } }),
      Listing.countDocuments({ status: 'rejected' }),
      Listing.countDocuments({ status: 'ready_for_market' }),
      Listing.countDocuments({ status: 'live' }),
      Listing.countDocuments({ status: 'sold' }),
      Listing.countDocuments({}),
    ]);

    const bySource = await Listing.aggregate([
      { $group: { _id: '$sourceType', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        autoApproved,
        inProgress,
        rejected,
        readyForMarket,
        live,
        sold,
        total,
        bySource,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ADMIN: GET ALL LISTINGS
// ============================================
const getAllListings = async (req, res) => {
  try {
    const { status, sourceType, page = 1, limit = 20 } = req.query;
    const queryObj = {};
    if (status) queryObj.status = status;
    if (sourceType) queryObj.sourceType = sourceType;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      Listing.find(queryObj)
        .populate('createdBy', 'firstName lastName email role')
        .populate('commodityType', 'name emoji slug')
        .populate('assignedWarehouse', 'name code')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(queryObj),
    ]);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: listings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE LISTING
// ============================================
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Listing not found' 
      });
    }

    const isOwner = listing.createdBy.toString() === req.user._id.toString();
    const isAdminUser = ['admin', 'super_admin'].includes(req.user.role);
    
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this listing' 
      });
    }

    // Delete associated live commodity
    if (listing.liveCommodityId) {
      await Commodity.findByIdAndDelete(listing.liveCommodityId);
      console.log('Deleted associated commodity:', listing.liveCommodityId);
    }

    // Delete commodities referencing this listing
    await Commodity.deleteMany({ listingId: listing._id });
    await Commodity.deleteMany({ sourceListing: listing._id });

    // Delete warehouse inventory
    if (listing.assignedWarehouse) {
      await WarehouseInventory.deleteMany({
        warehouse: listing.assignedWarehouse,
        $or: [
          { commodity: listing.liveCommodityId },
          { commodity: listing._id }
        ]
      });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Listing and all associated records deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createListing,
  getMyListings,
  getPendingReview,
  getAwaitingWarehouse,
  getListingById,
  approveListing,
  rejectListing,
  receiveAtWarehouse,
  completeQA,
  getListingStats,
  getAllListings,
  deleteListing,
};


















































































































































































// // server/controllers/listingController.js
// const Listing = require('../models/Listing');
// const Commodity = require('../models/Commodity');
// const CommodityType = require('../models/CommodityType');
// const Warehouse = require('../models/Warehouse');
// const WarehouseInventory = require('../models/WarehouseInventory');

// // ============================================
// // CREATE LISTING (any authenticated user)
// // ============================================
// // const createListing = async (req, res) => {
// //   try {
// //     const user = req.user;
// //     const isAutoApproved = ['admin', 'super_admin', 'warehouse_operator'].includes(user.role);

// //     // Get commodity type to validate and get name
// //     const commodityType = await CommodityType.findById(req.body.commodityType);
// //     if (!commodityType) {
// //       return res.status(400).json({ success: false, message: 'Invalid commodity type' });
// //     }

// //     // Build listing data
// //     const listingData = {
// //       sourceType: user.role === 'warehouse_operator' ? 'warehouse' : user.role,
// //       createdBy: user._id,
// //       commodityType: commodityType._id,
// //       quantity: req.body.quantity,
// //       expectedPrice: req.body.expectedPrice,
// //       currentLocation: req.body.currentLocation,
// //       farmDetails: user.role === 'farmer' ? req.body.farmDetails : undefined,
// //       notes: req.body.notes,
// //       status: isAutoApproved ? 'auto_approved' : 'pending_review',
// //       submittedAt: new Date(),
// //     };

// //     // Warehouse operator: auto-assign to their warehouse
// //     if (user.role === 'warehouse_operator' && user.warehouseOperatorProfile) {
// //       listingData.sourceWarehouse = user.warehouseOperatorProfile;
// //       listingData.assignedWarehouse = user.warehouseOperatorProfile;
// //       listingData.assignedAt = new Date();
// //       listingData.assignedBy = user._id;
// //       listingData.status = 'assigned_to_warehouse';
// //     }

// //     // Admin: assign warehouse if provided
// //     if (['admin', 'super_admin'].includes(user.role) && req.body.warehouseId) {
// //       const warehouse = await Warehouse.findById(req.body.warehouseId);
// //       if (warehouse) {
// //         listingData.assignedWarehouse = warehouse._id;
// //         listingData.assignedAt = new Date();
// //         listingData.assignedBy = user._id;
// //         listingData.status = 'assigned_to_warehouse';
// //       }
// //     }

// //     const listing = await Listing.create(listingData);

// //     const populated = await Listing.findById(listing._id)
// //       .populate('commodityType', 'name emoji slug category defaultUnit')
// //       .populate('createdBy', 'firstName lastName email role')
// //       .populate('assignedWarehouse', 'name code location');

// //     res.status(201).json({
// //       success: true,
// //       message: isAutoApproved
// //         ? 'Listing created successfully. Awaiting warehouse verification.'
// //         : 'Listing submitted for review.',
// //       data: populated,
// //     });
// //   } catch (error) {
// //     if (error.name === 'ValidationError') {
// //       const messages = Object.values(error.errors).map((err) => err.message);
// //       return res.status(400).json({ success: false, message: messages.join(', ') });
// //     }
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };




// const createListing = async (req, res) => {
//   try {
//     const user = req.user;
//     const { commodityName, category, ...rest } = req.body;

//     if (!commodityName || !category) {
//       return res.status(400).json({ success: false, message: 'Commodity name and category are required' });
//     }

//     // Find or create the commodity type
//     const slug = commodityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
//     let commodityType = await CommodityType.findOne({ slug });

//     if (!commodityType) {
//       commodityType = await CommodityType.create({
//         name: commodityName.trim(),
//         category,
//         defaultUnit: req.body.quantity?.unit || 'bag',
//       });
//     }

//     const isAutoApproved = ['admin', 'super_admin', 'warehouse_operator'].includes(user.role);

//     const listingData = {
//       sourceType: user.role === 'warehouse_operator' ? 'warehouse' : user.role,
//       createdBy: user._id,
//       commodityType: commodityType._id,
//       quantity: req.body.quantity,
//       expectedPrice: req.body.expectedPrice,
//       currentLocation: req.body.currentLocation,
//       farmDetails: user.role === 'farmer' ? req.body.farmDetails : undefined,
//       notes: req.body.notes,
//       status: isAutoApproved ? 'auto_approved' : 'pending_review',
//       submittedAt: new Date(),
//     };

//     if (user.role === 'warehouse_operator' && user.warehouseOperatorProfile) {
//       listingData.sourceWarehouse = user.warehouseOperatorProfile;
//       listingData.assignedWarehouse = user.warehouseOperatorProfile;
//       listingData.assignedAt = new Date();
//       listingData.assignedBy = user._id;
//       listingData.status = 'assigned_to_warehouse';
//     }

//     if (['admin', 'super_admin'].includes(user.role) && req.body.warehouseId) {
//       const warehouse = await Warehouse.findById(req.body.warehouseId);
//       if (warehouse) {
//         listingData.assignedWarehouse = warehouse._id;
//         listingData.assignedAt = new Date();
//         listingData.assignedBy = user._id;
//         listingData.status = 'assigned_to_warehouse';
//       }
//     }

//     const listing = await Listing.create(listingData);

//     const populated = await Listing.findById(listing._id)
//       .populate('commodityType', 'name emoji slug category defaultUnit')
//       .populate('createdBy', 'firstName lastName email role')
//       .populate('assignedWarehouse', 'name code location');

//     res.status(201).json({
//       success: true,
//       message: isAutoApproved
//         ? 'Listing created successfully. Awaiting warehouse verification.'
//         : 'Listing submitted for review.',
//       data: populated,
//     });
//   } catch (error) {
//     if (error.name === 'ValidationError') {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({ success: false, message: messages.join(', ') });
//     }
//     res.status(500).json({ success: false, message: error.message });
//   }
// };







// // ============================================
// // GET MY LISTINGS (any authenticated user)
// // ============================================
// const getMyListings = async (req, res) => {
//   try {
//     const { status, page = 1, limit = 20 } = req.query;
//     const queryObj = { createdBy: req.user._id };
//     if (status) queryObj.status = status;

//     const pageNum = Math.max(1, Number(page));
//     const limitNum = Math.min(50, Number(limit));
//     const skip = (pageNum - 1) * limitNum;

//     const [listings, total] = await Promise.all([
//       Listing.find(queryObj)
//         .populate('commodityType', 'name emoji slug category defaultUnit')
//         .populate('assignedWarehouse', 'name code location')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limitNum)
//         .lean(),
//       Listing.countDocuments(queryObj),
//     ]);

//     res.status(200).json({
//       success: true,
//       count: listings.length,
//       total,
//       totalPages: Math.ceil(total / limitNum),
//       currentPage: pageNum,
//       data: listings,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ============================================
// // ADMIN: GET PENDING REVIEW
// // ============================================
// const getPendingReview = async (req, res) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const queryObj = { status: 'pending_review', sourceType: 'farmer' };

//     const pageNum = Math.max(1, Number(page));
//     const limitNum = Math.min(50, Number(limit));
//     const skip = (pageNum - 1) * limitNum;

//     const [listings, total] = await Promise.all([
//       Listing.find(queryObj)
//         .populate('createdBy', 'firstName lastName email phone')
//         .populate('commodityType', 'name emoji slug category')
//         .sort({ submittedAt: 1 })
//         .skip(skip)
//         .limit(limitNum)
//         .lean(),
//       Listing.countDocuments(queryObj),
//     ]);

//     res.status(200).json({
//       success: true,
//       count: listings.length,
//       total,
//       totalPages: Math.ceil(total / limitNum),
//       currentPage: pageNum,
//       data: listings,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ============================================
// // ADMIN: GET LISTINGS AWAITING WAREHOUSE
// // ============================================
// // const getAwaitingWarehouse = async (req, res) => {
// //   try {
// //     const queryObj = {
// //       status: { $in: ['auto_approved', 'approved', 'assigned_to_warehouse', 'received_at_warehouse'] },
// //     };

// //     if (req.user.role === 'warehouse_operator' && req.user.warehouseOperatorProfile) {
// //       queryObj.assignedWarehouse = req.user.warehouseOperatorProfile;
// //     }

// //     const listings = await Listing.find(queryObj)
// //       .populate('commodityType', 'name emoji slug')
// //       .populate('createdBy', 'firstName lastName role')
// //       .populate('assignedWarehouse', 'name code')
// //       .sort({ submittedAt: 1 })
// //       .lean();

// //     res.status(200).json({ success: true, count: listings.length, data: listings });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };







// // ============================================
// // GET LISTINGS AWAITING WAREHOUSE
// // ============================================
// // const getAwaitingWarehouse = async (req, res) => {
// //   try {
// //     // Log for debugging
// //     console.log('Warehouse queue request from user:', req.user._id, req.user.role);
// //     console.log('Warehouse profile:', req.user.warehouseOperatorProfile);

// //     const queryObj = {
// //       status: { $in: ['auto_approved', 'approved', 'assigned_to_warehouse', 'received_at_warehouse'] },
// //     };

// //     // If warehouse operator, filter by their assigned warehouse
// //     if (req.user.role === 'warehouse_operator') {
// //       if (req.user.warehouseOperatorProfile) {
// //         queryObj.assignedWarehouse = req.user.warehouseOperatorProfile;
// //       } else {
// //         // If no warehouse assigned, return empty
// //         return res.status(200).json({ 
// //           success: true, 
// //           count: 0, 
// //           data: [],
// //           message: 'No warehouse assigned to your account'
// //         });
// //       }
// //     }
// //     // If admin/super_admin, they can see all listings awaiting warehouse
// //     // Don't filter by assignedWarehouse for admins

// //     const listings = await Listing.find(queryObj)
// //       .populate('commodityType', 'name emoji slug')
// //       .populate('createdBy', 'firstName lastName role')
// //       .populate('assignedWarehouse', 'name code')
// //       .sort({ submittedAt: 1 })
// //       .lean();

// //     console.log('Found listings:', listings.length);

// //     res.status(200).json({ 
// //       success: true, 
// //       count: listings.length, 
// //       data: listings 
// //     });
// //   } catch (error) {
// //     console.error('getAwaitingWarehouse error:', error);
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };










// const getAwaitingWarehouse = async (req, res) => {
//   try {
//     const queryObj = {
//       status: { $in: ['auto_approved', 'approved', 'assigned_to_warehouse', 'received_at_warehouse'] },
//     };

//     // Only filter by warehouse for warehouse_operator role
//     if (req.user.role === 'warehouse_operator') {
//       if (req.user.warehouseOperatorProfile) {
//         queryObj.assignedWarehouse = req.user.warehouseOperatorProfile;
//       } else {
//         return res.status(200).json({ 
//           success: true, 
//           count: 0, 
//           data: [] 
//         });
//       }
//     }
//     // Admin and super_admin see ALL listings awaiting warehouse

//     const listings = await Listing.find(queryObj)
//       .populate('commodityType', 'name emoji slug')
//       .populate('createdBy', 'firstName lastName role')
//       .populate('assignedWarehouse', 'name code')
//       .sort({ submittedAt: 1 })
//       .lean();
 
//     res.status(200).json({ 
//       success: true, 
//       count: listings.length, 
//       data: listings 
//     });
//   } catch (error) {
//     console.error('getAwaitingWarehouse error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };











// // ============================================
// // GET SINGLE LISTING
// // ============================================
// const getListingById = async (req, res) => {
//   try {
//     const listing = await Listing.findById(req.params.id)
//       .populate('createdBy', 'firstName lastName email phone role')
//       .populate('commodityType', 'name emoji slug category defaultUnit')
//       .populate('assignedWarehouse', 'name code location capacity services')
//       .populate('reviewedBy', 'firstName lastName')
//       .populate('assignedBy', 'firstName lastName')
//       .populate('warehouseVerification.receivedBy', 'firstName lastName');

//     if (!listing) {
//       return res.status(404).json({ success: false, message: 'Listing not found' });
//     }

//     res.status(200).json({ success: true, data: listing });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ============================================
// // ADMIN: APPROVE LISTING
// // ============================================
// const approveListing = async (req, res) => {
//   try {
//     const { warehouseId, notes } = req.body;

//     if (!warehouseId) {
//       return res.status(400).json({ success: false, message: 'Please assign a warehouse' });
//     }

//     const warehouse = await Warehouse.findById(warehouseId);
//     if (!warehouse) {
//       return res.status(404).json({ success: false, message: 'Warehouse not found' });
//     }

//     const listing = await Listing.findById(req.params.id);
//     if (!listing) {
//       return res.status(404).json({ success: false, message: 'Listing not found' });
//     }

//     if (listing.status !== 'pending_review') {
//       return res.status(400).json({ success: false, message: `Listing status is "${listing.status}" — cannot approve` });
//     }

//     listing.status = 'assigned_to_warehouse';
//     listing.reviewedBy = req.user._id;
//     listing.reviewedAt = new Date();
//     listing.reviewNotes = notes || 'Approved';
//     listing.assignedWarehouse = warehouseId;
//     listing.assignedBy = req.user._id;
//     listing.assignedAt = new Date();

//     await listing.save();

//     const populated = await Listing.findById(listing._id)
//       .populate('createdBy', 'firstName lastName email')
//       .populate('commodityType', 'name emoji')
//       .populate('assignedWarehouse', 'name code location');

//     res.status(200).json({
//       success: true,
//       message: 'Listing approved and assigned to warehouse',
//       data: populated,
//     });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // ============================================
// // ADMIN: REJECT LISTING
// // ============================================
// const rejectListing = async (req, res) => {
//   try {
//     const { reason } = req.body;
//     if (!reason) {
//       return res.status(400).json({ success: false, message: 'Please provide a rejection reason' });
//     }

//     const listing = await Listing.findById(req.params.id);
//     if (!listing) {
//       return res.status(404).json({ success: false, message: 'Listing not found' });
//     }

//     listing.status = 'rejected';
//     listing.reviewedBy = req.user._id;
//     listing.reviewedAt = new Date();
//     listing.rejectionReason = reason;

//     await listing.save();

//     res.status(200).json({ success: true, message: 'Listing rejected', data: listing });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // ============================================
// // WAREHOUSE: RECEIVE GOODS
// // ============================================
// const receiveAtWarehouse = async (req, res) => {
//   try {
//     const { receivedQuantity, notes } = req.body;

//     const listing = await Listing.findById(req.params.id);
//     if (!listing) {
//       return res.status(404).json({ success: false, message: 'Listing not found' });
//     }

//     if (!['assigned_to_warehouse', 'auto_approved', 'approved'].includes(listing.status)) {
//       return res.status(400).json({ success: false, message: `Cannot receive listing with status "${listing.status}"` });
//     }

//     listing.status = 'received_at_warehouse';
//     listing.warehouseVerification = {
//       ...listing.warehouseVerification,
//       receivedBy: req.user._id,
//       receivedAt: new Date(),
//       receivedQuantity: receivedQuantity || listing.quantity.amount,
//     };

//     if (notes) {
//       listing.adminNotes.push({
//         note: `Received at warehouse: ${notes}`,
//         addedBy: req.user._id,
//         addedAt: new Date(),
//       });
//     }

//     await listing.save();

//     res.status(200).json({
//       success: true,
//       message: 'Goods received at warehouse',
//       data: listing,
//     });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // ============================================
// // WAREHOUSE: COMPLETE QA & PUSH TO MARKET
// // ============================================
// // const completeQA = async (req, res) => {
// //   try {
// //     const { gradeAssigned, moistureContent, foreignMatter, pestInfestation, qualityNotes, passed, finalPrice } = req.body;

// //     const listing = await Listing.findById(req.params.id)
// //       .populate('commodityType')
// //       .populate('createdBy')
// //       .populate('assignedWarehouse');

// //     if (!listing) {
// //       return res.status(404).json({ success: false, message: 'Listing not found' });
// //     }

// //     if (listing.status !== 'received_at_warehouse') {
// //       return res.status(400).json({ success: false, message: 'Must receive goods before QA' });
// //     }

// //     // Update listing with QA results
// //     listing.warehouseVerification = {
// //       ...listing.warehouseVerification,
// //       gradeAssigned: gradeAssigned || 'B',
// //       moistureContent,
// //       foreignMatter,
// //       pestInfestation: pestInfestation || false,
// //       qualityNotes,
// //       passed: passed !== false,
// //     };

// //     if (finalPrice) {
// //       listing.finalPrice = finalPrice;
// //     }

// //     if (passed !== false) {
// //       listing.status = 'ready_for_market';

// //       // Create the live Commodity on market
// //       const commodityData = {
// //         listingId: listing._id,
// //         commodityType: listing.commodityType._id,
// //         name: listing.commodityType.name,
// //         grade: gradeAssigned || 'B',
// //         quantity: {
// //           amount: listing.warehouseVerification.receivedQuantity || listing.quantity.amount,
// //           unit: listing.quantity.unit,
// //         },
// //         price: finalPrice || {
// //           amount: listing.expectedPrice.amount,
// //           perUnit: listing.expectedPrice.perUnit,
// //           negotiable: listing.expectedPrice.negotiable,
// //         },
// //         location: {
// //           state: listing.assignedWarehouse?.location?.state || listing.currentLocation.state,
// //           lga: listing.assignedWarehouse?.location?.lga || listing.currentLocation.lga,
// //           community: listing.assignedWarehouse?.location?.community || listing.currentLocation.community,
// //           locationType: 'warehouse',
// //           warehouseId: listing.assignedWarehouse?._id,
// //         },
// //         harvestDate: listing.farmDetails?.harvestDate,
// //         moistureContent: moistureContent || listing.farmDetails?.moistureContent,
// //         seller: {
// //           sellerType: listing.sourceType,
// //           sellerId: listing.createdBy._id,
// //           name: listing.sourceType === 'warehouse'
// //             ? listing.assignedWarehouse?.name || 'Elba Warehouse'
// //             : `${listing.createdBy.firstName} ${listing.createdBy.lastName}`,
// //           verificationTier: listing.sourceType === 'farmer' ? 'verified' : 'trusted',
// //         },
// //         qualityCertification: {
// //           hasCertification: true,
// //           certifyingBody: 'Elba Market QA',
// //           warehouseReceiptNumber: listing.warehouseVerification.warehouseReceiptNumber,
// //         },
// //         minimumOrder: Math.max(1, Math.floor(listing.quantity.amount * 0.01)),
// //         sourceType: listing.sourceType,
// //         sourceListing: listing._id,
// //       };

// //       const commodity = await Commodity.create(commodityData);

// //       listing.status = 'live';
// //       listing.liveCommodityId = commodity._id;
// //       listing.wentLiveAt = new Date();
// //     } else {
// //       listing.status = 'qa_completed';
// //     }

// //     await listing.save();

// //     res.status(200).json({
// //       success: true,
// //       message: passed !== false ? 'QA passed — listing is now live on market' : 'QA completed — listing did not pass',
// //       data: listing,
// //     });
// //   } catch (error) {
// //     res.status(400).json({ success: false, message: error.message });
// //   }
// // };








// // const completeQA = async (req, res) => {
// //   try {
// //     const { gradeAssigned, moistureContent, foreignMatter, pestInfestation, qualityNotes, passed, finalPrice } = req.body;

// //     const listing = await Listing.findById(req.params.id)
// //       .populate('commodityType')
// //       .populate('createdBy')
// //       .populate('assignedWarehouse');

// //     if (!listing) {
// //       return res.status(404).json({ success: false, message: 'Listing not found' });
// //     }

// //     if (listing.status !== 'received_at_warehouse') {
// //       return res.status(400).json({ 
// //         success: false, 
// //         message: `Cannot QA listing with status "${listing.status}". Must be "received_at_warehouse".` 
// //       });
// //     }

// //     // Update QA results
// //     listing.warehouseVerification = {
// //       ...listing.warehouseVerification,
// //       gradeAssigned: gradeAssigned || 'B',
// //       moistureContent: moistureContent || undefined,
// //       foreignMatter: foreignMatter || undefined,
// //       pestInfestation: pestInfestation || false,
// //       qualityNotes: qualityNotes || '',
// //       passed: passed !== false,
// //     };

// //     if (finalPrice && finalPrice.amount) {
// //       listing.finalPrice = {
// //         amount: Number(finalPrice.amount),
// //         perUnit: finalPrice.perUnit || listing.expectedPrice.perUnit,
// //       };
// //     }

// //     // If QA passed, create commodity and push to market
// //     if (passed !== false) {
// //       const commodityTypeName = listing.commodityType?.name || 'Unknown';
// //       const sellerName = listing.sourceType === 'warehouse' && listing.assignedWarehouse
// //         ? listing.assignedWarehouse.name
// //         : listing.createdBy
// //           ? `${listing.createdBy.firstName} ${listing.createdBy.lastName}`
// //           : 'Elba Market';

// //       const commodityData = {
// //         listingId: listing._id,
// //         commodityType: listing.commodityType?._id,
// //         name: commodityTypeName,
// //         grade: gradeAssigned || 'B',
// //         quantity: {
// //           amount: listing.warehouseVerification.receivedQuantity || listing.quantity.amount,
// //           unit: listing.quantity.unit,
// //         },
// //         price: listing.finalPrice || {
// //           amount: listing.expectedPrice.amount,
// //           perUnit: listing.expectedPrice.perUnit,
// //           negotiable: listing.expectedPrice.negotiable,
// //         },
// //         location: {
// //           state: listing.assignedWarehouse?.location?.state || listing.currentLocation.state,
// //           lga: listing.assignedWarehouse?.location?.lga || listing.currentLocation.lga,
// //           community: listing.assignedWarehouse?.location?.community || listing.currentLocation.community,
// //           locationType: 'warehouse',
// //           warehouseId: listing.assignedWarehouse?._id || null,
// //         },
// //         harvestDate: listing.farmDetails?.harvestDate || undefined,
// //         moistureContent: moistureContent || listing.farmDetails?.moistureContent || undefined,
// //         seller: {
// //           sellerType: listing.sourceType,
// //           sellerId: listing.createdBy?._id,
// //           name: sellerName,
// //           verificationTier: listing.sourceType === 'farmer' ? 'verified' : 'trusted',
// //         },
// //         qualityCertification: {
// //           hasCertification: true,
// //           certifyingBody: 'Elba Market QA',
// //           warehouseReceiptNumber: listing.warehouseVerification.warehouseReceiptNumber || undefined,
// //         },
// //         minimumOrder: Math.max(1, Math.floor((listing.warehouseVerification.receivedQuantity || listing.quantity.amount) * 0.01)),
// //         sourceType: listing.sourceType,
// //         sourceListing: listing._id,
// //       };

// //       try {
// //         const commodity = await Commodity.create(commodityData);
// //         listing.status = 'live';
// //         listing.liveCommodityId = commodity._id;
// //         listing.wentLiveAt = new Date();
        
// //         console.log(`Commodity created: ${commodity._id} - ${commodityData.name}`);
// //       } catch (commodityError) {
// //         console.error('Failed to create commodity:', commodityError);
// //         return res.status(500).json({
// //           success: false,
// //           message: 'QA passed but failed to create market listing: ' + commodityError.message,
// //         });
// //       }
// //     } else {
// //       listing.status = 'qa_completed';
// //     }

// //     listing.adminNotes.push({
// //       note: `QA ${passed !== false ? 'passed' : 'failed'}. Grade: ${gradeAssigned || 'B'}. ${qualityNotes || ''}`,
// //       addedBy: req.user._id,
// //       addedAt: new Date(),
// //     });

// //     await listing.save();
 
// //     res.status(200).json({
// //       success: true,
// //       message: passed !== false ? 'QA passed — listing is now live on market' : 'QA completed — listing did not pass',
// //       data: listing,
// //     });
// //   } catch (error) {
// //     console.error('completeQA error:', error);
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };






// const completeQA = async (req, res) => {
//   try {
//     const { gradeAssigned, moistureContent, foreignMatter, pestInfestation, qualityNotes, passed, finalPrice } = req.body;

//     const listing = await Listing.findById(req.params.id)
//       .populate('commodityType')
//       .populate('createdBy')
//       .populate('assignedWarehouse');

//     if (!listing) {
//       return res.status(404).json({ success: false, message: 'Listing not found' });
//     }

//     if (listing.status !== 'received_at_warehouse') {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Cannot QA listing with status "${listing.status}". Must be "received_at_warehouse".` 
//       });
//     }

//     // Update QA results
//     listing.warehouseVerification = {
//       ...listing.warehouseVerification,
//       gradeAssigned: gradeAssigned || 'B',
//       moistureContent: moistureContent || undefined,
//       foreignMatter: foreignMatter || undefined,
//       pestInfestation: pestInfestation || false,
//       qualityNotes: qualityNotes || '',
//       passed: passed !== false,
//     };

//     if (finalPrice && finalPrice.amount) {
//       listing.finalPrice = {
//         amount: Number(finalPrice.amount),
//         perUnit: finalPrice.perUnit || listing.expectedPrice.perUnit,
//       };
//     }

//     // If QA passed, create commodity and push to market
//     if (passed !== false) {
//       const commodityTypeName = listing.commodityType?.name || 'Unknown';
//       const sellerName = listing.sourceType === 'warehouse' && listing.assignedWarehouse
//         ? listing.assignedWarehouse.name
//         : listing.createdBy
//           ? `${listing.createdBy.firstName} ${listing.createdBy.lastName}`
//           : 'Elber Market';

//       const commodityData = {
//         listingId: listing._id,
//         commodityType: listing.commodityType?._id,
//         name: commodityTypeName,
//         grade: gradeAssigned || 'B',
//         quantity: {
//           amount: listing.warehouseVerification.receivedQuantity || listing.quantity.amount,
//           unit: listing.quantity.unit,
//         },
//         price: listing.finalPrice || {
//           amount: listing.expectedPrice.amount,
//           perUnit: listing.expectedPrice.perUnit,
//           negotiable: listing.expectedPrice.negotiable,
//         },
//         location: {
//           state: listing.assignedWarehouse?.location?.state || listing.currentLocation.state,
//           lga: listing.assignedWarehouse?.location?.lga || listing.currentLocation.lga,
//           community: listing.assignedWarehouse?.location?.community || listing.currentLocation.community,
//           locationType: 'warehouse',
//           warehouseId: listing.assignedWarehouse?._id || null,
//         },
//         harvestDate: listing.farmDetails?.harvestDate || undefined,
//         moistureContent: moistureContent || listing.farmDetails?.moistureContent || undefined,
//         seller: {
//           sellerType: listing.sourceType,
//           sellerId: listing.createdBy?._id,
//           name: sellerName,
//           verificationTier: listing.sourceType === 'farmer' ? 'verified' : 'trusted',
//         },
//         qualityCertification: {
//           hasCertification: true,
//           certifyingBody: 'Elber Market QA',
//           warehouseReceiptNumber: listing.warehouseVerification.warehouseReceiptNumber || undefined,
//         },
//         minimumOrder: Math.max(1, Math.floor((listing.warehouseVerification.receivedQuantity || listing.quantity.amount) * 0.01)),
//         sourceType: listing.sourceType,
//         sourceListing: listing._id,
//       };

//       try {
//         const commodity = await Commodity.create(commodityData);
//         listing.status = 'live';
//         listing.liveCommodityId = commodity._id;
//         listing.wentLiveAt = new Date();

//         // Create warehouse inventory record
//         const receivedQty = listing.warehouseVerification.receivedQuantity || listing.quantity.amount;
//         await WarehouseInventory.create({
//           warehouse: listing.assignedWarehouse?._id,
//           commodity: commodity._id,
//           commodityName: commodityTypeName,
//           grade: gradeAssigned || 'B',
//           sectionId: 'MAIN',
//           sectionName: 'Main Storage',
//           quantityReceived: {
//             amount: receivedQty,
//             unit: listing.quantity.unit,
//           },
//           quantityReleased: 0,
//           quantityAvailable: receivedQty,
//           owner: {
//             ownerType: listing.sourceType === 'farmer' ? 'farmer' : 'elba_market',
//             ownerId: listing.createdBy?._id,
//             ownerName: sellerName,
//           },
//           receiptNumber: listing.warehouseVerification.warehouseReceiptNumber || `RCP-${Date.now()}`,
//           qualityCheck: {
//             inspectedBy: req.user._id,
//             inspectionDate: new Date(),
//             moistureContent: moistureContent || undefined,
//             foreignMatter: foreignMatter || undefined,
//             pestInfestation: pestInfestation || false,
//             notes: qualityNotes || '',
//             gradeAssigned: gradeAssigned || 'B',
//             passed: true,
//           },
//           status: 'in_storage',
//           storageStartDate: new Date(),
//         });

//         console.log(`Commodity created: ${commodity._id} - ${commodityData.name}`);
//       } catch (commodityError) {
//         console.error('Failed to create commodity:', commodityError);
//         return res.status(500).json({
//           success: false,
//           message: 'QA passed but failed to create market listing: ' + commodityError.message,
//         });
//       }
//     } else {
//       listing.status = 'qa_completed';
//     }

//     listing.adminNotes.push({
//       note: `QA ${passed !== false ? 'passed' : 'failed'}. Grade: ${gradeAssigned || 'B'}. ${qualityNotes || ''}`,
//       addedBy: req.user._id,
//       addedAt: new Date(),
//     });

//     await listing.save();
 
//     res.status(200).json({
//       success: true,
//       message: passed !== false ? 'QA passed — listing is now live on market' : 'QA completed — listing did not pass',
//       data: listing,
//     });
//   } catch (error) {
//     console.error('completeQA error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



















// // ============================================
// // ADMIN: GET STATS
// // ============================================
// const getListingStats = async (req, res) => {
//   try {
//     const [
//       pending, autoApproved, inProgress, rejected,
//       readyForMarket, live, sold, total,
//     ] = await Promise.all([
//       Listing.countDocuments({ status: 'pending_review' }),
//       Listing.countDocuments({ status: 'auto_approved' }),
//       Listing.countDocuments({ status: { $in: ['approved', 'assigned_to_warehouse', 'received_at_warehouse', 'qa_completed'] } }),
//       Listing.countDocuments({ status: 'rejected' }),
//       Listing.countDocuments({ status: 'ready_for_market' }),
//       Listing.countDocuments({ status: 'live' }),
//       Listing.countDocuments({ status: 'sold' }),
//       Listing.countDocuments({}),
//     ]);

//     const bySource = await Listing.aggregate([
//       { $group: { _id: '$sourceType', count: { $sum: 1 } } },
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         pending,
//         autoApproved,
//         inProgress,
//         rejected,
//         readyForMarket,
//         live,
//         sold,
//         total,
//         bySource,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ============================================
// // ADMIN: GET ALL LISTINGS
// // ============================================
// const getAllListings = async (req, res) => {
//   try {
//     const { status, sourceType, page = 1, limit = 20 } = req.query;
//     const queryObj = {};
//     if (status) queryObj.status = status;
//     if (sourceType) queryObj.sourceType = sourceType;

//     const pageNum = Math.max(1, Number(page));
//     const limitNum = Math.min(50, Number(limit));
//     const skip = (pageNum - 1) * limitNum;

//     const [listings, total] = await Promise.all([
//       Listing.find(queryObj)
//         .populate('createdBy', 'firstName lastName email role')
//         .populate('commodityType', 'name emoji slug')
//         .populate('assignedWarehouse', 'name code')
//         .sort({ updatedAt: -1 })
//         .skip(skip)
//         .limit(limitNum)
//         .lean(),
//       Listing.countDocuments(queryObj),
//     ]);

//     res.status(200).json({
//       success: true,
//       count: listings.length,
//       total,
//       totalPages: Math.ceil(total / limitNum),
//       currentPage: pageNum,
//       data: listings,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };




// // ============================================
// // DELETE LISTING
// // ============================================
// // const deleteListing = async (req, res) => {
// //   try {
// //     const listing = await Listing.findById(req.params.id);

// //     if (!listing) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: 'Listing not found' 
// //       });
// //     }

// //     // Check if user owns this listing or is admin
// //     const isOwner = listing.createdBy.toString() === req.user._id.toString();
// //     const isAdminUser = ['admin', 'super_admin'].includes(req.user.role);
    
// //     if (!isOwner && !isAdminUser) {
// //       return res.status(403).json({ 
// //         success: false, 
// //         message: 'Not authorized to delete this listing' 
// //       });
// //     }

// //     // Only allow deletion of certain statuses
// //     const deletableStatuses = [
// //       'pending_review', 
// //       'auto_approved', 
// //       'rejected', 
// //       'cancelled',
// //       'qa_completed'
// //     ];

// //     if (!deletableStatuses.includes(listing.status)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Cannot delete listing with status "${listing.status}". Only pending, rejected, or cancelled listings can be deleted.`,
// //       });
// //     }

// //     await Listing.findByIdAndDelete(req.params.id);

// //     res.status(200).json({
// //       success: true,
// //       message: 'Listing deleted successfully',
// //       data: {},
// //     });
// //   } catch (error) {
// //     console.error('Delete listing error:', error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: error.message 
// //     });
// //   }
// // };




// // ============================================
// // DELETE LISTING
// // ============================================
// // const deleteListing = async (req, res) => {
// //   try {
// //     const listing = await Listing.findById(req.params.id);

// //     if (!listing) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: 'Listing not found' 
// //       });
// //     }

// //     // Check if user owns this listing or is admin
// //     const isOwner = listing.createdBy.toString() === req.user._id.toString();
// //     const isAdminUser = ['admin', 'super_admin'].includes(req.user.role);
    
// //     if (!isOwner && !isAdminUser) {
// //       return res.status(403).json({ 
// //         success: false, 
// //         message: 'Not authorized to delete this listing' 
// //       });
// //     }

// //     // Admin can delete any listing
// //     if (isAdminUser) {
// //       // If there's a live commodity associated, delete it too
// //       if (listing.liveCommodityId) {
// //         await Commodity.findByIdAndDelete(listing.liveCommodityId);
// //       }
      
// //       await Listing.findByIdAndDelete(req.params.id);

// //       return res.status(200).json({
// //         success: true,
// //         message: 'Listing deleted successfully',
// //         data: {},
// //       });
// //     }

// //     // For non-admin users, only allow deletion of certain statuses
// //     const deletableStatuses = [
// //       'pending_review', 
// //       'auto_approved', 
// //       'rejected', 
// //       'cancelled',
// //       'qa_completed'
// //     ];

// //     if (!deletableStatuses.includes(listing.status)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Cannot delete listing with status "${listing.status}". Only pending, rejected, or cancelled listings can be deleted.`,
// //       });
// //     }

// //     await Listing.findByIdAndDelete(req.params.id);

// //     res.status(200).json({
// //       success: true,
// //       message: 'Listing deleted successfully',
// //       data: {},
// //     });
// //   } catch (error) {
// //     console.error('Delete listing error:', error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: error.message 
// //     });
// //   }
// // };





// // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2 THIS DELETE ALSO REMOVES WAREHOUE INVENTORY 
// // @@@@@@@@@@@@@@@@@@@@@@@@@@@22@@@@@@@@ BUT THE DELETE ABOVE THIS DOES NOT REMOVE WAREHOUSE INVENTORY

// // ============================================
// // DELETE LISTING
// // ============================================
// // const deleteListing = async (req, res) => {
// //   try {
// //     const listing = await Listing.findById(req.params.id);

// //     if (!listing) {
// //       return res.status(404).json({ 
// //         success: false, 
// //         message: 'Listing not found' 
// //       });
// //     }

// //     // Check if user owns this listing or is admin
// //     const isOwner = listing.createdBy.toString() === req.user._id.toString();
// //     const isAdminUser = ['admin', 'super_admin'].includes(req.user.role);
    
// //     if (!isOwner && !isAdminUser) {
// //       return res.status(403).json({ 
// //         success: false, 
// //         message: 'Not authorized to delete this listing' 
// //       });
// //     }

// //     // Admin can delete any listing
// //     if (isAdminUser) {
// //       // Delete associated live commodity if exists
// //       if (listing.liveCommodityId) {
// //         await Commodity.findByIdAndDelete(listing.liveCommodityId);
// //         console.log(`Deleted associated commodity: ${listing.liveCommodityId}`);
// //       }
      
// //       // Delete associated warehouse inventory if exists
// //       if (listing.assignedWarehouse) {
// //         await WarehouseInventory.deleteMany({
// //           warehouse: listing.assignedWarehouse,
// //           commodity: listing.liveCommodityId,
// //         });
// //         console.log(`Deleted associated warehouse inventory for warehouse: ${listing.assignedWarehouse}`);
// //       }
      
// //       await Listing.findByIdAndDelete(req.params.id);

// //       return res.status(200).json({
// //         success: true,
// //         message: 'Listing and all associated records deleted successfully',
// //         data: {},
// //       });
// //     }

// //     // For non-admin users, only allow deletion of certain statuses
// //     const deletableStatuses = [
// //       'pending_review', 
// //       'auto_approved', 
// //       'rejected', 
// //       'cancelled',
// //       'qa_completed'
// //     ];

// //     if (!deletableStatuses.includes(listing.status)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Cannot delete listing with status "${listing.status}". Only pending, rejected, or cancelled listings can be deleted.`,
// //       });
// //     }

// //     await Listing.findByIdAndDelete(req.params.id);

// //     res.status(200).json({
// //       success: true,
// //       message: 'Listing deleted successfully',
// //       data: {},
// //     });
// //   } catch (error) {
// //     console.error('Delete listing error:', error);
// //     res.status(500).json({ 
// //       success: false, 
// //       message: error.message 
// //     });
// //   }
// // };


// // @@@@@@@@@@@@@@@@@ THE DELETE ABOVE WORKS BUT IT LEAVES BEHIND ORPHANED DATA

// // ============================================
// // DELETE LISTING (with cascade delete)
// // ============================================
// const deleteListing = async (req, res) => {
//   try {
//     const listing = await Listing.findById(req.params.id);

//     if (!listing) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Listing not found' 
//       });
//     }

//     // Check if user owns this listing or is admin
//     const isOwner = listing.createdBy.toString() === req.user._id.toString();
//     const isAdminUser = ['admin', 'super_admin'].includes(req.user.role);
    
//     if (!isOwner && !isAdminUser) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Not authorized to delete this listing' 
//       });
//     }

//     // STEP 1: Delete associated live commodity if it exists
//     if (listing.liveCommodityId) {
//       const deletedCommodity = await Commodity.findByIdAndDelete(listing.liveCommodityId);
//       if (deletedCommodity) {
//         console.log(`✅ Deleted commodity: ${listing.liveCommodityId}`);
//       } else {
//         console.log(`⚠️ Commodity not found: ${listing.liveCommodityId}`);
//       }
//     }

//     // STEP 2: Delete any commodity that references this listing
//     const deletedByListingRef = await Commodity.deleteMany({ 
//       listingId: listing._id 
//     });
//     if (deletedByListingRef.deletedCount > 0) {
//       console.log(`✅ Deleted ${deletedByListingRef.deletedCount} commodities by listingId reference`);
//     }

//     // STEP 3: Delete any commodity that has sourceListing reference
//     const deletedBySourceRef = await Commodity.deleteMany({ 
//       sourceListing: listing._id 
//     });
//     if (deletedBySourceRef.deletedCount > 0) {
//       console.log(`✅ Deleted ${deletedBySourceRef.deletedCount} commodities by sourceListing reference`);
//     }

//     // STEP 4: Delete associated warehouse inventory
//     if (listing.assignedWarehouse) {
//       const deletedInventory = await WarehouseInventory.deleteMany({
//         warehouse: listing.assignedWarehouse,
//         $or: [
//           { commodity: listing.liveCommodityId },
//           { commodity: listing._id }
//         ]
//       });
//       if (deletedInventory.deletedCount > 0) {
//         console.log(`✅ Deleted ${deletedInventory.deletedCount} warehouse inventory records`);
//       }
//     }

//     // STEP 5: Finally, delete the listing itself
//     await Listing.findByIdAndDelete(req.params.id);
//     console.log(`✅ Deleted listing: ${req.params.id}`);

//     res.status(200).json({
//       success: true,
//       message: 'Listing and all associated records deleted successfully',
//       data: {},
//     });
//   } catch (error) {
//     console.error('❌ Delete listing error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };





// module.exports = {
//   createListing,
//   getMyListings,
//   getPendingReview,
//   getAwaitingWarehouse,
//   getListingById,
//   approveListing,
//   rejectListing,
//   receiveAtWarehouse,
//   completeQA,
//   getListingStats,
//   getAllListings,
//   deleteListing,
// };