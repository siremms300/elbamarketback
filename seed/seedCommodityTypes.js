const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const CommodityType = require('../models/CommodityType');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const types = [
  { name: 'Maize', category: 'grains', emoji: '🌽', defaultUnit: 'bag', sortOrder: 1 },
  { name: 'Rice', category: 'grains', emoji: '🍚', defaultUnit: 'bag', sortOrder: 2 },
  { name: 'Millet', category: 'grains', emoji: '🌾', defaultUnit: 'bag', sortOrder: 3 },
  { name: 'Sorghum', category: 'grains', emoji: '🌾', defaultUnit: 'bag', sortOrder: 4 },
  { name: 'Wheat', category: 'grains', emoji: '🌾', defaultUnit: 'bag', sortOrder: 5 },
  { name: 'Soybeans', category: 'legumes', emoji: '🫘', defaultUnit: 'bag', sortOrder: 6 },
  { name: 'Beans', category: 'legumes', emoji: '🫘', defaultUnit: 'bag', sortOrder: 7 },
  { name: 'Groundnuts', category: 'legumes', emoji: '🥜', defaultUnit: 'bag', sortOrder: 8 },
  { name: 'Cassava', category: 'tubers', emoji: '🥔', defaultUnit: 'basket', sortOrder: 9 },
  { name: 'Yam', category: 'tubers', emoji: '🥔', defaultUnit: 'basket', sortOrder: 10 },
  { name: 'Cocoa', category: 'cash_crops', emoji: '🫘', defaultUnit: 'bag', sortOrder: 11 },
  { name: 'Palm Oil', category: 'oil_seeds', emoji: '🫗', defaultUnit: 'litre', sortOrder: 12 },
  { name: 'Sesame', category: 'oil_seeds', emoji: '🌱', defaultUnit: 'bag', sortOrder: 13 },
  { name: 'Ginger', category: 'spices', emoji: '🫚', defaultUnit: 'bag', sortOrder: 14 },
  { name: 'Garlic', category: 'spices', emoji: '🧄', defaultUnit: 'bag', sortOrder: 15 },
  { name: 'Onions', category: 'vegetables', emoji: '🧅', defaultUnit: 'bag', sortOrder: 16 },
  { name: 'Tomatoes', category: 'vegetables', emoji: '🍅', defaultUnit: 'basket', sortOrder: 17 },
  { name: 'Pepper', category: 'spices', emoji: '🌶️', defaultUnit: 'bag', sortOrder: 18 },
  { name: 'Cashew', category: 'cash_crops', emoji: '🥜', defaultUnit: 'bag', sortOrder: 19 },
  { name: 'Shea Butter', category: 'oil_seeds', emoji: '🧈', defaultUnit: 'kg', sortOrder: 20 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await CommodityType.deleteMany({});

    // Use create() instead of insertMany() so the pre-save hook runs
    for (const type of types) {
      await CommodityType.create(type);
    }

    console.log(`Seeded ${types.length} commodity types`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();