const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

router.post('/scan', attendanceController.scanRFID); // Open for ESP32
router.get('/history', authenticateToken, attendanceController.getHistory);

module.exports = router;
