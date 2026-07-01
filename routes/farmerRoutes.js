const express = require('express');
const router = express.Router();
const {
  getFarmers,
  getFarmerById,
  registerFarmer,
  updateFarmer,
  verifyFarmer,
} = require('../controllers/farmerController');

router.route('/')
  .get(getFarmers)
  .post(registerFarmer);

router.route('/:id')
  .get(getFarmerById)
  .put(updateFarmer);

router.route('/:id/verify')
  .put(verifyFarmer);

module.exports = router;