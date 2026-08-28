// server/scripts/cleanupOrphanedData.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Commodity = require('../models/Commodity');
const Listing = require('../models/Listing');
const WarehouseInventory = require('../models/WarehouseInventory');

dotenv.config();

const cleanupOrphanedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up orphaned commodities
    const commodities = await Commodity.find({});
    console.log(`📦 Found ${commodities.length} commodities`);
    
    let orphanedCommodityCount = 0;
    
    for (const commodity of commodities) {
      let hasValidListing = false;
      
      // Check listingId field
      if (commodity.listingId) {
        const listing = await Listing.findById(commodity.listingId);
        if (listing) hasValidListing = true;
      }
      
      // Check sourceListing field
      if (!hasValidListing && commodity.sourceListing) {
        const listing = await Listing.findById(commodity.sourceListing);
        if (listing) hasValidListing = true;
      }
      
      // If no valid listing found, delete the commodity
      if (!hasValidListing) {
        console.log(`🗑️ Deleting orphaned commodity: ${commodity.name} (${commodity._id})`);
        await Commodity.findByIdAndDelete(commodity._id);
        orphanedCommodityCount++;
      }
    }
    
    console.log(`\n✅ Deleted ${orphanedCommodityCount} orphaned commodities`);

    // Clean up orphaned warehouse inventory
    const inventories = await WarehouseInventory.find({});
    console.log(`\n📦 Found ${inventories.length} warehouse inventory records`);
    
    let orphanedInventoryCount = 0;
    
    for (const inventory of inventories) {
      let hasValidCommodity = false;
      
      if (inventory.commodity) {
        const commodity = await Commodity.findById(inventory.commodity);
        if (commodity) hasValidCommodity = true;
      }
      
      if (!hasValidCommodity) {
        console.log(`🗑️ Deleting orphaned inventory: ${inventory.commodityName} (${inventory._id})`);
        await WarehouseInventory.findByIdAndDelete(inventory._id);
        orphanedInventoryCount++;
      }
    } 
    
    console.log(`\n✅ Deleted ${orphanedInventoryCount} orphaned inventory records`);
    console.log('\n✅ Cleanup complete!');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanupOrphanedData();