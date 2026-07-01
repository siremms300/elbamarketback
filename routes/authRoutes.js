const express = require('express');
const router = express.Router();
const { register, login, getMe, createAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/create-admin', protect, createAdmin); // Will add super_admin check in middleware

module.exports = router;