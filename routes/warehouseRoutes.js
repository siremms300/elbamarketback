const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  getWarehouseInventory,
  receiveInventory,
  releaseInventory,
} = require('../controllers/warehouseController');

router.route('/')
  .get(getWarehouses)
  .post(createWarehouse);

router.route('/:id')
  .get(getWarehouseById)
  .put(updateWarehouse);

router.route('/:id/inventory')
  .get(getWarehouseInventory)
  .post(receiveInventory);

router.route('/:id/inventory/release')
  .post(releaseInventory);

module.exports = router;