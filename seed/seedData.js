const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Commodity = require('../models/Commodity');
const Warehouse = require('../models/Warehouse');
const Farmer = require('../models/Farmer');

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const nigerianStates = [
  'Kaduna', 'Kano', 'Oyo', 'Ogun', 'Benue', 'Niger', 'Kebbi',
  'Plateau', 'Taraba', 'Kogi', 'Kwara', 'Katsina', 'Zamfara',
  'Bauchi', 'Gombe', 'Adamawa', 'Borno', 'Yobe', 'Jigawa',
  'Sokoto', 'Nasarawa', 'Ebonyi', 'Enugu', 'Anambra', 'Imo',
  'Abia', 'Cross River', 'Akwa Ibom', 'Rivers', 'Delta', 'Edo',
  'Ondo', 'Ekiti', 'Osun', 'Lagos', 'Bayelsa',
];

const commodityNames = [
  'Maize', 'Rice', 'Soybeans', 'Millet', 'Sorghum',
  'Cassava', 'Yam', 'Cocoa', 'Groundnuts', 'Palm Oil',
  'Beans', 'Sesame', 'Ginger', 'Garlic', 'Onions',
];

const lgasByState = {
  Kaduna: ['Zaria', 'Kaduna North', 'Kaduna South', 'Kachia', 'Birnin Gwari'],
  Kano: ['Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Nassarawa'],
  Oyo: ['Ibadan North', 'Ibadan South', 'Ogbomosho', 'Oyo East', 'Ibarapa'],
  Benue: ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Vandeikya'],
  Niger: ['Minna', 'Suleja', 'Kontagora', 'Bida', 'Lapai'],
  Lagos: ['Ikeja', 'Surulere', 'Lagos Island', 'Eti-Osa', 'Alimosho'],
};

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      Commodity.deleteMany({}),
      Warehouse.deleteMany({}),
      Farmer.deleteMany({}),
    ]);
    console.log('Existing data cleared');

    // Create warehouses
    console.log('Creating warehouses...');
    const warehouses = [];
    for (let i = 0; i < 10; i++) {
      const state = getRandomElement(nigerianStates);
      const warehouse = await Warehouse.create({
        name: `Elba Warehouse ${String.fromCharCode(65 + i)}`,
        code: `ELB-WH-${String.fromCharCode(65 + i)}${Math.floor(Math.random() * 900 + 100)}`,
        location: {
          state,
          lga: 'Central',
          community: `Industrial District ${i + 1}`,
          address: `Plot ${i + 1}, Warehouse Road`,
          coordinates: {
            lat: 6.5 + Math.random() * 6,
            lng: 3.0 + Math.random() * 10,
          },
        },
        capacity: {
          total: 1000 + Math.floor(Math.random() * 5000),
          used: Math.floor(Math.random() * 800),
        },
        security: {
          hasSecurityPersonnel: true,
          hasCCTV: Math.random() > 0.3,
          hasFencing: true,
          hasInsurance: Math.random() > 0.4,
          insuranceProvider: Math.random() > 0.4 ? 'Leadway Assurance' : null,
        },
        services: ['storage', 'grading', 'bagging', 'fumigation'],
        manager: {
          name: `Warehouse Manager ${i + 1}`,
          phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `warehouse${String.fromCharCode(97 + i)}@elbamarket.com`,
        },
        status: 'active',
        warehouseLayout: {
          sections: [
            {
              sectionId: `SEC-${i}-A`,
              sectionName: 'Grains Section',
              capacity: 500,
              currentOccupancy: Math.floor(Math.random() * 400),
              commodities: ['Maize', 'Rice', 'Millet', 'Sorghum'],
            },
            {
              sectionId: `SEC-${i}-B`,
              sectionName: 'Legumes & Oil Seeds',
              capacity: 300,
              currentOccupancy: Math.floor(Math.random() * 200),
              commodities: ['Beans', 'Groundnuts', 'Soybeans', 'Sesame'],
            },
          ],
        },
        proximityToTransport: {
          nearestHighway: `${['A1', 'A2', 'A3', 'A121', 'A232'][Math.floor(Math.random() * 5)]} Highway`,
          distanceToHighwayKm: Math.floor(Math.random() * 15) + 1,
        },
      });
      warehouses.push(warehouse);
    }
    console.log(`Created ${warehouses.length} warehouses`);

    // Create farmers
    console.log('Creating farmers...');
    const farmers = [];
    const lastNames = ['Ibrahim', 'Okonkwo', 'Adeyemi', 'Musa', 'Obi', 'Eze', 'Bello', 'Danladi', 'Akintola', 'Nnamdi'];
    
    for (let i = 0; i < 30; i++) {
      const state = getRandomElement(nigerianStates);
      const farmer = await Farmer.create({
        phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        phoneVerified: Math.random() > 0.2,
        fullName: `Farmer ${getRandomElement(lastNames)} ${i + 1}`,
        location: { 
          state, 
          lga: lgasByState[state] ? getRandomElement(lgasByState[state]) : 'Central',
          community: `Farming Community ${Math.floor(Math.random() * 50) + 1}` 
        },
        farmDetails: {
          size: 0.5 + Math.random() * 25,
          primaryCrops: [getRandomElement(commodityNames), getRandomElement(commodityNames)],
          yearsOfExperience: 2 + Math.floor(Math.random() * 30),
          farmType: getRandomElement(['crop', 'mixed']),
        },
        verificationTier: getRandomElement(['registered', 'verified', 'trusted']),
        ratings: {
          average: Math.round((2 + Math.random() * 3) * 10) / 10,
          count: Math.floor(Math.random() * 50),
        },
        totalTransactions: Math.floor(Math.random() * 100),
        status: 'active',
        registrationMethod: getRandomElement(['self', 'cooperative_bulk', 'field_agent']),
      });
      farmers.push(farmer);
    }
    console.log(`Created ${farmers.length} farmers`);

    // Create commodities
    console.log('Creating commodities...');
    const units = ['bag', 'kg', 'ton', 'basket'];
    const locationTypes = ['farm', 'warehouse', 'collection_center', 'market'];
    const commodities = [];

    for (let i = 0; i < 80; i++) {
      const state = getRandomElement(nigerianStates);
      const name = getRandomElement(commodityNames);
      const unit = getRandomElement(units);
      const locationType = getRandomElement(locationTypes);
      const quantity = 10 + Math.floor(Math.random() * 2000);
      const sellerType = Math.random() > 0.3 ? 'farmer' : 'warehouse';
      
      const sellerId = sellerType === 'farmer' 
        ? getRandomElement(farmers)._id 
        : getRandomElement(warehouses)._id;
      
      const sellerName = sellerType === 'farmer'
        ? farmers.find(f => f._id.equals(sellerId))?.fullName || 'Unknown Farmer'
        : warehouses.find(w => w._id.equals(sellerId))?.name || 'Unknown Warehouse';

      const commodity = await Commodity.create({
        name,
        grade: getRandomElement(['A', 'B', 'C']),
        quantity: { amount: quantity, unit },
        price: {
          amount: 2000 + Math.floor(Math.random() * 50000),
          currency: 'NGN',
          perUnit: unit,
          negotiable: Math.random() > 0.3,
        },
        location: {
          state,
          lga: lgasByState[state] ? getRandomElement(lgasByState[state]) : 'Central',
          community: `${locationType === 'warehouse' ? 'Warehouse District' : 'Supply Point'} ${Math.floor(Math.random() * 30)}`,
          coordinates: {
            lat: 6.0 + Math.random() * 8,
            lng: 3.0 + Math.random() * 12,
          },
          locationType,
          warehouseId: locationType === 'warehouse' ? getRandomElement(warehouses)._id : null,
        },
        harvestDate: new Date(Date.now() - Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000),
        moistureContent: locationType === 'warehouse' 
          ? 8 + Math.random() * 4  // Warehouse stored = lower moisture
          : 10 + Math.random() * 8, // Farm fresh = variable moisture
        seller: {
          sellerType,
          sellerId,
          name: sellerName,
          verificationTier: sellerType === 'warehouse' ? 'trusted' : getRandomElement(['registered', 'verified', 'trusted']),
          rating: Math.round((2 + Math.random() * 3) * 10) / 10,
          totalTransactions: Math.floor(Math.random() * 100),
        },
        status: 'active',
        minimumOrder: Math.max(1, Math.floor(quantity * (0.01 + Math.random() * 0.1))),
        qualityCertification: {
          hasCertification: locationType === 'warehouse' || Math.random() > 0.7,
          certifyingBody: Math.random() > 0.6 ? 'NAFDAC' : null,
        },
      });
      commodities.push(commodity);
    }
    console.log(`Created ${commodities.length} commodities`);

    console.log('\n✅ Seeding completed successfully!');
    console.log(`   - ${warehouses.length} Warehouses`);
    console.log(`   - ${farmers.length} Farmers`);
    console.log(`   - ${commodities.length} Active Commodity Listings`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedData();