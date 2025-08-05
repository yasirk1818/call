const express = require('express');
const router = express.Router();
const { generateAgoraToken } = require('../controllers/agoraController');
const { protect } = require('../middleware/authMiddleware');

router.post('/token', protect, generateAgoraToken);

module.exports = router;
