const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS - allow from anywhere
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/commodities', require('./routes/commodityRoutes'));
app.use('/api/warehouses', require('./routes/warehouseRoutes'));
app.use('/api/farmers', require('./routes/farmerRoutes'));
app.use('/api/commodity-types', require('./routes/commodityTypeRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'Elba Market API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await app.listen(PORT);
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();




































































// const express = require('express');
// const cors = require('cors');
// const morgan = require('morgan');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');

// // Load env vars
// dotenv.config();

// // Connect to database
// connectDB();

// const app = express();

// // Body parser
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Enable CORS
// app.use(cors());

// // Logger
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// // Mount routes
// app.use('/api/commodities', require('./routes/commodityRoutes'));
// app.use('/api/warehouses', require('./routes/warehouseRoutes'));
// app.use('/api/farmers', require('./routes/farmerRoutes'));
// // Mount routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/commodities', require('./routes/commodityRoutes'));
// app.use('/api/warehouses', require('./routes/warehouseRoutes'));
// app.use('/api/farmers', require('./routes/farmerRoutes'));
// app.use('/api/commodity-types', require('./routes/commodityTypeRoutes'));
// app.use('/api/listings', require('./routes/listingRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/orders', require('./routes/orderRoutes'));





// // Health check route
// app.get('/', (req, res) => {
//   res.status(200).json({ 
//     success: true,
//     message: 'Elba Market API is running',
//     version: '1.0.0'
//   });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ 
//     success: false, 
//     message: `Route ${req.originalUrl} not found` 
//   });
// });

// // Error handling middleware (Express 5 signature)
// app.use((err, req, res, next) => {
//   console.error(err.stack);
  
//   res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.message || 'Internal Server Error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   try {
//     await app.listen(PORT);
//     console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
//   } catch (error) {
//     console.error(`Failed to start server: ${error.message}`);
//     process.exit(1);
//   }
// };

// startServer();