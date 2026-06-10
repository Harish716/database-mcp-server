const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/items', authenticateToken, rewardController.getMarketplace);
router.post('/redeem', authenticateToken, requireRole('student'), rewardController.redeem);

module.exports = router;
