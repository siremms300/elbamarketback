const express = require('express');
const router = express.Router();
const {
  getCommodities,
  getCommodityById,
  createCommodity,
  updateCommodity,
  getCommodityStats,
} = require('../controllers/commodityController');

router.route('/').get(getCommodities).post(createCommodity);
router.route('/stats').get(getCommodityStats);
router.route('/:id').get(getCommodityById).put(updateCommodity);

module.exports = router;